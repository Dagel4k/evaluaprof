export interface Professor {
  nombre: string;
  universidad: string;
  ciudad?: string;
  departamento: string;
  calidad_general: number;
  porcentaje_recomienda: number;
  nivel_dificultad: number;
  etiquetas: string[];
  numero_calificaciones: number;
  calificaciones: Calificacion[];
  // Campos adicionales del formato enriquecido
  analisis_avanzado?: {
    sentiment_score?: number;
    trust_score?: number;
    quality_trend?: number[];
    forecast_quality?: number;
  };
}

export interface ProfessorError {
  professor_id: string;
  error: string;
  filename?: string;
}

export interface LoadResult {
  professors: Professor[];
  errors: ProfessorError[];
}

export interface Calificacion {
  fecha: string;
  tipo_calificacion?: string;
  puntaje_calidad_general: number;
  puntaje_facilidad?: number;
  materia: string;
  asistencia?: string;
  calificacion_recibida?: string;
  interes_clase?: string;
  comentario: string;
  etiquetas_comentario?: string[];
  votos_utiles?: string;
  votos_no_utiles?: string;
}

export interface Filters {
  materia: string;
  promedio_minimo: number;
  dificultad_maxima: number;
  // Filtros avanzados
  confiabilidad_minima?: number;
  sentimiento?: 'positivo' | 'neutro' | 'negativo' | '';
  tendencia?: 'mejorando' | 'estable' | 'declinando' | '';
  solo_con_analisis_avanzado?: boolean;
  min_reviews?: number;
}