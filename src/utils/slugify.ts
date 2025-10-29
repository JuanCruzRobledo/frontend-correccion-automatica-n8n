/**
 * Utilidades para generar slugs (IDs amigables) desde texto
 */

/**
 * Genera un slug desde un texto
 * Convierte "UTN - Facultad Regional Mendoza" → "utn-facultad-regional-mendoza"
 *
 * @param text - Texto a convertir
 * @param maxLength - Longitud máxima del slug (default: 50)
 * @returns Slug generado
 */
export const generateSlug = (text: string, maxLength: number = 50): string => {
  if (!text || typeof text !== 'string') return '';

  return text
    .toLowerCase()                              // Convertir a minúsculas
    .normalize('NFD')                           // Normalizar caracteres Unicode
    .replace(/[\u0300-\u036f]/g, '')           // Eliminar acentos
    .replace(/[^a-z0-9\s-]/g, '')              // Eliminar caracteres especiales (mantener espacios y guiones)
    .trim()                                     // Eliminar espacios al inicio/fin
    .replace(/[\s_]+/g, '-')                   // Reemplazar espacios y guiones bajos por guiones
    .replace(/-+/g, '-')                       // Reemplazar múltiples guiones por uno solo
    .replace(/^-+|-+$/g, '')                   // Eliminar guiones al inicio/fin
    .slice(0, maxLength);                       // Limitar longitud
};

/**
 * Genera un ID sugerido para universidad
 * Ej: "UTN - Facultad Regional Mendoza" → "utn-frm"
 *
 * @param name - Nombre de la universidad
 * @returns ID sugerido
 */
export const suggestUniversityId = (name: string): string => {
  if (!name) return '';

  // Intentar extraer siglas/acrónimos
  const words = name
    .toUpperCase()
    .split(/[\s-]+/)
    .filter(word => word.length > 0);

  // Si tiene formato "UTN - Facultad Regional Mendoza", extraer "UTN" y siglas de "FRM"
  if (words.length >= 2 && words[0].length <= 5) {
    const mainAcronym = words[0].toLowerCase();

    // Buscar después del guión o "facultad"
    const indexAfterDash = words.findIndex(w => w === 'FACULTAD' || w === 'REGIONAL');

    if (indexAfterDash > 0) {
      const regionalWords = words.slice(indexAfterDash + 1);
      const regionalAcronym = regionalWords
        .filter(w => w.length > 2) // Solo palabras significativas
        .map(w => w[0])
        .join('');

      if (regionalAcronym.length > 0) {
        return `${mainAcronym}-${regionalAcronym.toLowerCase()}`;
      }
    }
  }

  // Fallback: usar slug completo pero limitado
  return generateSlug(name, 30);
};

/**
 * Genera un ID sugerido para curso/materia
 * Ej: year=2025, courseName="Programación 1" → "2025-programacion-1"
 *
 * @param year - Año del curso (YYYY)
 * @param courseName - Nombre del curso
 * @returns ID sugerido
 */
export const suggestCourseId = (year: number | string, courseName: string): string => {
  if (!courseName) return '';

  const courseSlug = generateSlug(courseName, 40);

  if (year) {
    return `${year}-${courseSlug}`;
  }

  return courseSlug;
};

/**
 * Valida si un ID tiene el formato correcto
 * Solo permite: letras minúsculas, números y guiones
 *
 * @param id - ID a validar
 * @returns true si es válido
 */
export const isValidId = (id: string): boolean => {
  if (!id) return false;
  return /^[a-z0-9-]+$/.test(id);
};

/**
 * Limpia un ID ingresado manualmente para que sea válido
 *
 * @param id - ID a limpiar
 * @returns ID limpio
 */
export const cleanId = (id: string): string => {
  return id
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};
