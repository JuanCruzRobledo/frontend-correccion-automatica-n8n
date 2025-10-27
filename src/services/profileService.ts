/**
 * Servicio de Perfil de Usuario
 * Gestiona el perfil del usuario y su API key de Gemini
 */
import api from './api';
import type { UserProfile, UpdateProfileRequest, ApiResponse } from '../types';

export const profileService = {
  /**
   * Obtener perfil del usuario autenticado
   */
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get<ApiResponse<UserProfile>>('/api/profile');
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Error al obtener perfil');
    }
    return response.data.data;
  },

  /**
   * Actualizar datos básicos del perfil
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const response = await api.put<ApiResponse<UserProfile>>('/api/profile', data);
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Error al actualizar perfil');
    }
    return response.data.data;
  },

  /**
   * Configurar API key de Gemini
   */
  setGeminiApiKey: async (apiKey: string): Promise<{ hasGeminiApiKey: boolean; gemini_api_key_last_4: string }> => {
    const response = await api.put<ApiResponse<{ hasGeminiApiKey: boolean; gemini_api_key_last_4: string }>>('/api/profile/gemini-api-key', {
      api_key: apiKey,
    });
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Error al configurar API key');
    }
    return response.data.data;
  },

  /**
   * Eliminar API key de Gemini
   */
  deleteGeminiApiKey: async (): Promise<void> => {
    const response = await api.delete<ApiResponse>('/api/profile/gemini-api-key');
    if (!response.data.success) {
      throw new Error(response.data.message || 'Error al eliminar API key');
    }
  },
};

export default profileService;
