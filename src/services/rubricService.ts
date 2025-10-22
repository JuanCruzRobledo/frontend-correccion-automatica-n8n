/**
 * Servicio de Rúbricas
 * Maneja todas las llamadas a la API de rúbricas
 */
import api from './api';
import type {
  Rubric,
  ApiResponse,
  CreateRubricForm,
  CreateRubricFromPDFForm,
  UpdateRubricForm,
} from '../types';

/**
 * Obtener todas las rúbricas (con filtros opcionales)
 */
export const getRubrics = async (
  universityId?: string,
  courseId?: string
): Promise<Rubric[]> => {
  const params = new URLSearchParams();
  if (universityId) params.append('university_id', universityId);
  if (courseId) params.append('course_id', courseId);

  const url = `/api/rubrics${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await api.get<ApiResponse<Rubric[]>>(url);
  return response.data.data || [];
};

/**
 * Obtener una rúbrica por ID
 */
export const getRubricById = async (id: string): Promise<Rubric> => {
  const response = await api.get<ApiResponse<Rubric>>(`/api/rubrics/${id}`);
  if (!response.data.data) {
    throw new Error('Rúbrica no encontrada');
  }
  return response.data.data;
};

/**
 * Crear nueva rúbrica desde JSON
 */
export const createRubric = async (data: CreateRubricForm): Promise<Rubric> => {
  const response = await api.post<ApiResponse<Rubric>>('/api/rubrics', data);
  if (!response.data.data) {
    throw new Error('Error al crear rúbrica');
  }
  return response.data.data;
};

/**
 * Crear nueva rúbrica desde PDF
 */
export const createRubricFromPDF = async (
  data: CreateRubricFromPDFForm
): Promise<Rubric> => {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('university_id', data.university_id);
  formData.append('course_id', data.course_id);
  formData.append('pdf', data.pdf);

  const response = await api.post<ApiResponse<Rubric>>(
    '/api/rubrics/from-pdf',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  if (!response.data.data) {
    throw new Error('Error al crear rúbrica desde PDF');
  }
  return response.data.data;
};

/**
 * Actualizar rúbrica
 */
export const updateRubric = async (
  id: string,
  data: UpdateRubricForm
): Promise<Rubric> => {
  const response = await api.put<ApiResponse<Rubric>>(`/api/rubrics/${id}`, data);
  if (!response.data.data) {
    throw new Error('Error al actualizar rúbrica');
  }
  return response.data.data;
};

/**
 * Eliminar rúbrica (baja lógica)
 */
export const deleteRubric = async (id: string): Promise<void> => {
  await api.delete(`/api/rubrics/${id}`);
};

const rubricService = {
  getRubrics,
  getRubricById,
  createRubric,
  createRubricFromPDF,
  updateRubric,
  deleteRubric,
};

export default rubricService;
