// Colores de estado
export const STATUS_COLORS = {
  success: 'text-green-600',
  warning: 'text-yellow-600',
  danger: 'text-red-600',
  neutral: 'text-gray-600',
};

// Umbrales de calificación
export const GRADE_THRESHOLDS = {
  excellent: 8.5,
  good: 8.0,
  passing: 6.0,
};

// Umbrales de recomendación (%)
export const RECOMMENDATION_THRESHOLDS = {
  high: 80,
  medium: 60,
};

// Umbrales de dificultad
export const DIFFICULTY_THRESHOLDS = {
  easy: 2,
  moderate: 3.5,
};

// Configuración de palabras ignoradas en WordCloud
export const IGNORED_WORDS = new Set([
  'comentario esperando', 'esperando revision', 'esperando revisión', '', 'undefined',
  'la', 'el', 'en', 'y', 'de', 'que', 'es', 'un', 'una', 'con', 'por', 'los', 'las', 'del', 'al', 'lo'
]);

// Configuración de sentimientos
export const SENTIMENT_LABELS = {
  positive: 'Positivo',
  neutral: 'Neutro',
  negative: 'Negativo',
};

// Etiquetas positivas y negativas comunes
export const POSITIVE_TAGS = new Set([
  'paciente', 'claro', 'experto', 'bueno', 'amable', 'recomendado', 'didáctico', 'responsable', 'puntual', 'accesible', 'excelente', 'barco'
]);

export const NEGATIVE_TAGS = new Set([
  'estricto', 'impuntual', 'malo', 'difícil', 'exigente', 'desorganizado', 'injusto', 'pesimo', 'aburrido'
]);
