/**
 * Servicio de Universidades
 * Maneja todas las llamadas a la API de universidades
 */
import api from './api';
import type {
  University,
  ApiResponse,
  CreateUniversityForm,
  UpdateUniversityForm,
} from '../types';

/**
 * Obtener todas las universidades
 */
export const getUniversities = async (): Promise<University[]> => {
  const response = await api.get<ApiResponse<University[]>>('/api/universities');
  return response.data.data || [];
};

/**
 * Obtener una universidad por ID
 */
export const getUniversityById = async (id: string): Promise<University> => {
  const response = await api.get<ApiResponse<University>>(`/api/universities/${id}`);
  if (!response.data.data) {
    throw new Error('Universidad no encontrada');
  }
  return response.data.data;
};

/**
 * Crear nueva universidad
 */
export const createUniversity = async (data: CreateUniversityForm): Promise<University> => {
  const response = await api.post<ApiResponse<University>>('/api/universities', data);
  if (!response.data.data) {
    throw new Error('Error al crear universidad');
  }
  return response.data.data;
};

/**
 * Actualizar universidad
 */
export const updateUniversity = async (
  id: string,
  data: UpdateUniversityForm
): Promise<University> => {
  const response = await api.put<ApiResponse<University>>(`/api/universities/${id}`, data);
  if (!response.data.data) {
    throw new Error('Error al actualizar universidad');
  }
  return response.data.data;
};

/**
 * Eliminar universidad (baja lógica)
 */
export const deleteUniversity = async (id: string): Promise<void> => {
  await api.delete(`/api/universities/${id}`);
};

const universityService = {
  getUniversities,
  getUniversityById,
  createUniversity,
  updateUniversity,
  deleteUniversity,
};

export default universityService;
