/**
 * Servicio de Comisiones
 * Maneja todas las llamadas a la API de comisiones
 */
import api from './api';
import type {
  Commission,
  ApiResponse,
  CreateCommissionForm,
  UpdateCommissionForm,
} from '../types';

interface GetCommissionsParams {
  course_id?: string;
  year?: number;
  career_id?: string;
  faculty_id?: string;
  university_id?: string;
}

/**
 * Obtener todas las comisiones (con filtros opcionales)
 */
export const getCommissions = async (params?: GetCommissionsParams): Promise<Commission[]> => {
  const response = await api.get<ApiResponse<Commission[]>>('/api/commissions', { params });
  return response.data.data || [];
};

/**
 * Obtener todas las comisiones (incluyendo eliminadas) - Admin only
 */
export const getAllCommissions = async (params?: GetCommissionsParams): Promise<Commission[]> => {
  const response = await api.get<ApiResponse<Commission[]>>('/api/commissions/all', { params });
  return response.data.data || [];
};

/**
 * Obtener comisiones por año
 */
export const getCommissionsByYear = async (year: number): Promise<Commission[]> => {
  const response = await api.get<ApiResponse<Commission[]>>(`/api/commissions/by-year/${year}`);
  return response.data.data || [];
};

/**
 * Obtener una comisión por ID
 */
export const getCommissionById = async (id: string): Promise<Commission> => {
  const response = await api.get<ApiResponse<Commission>>(`/api/commissions/${id}`);
  if (!response.data.data) {
    throw new Error('Comisión no encontrada');
  }
  return response.data.data;
};

/**
 * Crear nueva comisión
 */
export const createCommission = async (data: CreateCommissionForm): Promise<Commission> => {
  const response = await api.post<ApiResponse<Commission>>('/api/commissions', data);
  if (!response.data.data) {
    throw new Error('Error al crear comisión');
  }
  return response.data.data;
};

/**
 * Actualizar comisión
 */
export const updateCommission = async (
  id: string,
  data: UpdateCommissionForm
): Promise<Commission> => {
  const response = await api.put<ApiResponse<Commission>>(`/api/commissions/${id}`, data);
  if (!response.data.data) {
    throw new Error('Error al actualizar comisión');
  }
  return response.data.data;
};

/**
 * Restaurar comisión eliminada - Admin only
 */
export const restoreCommission = async (id: string): Promise<Commission> => {
  const response = await api.put<ApiResponse<Commission>>(`/api/commissions/${id}/restore`);
  if (!response.data.data) {
    throw new Error('Error al restaurar comisión');
  }
  return response.data.data;
};

/**
 * Eliminar comisión (baja lógica)
 */
export const deleteCommission = async (id: string): Promise<void> => {
  await api.delete(`/api/commissions/${id}`);
};

const commissionService = {
  getCommissions,
  getAllCommissions,
  getCommissionsByYear,
  getCommissionById,
  createCommission,
  updateCommission,
  restoreCommission,
  deleteCommission,
};

export default commissionService;
