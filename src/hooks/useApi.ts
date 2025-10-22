/**
 * Hook personalizado para llamadas a la API con estados de loading/error
 */
import { useState, useCallback } from 'react';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T, Args extends unknown[]> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: Args) => Promise<T | null>;
  reset: () => void;
}

/**
 * Hook para manejar llamadas a API con estados
 * @param apiFunction - Función async que llama a la API
 * @returns Estado y función execute
 */
export const useApi = <T, Args extends unknown[]>(
  apiFunction: (...args: Args) => Promise<T>
): UseApiReturn<T, Args> => {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  /**
   * Ejecutar la función de API
   */
  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      try {
        setState({ data: null, loading: true, error: null });

        const result = await apiFunction(...args);

        setState({ data: result, loading: false, error: null });
        return result;
      } catch (error: unknown) {
        const errorMessage =
          error && typeof error === 'object' && 'message' in error
            ? String(error.message)
            : 'Error desconocido';

        setState({ data: null, loading: false, error: errorMessage });
        return null;
      }
    },
    [apiFunction]
  );

  /**
   * Resetear el estado
   */
  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};

export default useApi;
