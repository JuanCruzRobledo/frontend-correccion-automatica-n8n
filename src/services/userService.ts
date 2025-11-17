/**
 * Servicio de Usuarios
 * Maneja todas las llamadas a la API de usuarios
 */
import api from './api';
import type { User, ApiResponse } from '../types';

/**
 * Formulario para crear usuario
 */
export interface CreateUserForm {
  username: string;
  name: string;
  password: string;
  role: 'super-admin' | 'university-admin' | 'faculty-admin' | 'professor-admin' | 'professor' | 'user' | 'admin';
  university_id?: string;
  faculty_id?: string; // Para faculty-admin
  course_ids?: string[]; // Para professor-admin
}

/**
 * Formulario para actualizar usuario
 */
export interface UpdateUserForm {
  username?: string;
  name?: string;
  password?: string;
  role?: 'super-admin' | 'university-admin' | 'faculty-admin' | 'professor-admin' | 'professor' | 'user' | 'admin';
  university_id?: string;
  faculty_id?: string; // Para faculty-admin
  course_ids?: string[]; // Para professor-admin
}

/**
 * Obtener todos los usuarios activos
 */
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get<ApiResponse<User[]>>('/api/users');
  return response.data.data || [];
};

/**
 * Obtener todos los usuarios (incluidos eliminados)
 */
export const getAllUsers = async (includeDeleted: boolean = false): Promise<User[]> => {
  const url = includeDeleted ? '/api/users?includeDeleted=true' : '/api/users';
  const response = await api.get<ApiResponse<User[]>>(url);
  return response.data.data || [];
};

/**
 * Obtener un usuario por ID
 */
export const getUserById = async (id: string): Promise<User> => {
  const response = await api.get<ApiResponse<User>>(`/api/users/${id}`);
  if (!response.data.data) {
    throw new Error('Usuario no encontrado');
  }
  return response.data.data;
};

/**
 * Crear nuevo usuario
 */
export const createUser = async (data: CreateUserForm): Promise<User> => {
  const response = await api.post<ApiResponse<User>>('/api/users', data);
  if (!response.data.data) {
    throw new Error('Error al crear usuario');
  }
  return response.data.data;
};

/**
 * Actualizar usuario
 */
export const updateUser = async (id: string, data: UpdateUserForm): Promise<User> => {
  const response = await api.put<ApiResponse<User>>(`/api/users/${id}`, data);
  if (!response.data.data) {
    throw new Error('Error al actualizar usuario');
  }
  return response.data.data;
};

/**
 * Eliminar usuario (soft delete)
 */
export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/api/users/${id}`);
};

/**
 * Restaurar usuario eliminado
 */
export const restoreUser = async (id: string): Promise<User> => {
  const response = await api.put<ApiResponse<User>>(`/api/users/${id}/restore`);
  if (!response.data.data) {
    throw new Error('Error al restaurar usuario');
  }
  return response.data.data;
};

const userService = {
  getUsers,
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  restoreUser,
};

export default userService;
