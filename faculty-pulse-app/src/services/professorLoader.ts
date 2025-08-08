import { Professor, ProfessorError, LoadResult } from '@/types/professor';

export class ProfessorLoaderService {
  // En producción (APK), los JSON se sirven desde `public/profesores_enriquecido`
  private static readonly PROFESSORS_DIR = '/profesores_enriquecido/';

  /**
   * Carga automáticamente todos los archivos JSON de profesores
   */
  static async loadAllProfessors(
    onProgress?: (current: number, total: number, loaded: number, errors: number) => void
  ): Promise<LoadResult> {
    try {
      console.log('Obteniendo lista de archivos JSON...');
      // 1) Intentar lista pre-generada embebida en producción
      //    `public/profesores_enriquecido/fileList.json`
      const embeddedListUrl = `${this.PROFESSORS_DIR}fileList.json`;
      let fileList: string[] | null = null;

      try {
        const embeddedResponse = await fetch(embeddedListUrl);
        if (embeddedResponse.ok) {
          fileList = await embeddedResponse.json();
          console.log(`Lista embebida encontrada: ${fileList.length} archivos`);
        } else {
          console.warn('Lista embebida no disponible:', embeddedResponse.status);
        }
      } catch (e) {
        console.warn('No se pudo cargar la lista embebida:', e);
      }

      // 2) Fallback a endpoint de desarrollo de Vite
      if (!fileList) {
        try {
          const devResponse = await fetch('/api/professors-list');
          if (devResponse.ok) {
            fileList = await devResponse.json();
            console.log(`Lista de desarrollo obtenida: ${fileList.length} archivos`);
          } else {
            console.error('Endpoint de desarrollo no disponible:', devResponse.status);
          }
        } catch (e) {
          console.error('Error consultando endpoint de desarrollo:', e);
        }
      }

      if (!fileList) {
        return { professors: [], errors: [] };
      }

      return await this.loadProfessorsFromFiles(fileList, onProgress);
    } catch (error) {
      console.error('Error cargando profesores:', error);
      return { professors: [], errors: [] };
    }
  }

  /**
   * Carga profesores desde una lista de archivos
   */
  private static async loadProfessorsFromFiles(
    fileList: string[], 
    onProgress?: (current: number, total: number, loaded: number, errors: number) => void
  ): Promise<LoadResult> {
    const professors: Professor[] = [];
    const errors: ProfessorError[] = [];
    const maxConcurrent = 5; // Reducir requests concurrentes para evitar sobrecarga
    
    console.log(`Iniciando carga de ${fileList.length} archivos...`);
    
    // Inicializar progreso
    onProgress?.(0, fileList.length, 0, 0);
    
    for (let i = 0; i < fileList.length; i += maxConcurrent) {
      const batch = fileList.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(async (filename) => {
        try {
          console.log(`Intentando cargar: ${filename}`);
          const response = await fetch(`${this.PROFESSORS_DIR}${filename}`);
          console.log(`Respuesta para ${filename}:`, response.status, response.statusText);
          
          if (response.ok) {
            const data = await response.json();
            
            // Verificar si es un archivo de error
            if (data.error && data.professor_id) {
              return {
                type: 'error',
                data: {
                  professor_id: data.professor_id,
                  error: data.error,
                  filename: filename
                }
              };
            }
            
            // Intentar validar como profesor normal
            const professor = this.validateAndTransformProfessor(data);
            if (professor) {
              return {
                type: 'professor',
                data: professor
              };
            }
          } else {
            console.warn(`Error ${response.status} para ${filename}`);
            return {
              type: 'error',
              data: {
                professor_id: filename.replace('.json', ''),
                error: `Error HTTP ${response.status}`,
                filename: filename
              }
            };
          }
        } catch (error) {
          console.warn(`Error cargando ${filename}:`, error);
          return {
            type: 'error',
            data: {
              professor_id: filename.replace('.json', ''),
              error: `Error de carga: ${error}`,
              filename: filename
            }
          };
        }
        return null;
      });

      const batchResults = await Promise.all(batchPromises);
      
      // Procesar resultados del lote
      for (const result of batchResults) {
        if (result?.type === 'professor') {
          professors.push(result.data as Professor);
        } else if (result?.type === 'error') {
          errors.push(result.data as ProfessorError);
        }
      }
      
      // Actualizar progreso después de cada lote
      const processedCount = Math.min(i + maxConcurrent, fileList.length);
      onProgress?.(processedCount, fileList.length, professors.length, errors.length);
      
      // Pequeña pausa entre lotes para no sobrecargar
      if (i + maxConcurrent < fileList.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Cargados ${professors.length} profesores y ${errors.length} errores`);
    return { professors, errors };
  }

  /**
   * Valida y transforma los datos del profesor al formato esperado
   */
  private static validateAndTransformProfessor(data: any): Professor | null {
    try {
      // Validar campos requeridos del formato enriquecido
      if (!data.nombre || !data.universidad) {
        console.warn('Datos de profesor incompletos:', data);
        return null;
      }

      // Extraer departamento de la primera materia si no está disponible directamente
      const departamento = data.departamento || 
        (data.reviews_public && data.reviews_public.length > 0 ? 
          data.reviews_public[0].materia : 'No especificado');

      // Calcular métricas desde el análisis enriquecido
      const calidad_general = data.decay_analysis?.quality_decayed || 
                             data.bayes_analysis?.quality_bayes || 0;
      
      const porcentaje_recomienda = data.recommendation_analysis?.rate ? 
                                   data.recommendation_analysis.rate * 100 : 0;
      
      const nivel_dificultad = data.decay_analysis?.difficulty_decayed || 
                              data.bayes_analysis?.difficulty_bayes || 0;

      // Transformar reviews_public a calificaciones
      const calificaciones = (data.reviews_public || []).map((review: any) => ({
        fecha: review.fecha_iso ? new Date(review.fecha_iso).toLocaleDateString('es-ES') : '',
        tipo_calificacion: review.calidad >= 8 ? 'BUENO' : review.calidad >= 6 ? 'REGULAR' : 'MALO',
        puntaje_calidad_general: review.calidad || 0,
        puntaje_facilidad: review.dificultad || null,
        materia: review.materia || '',
        asistencia: null,
        calificacion_recibida: review.nota ? review.nota.toString() : null,
        interes_clase: null,
        comentario: review.comentario || '',
        etiquetas_comentario: null,
        votos_utiles: null,
        votos_no_utiles: null
      }));

      // Extraer etiquetas desde los temas de NLP si están disponibles
      const etiquetas = data.nlp_analysis?.topics ? 
        data.nlp_analysis.topics.flatMap((topic: any) => topic.words || []) : [];

      const professor: Professor = {
        nombre: data.nombre,
        universidad: data.universidad,
        ciudad: null, // No está disponible en el formato enriquecido
        departamento: departamento,
        calidad_general: calidad_general,
        porcentaje_recomienda: porcentaje_recomienda,
        nivel_dificultad: nivel_dificultad,
        etiquetas: etiquetas.slice(0, 5), // Limitar a 5 etiquetas principales
        numero_calificaciones: data.n_reviews || 0,
        calificaciones: calificaciones,
        // Incluir análisis avanzado
        analisis_avanzado: {
          sentiment_score: data.nlp_analysis?.sentiment?.overall || null,
          trust_score: data.integrity_analysis?.trust_score || null,
          quality_trend: data.trends_analysis?.quality_trend?.series || null,
          forecast_quality: data.trends_analysis?.forecast?.quality_next || null
        }
      };

      return professor;
    } catch (error) {
      console.error('Error transformando datos del profesor:', error);
      return null;
    }
  }

  /**
   * Busca profesores por término de búsqueda
   */
  static async searchProfessors(searchTerm: string): Promise<Professor[]> {
    const result = await this.loadAllProfessors();
    
    return result.professors.filter(professor => 
      professor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professor.universidad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professor.departamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (professor.ciudad && professor.ciudad.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }
}

export const professorLoaderService = new ProfessorLoaderService();
