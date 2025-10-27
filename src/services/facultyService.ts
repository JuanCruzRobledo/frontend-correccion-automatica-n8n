/**
 * Servicio de Facultades
 * Maneja todas las llamadas a la API de facultades
 */
import api from './api';
import type {
  Faculty,
  ApiResponse,
  CreateFacultyForm,
  UpdateFacultyForm,
} from '../types';

/**
 * Obtener todas las facultades (con filtros opcionales)
 * @param university_id - ID de universidad (opcional)
 */
export const getFaculties = async (university_id?: string): Promise<Faculty[]> => {
  const params = university_id ? { university_id } : {};
  const response = await api.get<ApiResponse<Faculty[]>>('/api/faculties', { params });
  return response.data.data || [];
};

/**
 * Obtener todas las facultades (incluyendo eliminadas) - Admin only
 * @param university_id - ID de universidad (opcional)
 */
export const getAllFaculties = async (university_id?: string): Promise<Faculty[]> => {
  const params = university_id ? { university_id } : {};
  const response = await api.get<ApiResponse<Faculty[]>>('/api/faculties/all', { params });
  return response.data.data || [];
};

/**
 * Obtener una facultad por ID
 */
export const getFacultyById = async (id: string): Promise<Faculty> => {
  const response = await api.get<ApiResponse<Faculty>>(`/api/faculties/${id}`);
  if (!response.data.data) {
    throw new Error('Facultad no encontrada');
  }
  return response.data.data;
};

/**
 * Crear nueva facultad
 */
export const createFaculty = async (data: CreateFacultyForm): Promise<Faculty> => {
  const response = await api.post<ApiResponse<Faculty>>('/api/faculties', data);
  if (!response.data.data) {
    throw new Error('Error al crear facultad');
  }
  return response.data.data;
};

/**
 * Actualizar facultad
 */
export const updateFaculty = async (
  id: string,
  data: UpdateFacultyForm
): Promise<Faculty> => {
  const response = await api.put<ApiResponse<Faculty>>(`/api/faculties/${id}`, data);
  if (!response.data.data) {
    throw new Error('Error al actualizar facultad');
  }
  return response.data.data;
};

/**
 * Restaurar facultad eliminada - Admin only
 */
export const restoreFaculty = async (id: string): Promise<Faculty> => {
  const response = await api.put<ApiResponse<Faculty>>(`/api/faculties/${id}/restore`);
  if (!response.data.data) {
    throw new Error('Error al restaurar facultad');
  }
  return response.data.data;
};

/**
 * Eliminar facultad (baja lógica)
 */
export const deleteFaculty = async (id: string): Promise<void> => {
  await api.delete(`/api/faculties/${id}`);
};

const facultyService = {
  getFaculties,
  getAllFaculties,
  getFacultyById,
  createFaculty,
  updateFaculty,
  restoreFaculty,
  deleteFaculty,
};

export default facultyService;
