/**
 * Servicio de Carreras
 * Maneja todas las llamadas a la API de carreras
 */
import api from './api';
import type {
  Career,
  ApiResponse,
  CreateCareerForm,
  UpdateCareerForm,
} from '../types';

/**
 * Obtener todas las carreras (con filtros opcionales)
 * @param faculty_id - ID de facultad (opcional)
 * @param university_id - ID de universidad (opcional)
 */
export const getCareers = async (faculty_id?: string, university_id?: string): Promise<Career[]> => {
  const params: Record<string, string> = {};
  if (faculty_id) params.faculty_id = faculty_id;
  if (university_id) params.university_id = university_id;

  const response = await api.get<ApiResponse<Career[]>>('/api/careers', { params });
  return response.data.data || [];
};

/**
 * Obtener todas las carreras (incluyendo eliminadas) - Admin only
 * @param faculty_id - ID de facultad (opcional)
 * @param university_id - ID de universidad (opcional)
 */
export const getAllCareers = async (faculty_id?: string, university_id?: string): Promise<Career[]> => {
  const params: Record<string, string> = {};
  if (faculty_id) params.faculty_id = faculty_id;
  if (university_id) params.university_id = university_id;

  const response = await api.get<ApiResponse<Career[]>>('/api/careers/all', { params });
  return response.data.data || [];
};

/**
 * Obtener una carrera por ID
 */
export const getCareerById = async (id: string): Promise<Career> => {
  const response = await api.get<ApiResponse<Career>>(`/api/careers/${id}`);
  if (!response.data.data) {
    throw new Error('Carrera no encontrada');
  }
  return response.data.data;
};

/**
 * Crear nueva carrera
 */
export const createCareer = async (data: CreateCareerForm): Promise<Career> => {
  const response = await api.post<ApiResponse<Career>>('/api/careers', data);
  if (!response.data.data) {
    throw new Error('Error al crear carrera');
  }
  return response.data.data;
};

/**
 * Actualizar carrera
 */
export const updateCareer = async (
  id: string,
  data: UpdateCareerForm
): Promise<Career> => {
  const response = await api.put<ApiResponse<Career>>(`/api/careers/${id}`, data);
  if (!response.data.data) {
    throw new Error('Error al actualizar carrera');
  }
  return response.data.data;
};

/**
 * Restaurar carrera eliminada - Admin only
 */
export const restoreCareer = async (id: string): Promise<Career> => {
  const response = await api.put<ApiResponse<Career>>(`/api/careers/${id}/restore`);
  if (!response.data.data) {
    throw new Error('Error al restaurar carrera');
  }
  return response.data.data;
};

/**
 * Eliminar carrera (baja lógica)
 */
export const deleteCareer = async (id: string): Promise<void> => {
  await api.delete(`/api/careers/${id}`);
};

const careerService = {
  getCareers,
  getAllCareers,
  getCareerById,
  createCareer,
  updateCareer,
  restoreCareer,
  deleteCareer,
};

export default careerService;
