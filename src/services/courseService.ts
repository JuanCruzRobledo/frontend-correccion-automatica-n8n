/**
 * Servicio de Cursos/Materias
 * Maneja todas las llamadas a la API de cursos
 */
import api from './api';
import type {
  Course,
  ApiResponse,
  CreateCourseForm,
  UpdateCourseForm,
} from '../types';

interface GetCoursesParams {
  career_id?: string;
  year?: number;
  faculty_id?: string;
  university_id?: string;
}

/**
 * Obtener todos los cursos (con filtros opcionales)
 * @param params - Filtros opcionales: career_id, year, faculty_id, university_id
 */
export const getCourses = async (params?: GetCoursesParams): Promise<Course[]> => {
  const response = await api.get<ApiResponse<Course[]>>('/api/courses', { params });
  return response.data.data || [];
};

/**
 * Obtener un curso por ID
 */
export const getCourseById = async (id: string): Promise<Course> => {
  const response = await api.get<ApiResponse<Course>>(`/api/courses/${id}`);
  if (!response.data.data) {
    throw new Error('Curso no encontrado');
  }
  return response.data.data;
};

/**
 * Crear nuevo curso
 */
export const createCourse = async (data: CreateCourseForm): Promise<Course> => {
  const response = await api.post<ApiResponse<Course>>('/api/courses', data);
  if (!response.data.data) {
    throw new Error('Error al crear curso');
  }
  return response.data.data;
};

/**
 * Actualizar curso
 */
export const updateCourse = async (
  id: string,
  data: UpdateCourseForm
): Promise<Course> => {
  const response = await api.put<ApiResponse<Course>>(`/api/courses/${id}`, data);
  if (!response.data.data) {
    throw new Error('Error al actualizar curso');
  }
  return response.data.data;
};

/**
 * Eliminar curso (baja lógica)
 */
export const deleteCourse = async (id: string): Promise<void> => {
  await api.delete(`/api/courses/${id}`);
};

const courseService = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
};

export default courseService;
