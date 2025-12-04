/**
 * Configuración de Axios para llamadas a la API
 */
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '../types';

// Crear instancia de Axios
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 600000, // 10 minutos (para batch uploads que tardan más)
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor de request - Añade token JWT si existe
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor de response - Manejo de errores global
 */
api.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa, simplemente retornarla
    return response;
  },
  (error: AxiosError<ApiError>) => {
    // Manejo de errores
    if (error.response) {
      // El servidor respondió con un código de error
      const status = error.response.status;
      const data = error.response.data;

      switch (status) {
        case 401:
          // No autorizado - remover token y redirigir a login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          console.error('❌ No autorizado. Redirigiendo a login...');
          // Aquí podrías usar window.location.href = '/login' si quieres forzar redirect
          break;

        case 403:
          console.error('❌ Acceso denegado. Permisos insuficientes.');
          break;

        case 404:
          console.error('❌ Recurso no encontrado.');
          break;

        case 500:
          console.error('❌ Error interno del servidor.');
          break;

        default:
          console.error(`❌ Error ${status}:`, data?.message || 'Error desconocido');
      }

      return Promise.reject(data || { success: false, message: 'Error desconocido' });
    } else if (error.request) {
      // La petición fue hecha pero no se recibió respuesta
      console.error('❌ No se pudo conectar con el servidor');
      return Promise.reject({
        success: false,
        message: 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.',
      });
    } else {
      // Algo más sucedió al configurar la petición
      console.error('❌ Error:', error.message);
      return Promise.reject({
        success: false,
        message: error.message,
      });
    }
  }
);

export default api;
