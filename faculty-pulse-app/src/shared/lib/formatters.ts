export function capitalizeName(name: string): string {
  if (!name) return '';
  // Lista de palabras que no deben capitalizarse (preposiciones, conjunciones, artículos)
  const minorWords = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'en', 'un', 'una', 'con', 'por']);
  
  return name
    .toLowerCase()
    .split(' ')
    .filter(word => word.trim() !== '') // Eliminar espacios extra
    .map((word, index) => {
      // Siempre capitalizar la primera palabra
      if (index === 0) return word.charAt(0).toUpperCase() + word.slice(1);
      // Si es una palabra menor, dejarla en minúscula
      if (minorWords.has(word)) return word;
      // Capitalizar otras palabras
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Normaliza el nombre de una materia para agrupar variaciones.
 * Ej: "CALCULO VECTORIAL", "Calculo Vectorial", "cálculo vectorial" -> "Calculo Vectorial"
 * Elimina acentos, normaliza espacios y convierte a Title Case.
 */
export function normalizeSubject(subject: string): string {
  if (!subject) return '';
  
  // 1. Eliminar acentos
  const noAccents = subject.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // 2. Convertir a Title Case usando la función existente (que ya maneja espacios y casing)
  return capitalizeName(noAccents);
}
