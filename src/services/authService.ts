/**
 * Servicio de Autenticación
 * Maneja login, logout, y gestión de tokens
 */
import api from './api';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  ApiResponse,
} from '../types';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/**
 * Login de usuario
 * @param credentials - Username y password
 * @returns Promise con token y datos del usuario
 */
export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/api/auth/login', credentials);
  const { token, user } = response.data;

  // Guardar en localStorage
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  return response.data;
};

/**
 * Logout - Limpiar sesión
 */
export const logout = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * Registrar nuevo usuario (solo admin)
 * @param data - Datos del nuevo usuario
 * @returns Promise con datos del usuario creado
 */
export const register = async (data: RegisterRequest): Promise<ApiResponse<User>> => {
  const response = await api.post<ApiResponse<User>>('/api/auth/register', data);
  return response.data;
};

/**
 * Verificar token JWT
 * @returns Promise con validación del token
 */
export const verifyToken = async (): Promise<ApiResponse<User>> => {
  const response = await api.get<ApiResponse<User>>('/api/auth/verify');
  return response.data;
};

/**
 * Obtener token del localStorage
 * @returns Token JWT o null
 */
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Obtener usuario del localStorage
 * @returns Usuario o null
 */
export const getUser = (): User | null => {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;

  try {
    return JSON.parse(userJson) as User;
  } catch (error) {
    console.error('Error al parsear usuario desde localStorage:', error);
    return null;
  }
};

/**
 * Verificar si el usuario está autenticado
 * @returns true si hay token y usuario
 */
export const isAuthenticated = (): boolean => {
  return !!getToken() && !!getUser();
};

/**
 * Verificar si el usuario es admin
 * @returns true si el usuario es admin
 */
export const isAdmin = (): boolean => {
  const user = getUser();
  return user?.role === 'admin';
};

/**
 * Cambiar contraseña del usuario autenticado
 * @param currentPassword - Contraseña actual
 * @param newPassword - Nueva contraseña
 * @returns Promise con resultado de la operación
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse<User>> => {
  const response = await api.post<ApiResponse<User>>('/api/auth/change-password', {
    currentPassword,
    newPassword,
  });

  // Actualizar usuario en localStorage (first_login = false)
  if (response.data.success && response.data.data) {
    localStorage.setItem(USER_KEY, JSON.stringify(response.data.data));
  }

  return response.data;
};

/**
 * Objeto con todas las funciones exportadas
 */
const authService = {
  login,
  logout,
  register,
  verifyToken,
  getToken,
  getUser,
  isAuthenticated,
  isAdmin,
  changePassword,
};

export default authService;
