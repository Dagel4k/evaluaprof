export interface Professor {
  nombre: string;
  universidad: string;
  departamento: string;
  promedio_general: number;
  porcentaje_recomienda: number;
  dificultad_promedio: number;
  etiquetas: string[];
  numero_calificaciones: number;
  calificaciones: Calificacion[];
}

export interface Calificacion {
  fecha: string;
  materia: string;
  calificacion_general: number;
  comentario: string;
}

export interface Filters {
  materia: string;
  promedio_minimo: number;
  dificultad_maxima: number;
}