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
  RubricType,
} from '../types';

interface GetRubricsParams {
  commission_id?: string;
  course_id?: string;
  rubric_type?: RubricType;
  year?: number;
  career_id?: string;
  faculty_id?: string;
  university_id?: string;
}

/**
 * Obtener todas las rúbricas (con filtros opcionales)
 * @param params - Filtros opcionales: commission_id, course_id, rubric_type, year, career_id, faculty_id, university_id
 */
export const getRubrics = async (params?: GetRubricsParams): Promise<Rubric[]> => {
  const response = await api.get<ApiResponse<Rubric[]>>('/api/rubrics', { params });
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
  formData.append('commission_id', data.commission_id);
  formData.append('course_id', data.course_id);
  formData.append('career_id', data.career_id);
  formData.append('faculty_id', data.faculty_id);
  formData.append('university_id', data.university_id);
  formData.append('rubric_type', data.rubric_type);
  formData.append('rubric_number', data.rubric_number.toString());
  formData.append('year', data.year.toString());
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

/**
 * Obtener rúbricas por comisión
 */
export const getRubricsByCommission = async (commissionId: string): Promise<Rubric[]> => {
  return getRubrics({ commission_id: commissionId });
};

const rubricService = {
  getRubrics,
  getRubricById,
  createRubric,
  createRubricFromPDF,
  updateRubric,
  deleteRubric,
  getRubricsByCommission,
};

export default rubricService;
