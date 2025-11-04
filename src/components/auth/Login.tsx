/**
 * Componente de Login
 * Permite a los usuarios autenticarse en el sistema
 */
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';

export const Login = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login({ username, password });
      // Redirigir a home después del login exitoso
      navigate('/');
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Error al iniciar sesión'
      );
    }
  };

  return (
    <div className="relative min-h-screen bg-bg-primary flex items-center justify-center p-4">
      {/* Aurora Background */}
      <div className="backdrop-aurora pointer-events-none">
        <div className="aurora-1"></div>
        <div className="aurora-2"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <Card>
          <div className="text-center mb-8">
            <div className="inline-block w-16 h-16 rounded-full bg-gradient-to-r from-accent-1 via-accent-2 to-accent-3 flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Sistema de Corrección Automática</h1>
            <p className="text-text-tertiary mt-2">Inicia sesión para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Usuario"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              required
              autoComplete="username"
            />

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
              autoComplete="current-password"
            />

            {error && (
              <div className="bg-danger-1/10 border border-danger-1/50 rounded-xl p-3">
                <p className="text-danger-1 text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Iniciar Sesión
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border-primary/60">
            <p className="text-sm text-text-tertiary text-center">
              ¿No tienes una cuenta?{' '}
              <a
                href="/register"
                className="text-accent-1 hover:text-accent-2 transition-colors font-medium"
              >
                Regístrate
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;
