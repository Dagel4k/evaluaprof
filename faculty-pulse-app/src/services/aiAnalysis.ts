import { Professor } from '@/types/professor';

export interface AIAnalysisResult {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  overallRating: number;
  difficultyAssessment: string;
  teachingStyle: string;
  studentAdvice: string;
}

export class AIAnalysisService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'https://api.openai.com/v1/chat/completions';
  }

  private getApiKey(): string {
    // Primero intentar obtener de variables de entorno
    const envApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (envApiKey) {
      return envApiKey;
    }

    // Si no está en el entorno, obtener del localStorage
    const storedApiKey = localStorage.getItem('openai_api_key');
    return storedApiKey || '';
  }

  private async makeRequest(prompt: string): Promise<string> {
    const apiKey = this.getApiKey();
    
    if (!apiKey) {
      throw new Error('NO_API_KEY');
    }

    // Verificar formato de la API key
    if (!apiKey.startsWith('sk-')) {
      throw new Error('API key de OpenAI inválida. Debe comenzar con "sk-"');
    }

    try {
      console.log('Enviando solicitud a OpenAI...');
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo', // Cambiado de gpt-4 a gpt-3.5-turbo para diagnóstico
          messages: [
            {
              role: 'system',
              content: `Eres un experto analista educativo especializado en evaluar perfiles de profesores universitarios. 
              Debes analizar los datos proporcionados y dar un veredicto objetivo y constructivo.
              Responde siempre en español y usa un tono profesional pero accesible.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1500,
          temperature: 0.7,
        }),
      });

      console.log('Respuesta de OpenAI:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error completo de la API:', errorText);
        
        if (response.status === 403) {
          throw new Error(`Error 403: Verifica que tu API key sea válida y tenga permisos para usar GPT-3.5-turbo. Detalles: ${errorText}`);
        } else if (response.status === 401) {
          throw new Error(`Error 401: API key inválida o expirada. Verifica tu clave en OpenAI.`);
        } else if (response.status === 429) {
          throw new Error(`Error 429: Límite de uso excedido. Intenta más tarde.`);
        } else {
          throw new Error(`Error en la API: ${response.status} ${response.statusText}. Detalles: ${errorText}`);
        }
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error completo en análisis de IA:', error);
      throw error;
    }
  }

  private formatProfessorData(professor: Professor): string {
    const subjects = [...new Set(professor.calificaciones.map(c => c.materia))];
    const recentReviews = professor.calificaciones.slice(0, 5);
    
    return `
DATOS DEL PROFESOR:
- Nombre: ${professor.nombre}
- Universidad: ${professor.universidad}
${professor.ciudad ? `- Ciudad: ${professor.ciudad}` : ''}
- Departamento: ${professor.departamento}
- Calidad General: ${professor.calidad_general}/10
- Porcentaje de Recomendación: ${professor.porcentaje_recomienda}%
- Nivel de Dificultad: ${professor.nivel_dificultad}/5
- Número de Calificaciones: ${professor.numero_calificaciones}

CARACTERÍSTICAS (ETIQUETAS):
${professor.etiquetas.map(tag => `- ${tag}`).join('\n')}

MATERIAS IMPARTIDAS:
${subjects.map(subject => `- ${subject}`).join('\n')}

RESEÑAS RECIENTES:
${recentReviews.map(review => `
Materia: ${review.materia}
Calificación: ${review.puntaje_calidad_general}/10
${review.tipo_calificacion ? `Tipo: ${review.tipo_calificacion}` : ''}
${review.asistencia ? `Asistencia: ${review.asistencia}` : ''}
${review.calificacion_recibida ? `Calificación Recibida: ${review.calificacion_recibida}` : ''}
${review.interes_clase ? `Interés en Clase: ${review.interes_clase}` : ''}
Fecha: ${review.fecha}
Comentario: ${review.comentario}
${review.etiquetas_comentario && review.etiquetas_comentario.length > 0 ? `Etiquetas: ${review.etiquetas_comentario.join(', ')}` : ''}
`).join('\n')}
    `.trim();
  }

  async analyzeProfessor(professor: Professor): Promise<AIAnalysisResult> {
    const professorData = this.formatProfessorData(professor);
    
    const prompt = `
${professorData}

Basándote en estos datos, proporciona un análisis completo del profesor. Responde en formato JSON con la siguiente estructura:

{
  "summary": "Resumen ejecutivo del profesor en 2-3 oraciones",
  "strengths": ["Fortaleza 1", "Fortaleza 2", "Fortaleza 3"],
  "weaknesses": ["Debilidad 1", "Debilidad 2"],
  "recommendations": ["Recomendación 1", "Recomendación 2"],
  "overallRating": 8.5,
  "difficultyAssessment": "Descripción del nivel de dificultad",
  "teachingStyle": "Descripción del estilo de enseñanza",
  "studentAdvice": "Consejo específico para estudiantes"
}

Considera:
- La calidad general y su contexto
- El porcentaje de recomendación
- Las etiquetas características
- Los comentarios de las reseñas
- El nivel de dificultad reportado
- La variedad de materias impartidas
- Información adicional como asistencia, calificaciones recibidas, etc.

Sé objetivo, constructivo y proporciona insights útiles para estudiantes.
    `;

    try {
      const response = await this.makeRequest(prompt);
      
      // Intentar parsear la respuesta JSON
      try {
        const analysis = JSON.parse(response);
        return analysis as AIAnalysisResult;
      } catch (parseError) {
        // Si no se puede parsear como JSON, crear un análisis básico
        return {
          summary: response.substring(0, 200) + "...",
          strengths: ["Análisis disponible en el texto completo"],
          weaknesses: [],
          recommendations: [],
          overallRating: professor.calidad_general,
          difficultyAssessment: `Nivel ${professor.nivel_dificultad}/5`,
          teachingStyle: "Analizado en el resumen",
          studentAdvice: "Revisa el análisis completo para recomendaciones específicas"
        };
      }
    } catch (error) {
      throw new Error(`Error en el análisis de IA: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  async getQuickAnalysis(professor: Professor): Promise<string> {
    const professorData = this.formatProfessorData(professor);
    
    const prompt = `
${professorData}

Proporciona un análisis rápido y conciso (máximo 3 párrafos) del profesor, incluyendo:
1. Evaluación general de su desempeño
2. Principales fortalezas y áreas de mejora
3. Recomendación para estudiantes

Responde en español de manera clara y directa.
    `;

    return await this.makeRequest(prompt);
  }
}

export const aiAnalysisService = new AIAnalysisService(); 