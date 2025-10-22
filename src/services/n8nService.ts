/**
 * Servicio de n8n
 * Maneja las llamadas directas a los webhooks de n8n desde el frontend
 */

const RUBRIC_WEBHOOK_URL = import.meta.env.VITE_RUBRIC_WEBHOOK_URL;
const GRADING_WEBHOOK_URL = import.meta.env.VITE_GRADING_WEBHOOK_URL;

/**
 * Genera una rúbrica JSON a partir de un archivo PDF
 * Llama directamente al webhook de n8n configurado
 */
export const generateRubricFromPDF = async (pdfFile: File): Promise<object> => {
  if (!RUBRIC_WEBHOOK_URL) {
    throw new Error(
      'La URL del webhook de rúbricas no está configurada. Verifica VITE_RUBRIC_WEBHOOK_URL en .env'
    );
  }

  const formData = new FormData();
  formData.append('pdf', pdfFile);

  try {
    const response = await fetch(RUBRIC_WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error ${response.status} al generar rúbrica: ${errorText || response.statusText}`
      );
    }

    const contentType = response.headers.get('content-type');

    // Si la respuesta es JSON, parsearlo
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    // Si es texto plano, intentar parsearlo como JSON
    const textResponse = await response.text();

    try {
      return JSON.parse(textResponse);
    } catch {
      // Si no es JSON válido, retornar como objeto con el texto
      throw new Error(
        'La respuesta del webhook no es un JSON válido: ' + textResponse.substring(0, 200)
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al generar rúbrica desde PDF');
  }
};

/**
 * Corrige una entrega usando una rúbrica y un archivo de entrega
 * Llama directamente al webhook de n8n configurado
 */
export const gradeSubmission = async (
  rubricJson: object,
  submissionFile: File
): Promise<object> => {
  if (!GRADING_WEBHOOK_URL) {
    throw new Error(
      'La URL del webhook de corrección no está configurada. Verifica VITE_GRADING_WEBHOOK_URL en .env'
    );
  }

  const formData = new FormData();
  const rubricBlob = new Blob([JSON.stringify(rubricJson)], {
    type: 'application/json',
  });
  formData.append('rubric', rubricBlob, 'rubrica.json');
  formData.append('submission', submissionFile);

  try {
    const response = await fetch(GRADING_WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error ${response.status} al corregir entrega: ${errorText || response.statusText}`
      );
    }

    const contentType = response.headers.get('content-type');

    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    const textResponse = await response.text();

    try {
      return JSON.parse(textResponse);
    } catch {
      // Retornar como objeto con el texto
      return { result: textResponse };
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Error desconocido al corregir entrega');
  }
};

const n8nService = {
  generateRubricFromPDF,
  gradeSubmission,
};

export default n8nService;
