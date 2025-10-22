/**
 * Hook personalizado para manejo de autenticación
 */
import { useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import type { User, LoginRequest, AuthState } from '../types';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
  });

  /**
   * Inicializar estado desde localStorage
   */
  useEffect(() => {
    const initAuth = () => {
      const token = authService.getToken();
      const user = authService.getUser();

      setAuthState({
        isAuthenticated: !!token && !!user,
        user,
        token,
        loading: false,
      });
    };

    initAuth();
  }, []);

  /**
   * Login
   */
  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    try {
      setAuthState((prev) => ({ ...prev, loading: true }));

      const response = await authService.login(credentials);

      setAuthState({
        isAuthenticated: true,
        user: response.user,
        token: response.token,
        loading: false,
      });
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
      });
      throw error;
    }
  }, []);

  /**
   * Logout
   */
  const logout = useCallback(() => {
    authService.logout();

    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
    });
  }, []);

  /**
   * Verificar si el usuario es admin
   */
  const isAdmin = useCallback((): boolean => {
    return authState.user?.role === 'admin';
  }, [authState.user]);

  return {
    ...authState,
    login,
    logout,
    isAdmin,
  };
};

export default useAuth;
