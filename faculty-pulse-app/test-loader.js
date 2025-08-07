// Script de prueba para verificar que el loader funciona con el nuevo formato
const fs = require('fs');
const path = require('path');

// Simular el proceso de transformación
function validateAndTransformProfessor(data) {
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
    const calificaciones = (data.reviews_public || []).map((review) => ({
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
      data.nlp_analysis.topics.flatMap((topic) => topic.words || []) : [];

    const professor = {
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

// Probar con el archivo de Aaron Cuen Marquez
const testFile = path.resolve(__dirname, '../scraper/out/profesores_enriquecido/Aaron_Cuen_Marquez.json');
const rawData = JSON.parse(fs.readFileSync(testFile, 'utf-8'));

console.log('Datos originales:');
console.log('- Nombre:', rawData.nombre);
console.log('- Universidad:', rawData.universidad);
console.log('- N Reviews:', rawData.n_reviews);
console.log('- Quality Decayed:', rawData.decay_analysis?.quality_decayed);
console.log('- Recommendation Rate:', rawData.recommendation_analysis?.rate);

const transformed = validateAndTransformProfessor(rawData);

console.log('\nDatos transformados:');
console.log('- Nombre:', transformed.nombre);
console.log('- Universidad:', transformed.universidad);
console.log('- Departamento:', transformed.departamento);
console.log('- Calidad General:', transformed.calidad_general);
console.log('- Porcentaje Recomienda:', transformed.porcentaje_recomienda);
console.log('- Número Calificaciones:', transformed.numero_calificaciones);
console.log('- Etiquetas:', transformed.etiquetas);
console.log('- Análisis Avanzado:', transformed.analisis_avanzado);

console.log('\n✅ Transformación exitosa!');
