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
import { ChangePasswordModal } from './ChangePasswordModal';

export const Login = () => {
  const navigate = useNavigate();
  const { login, loading, getRole, user } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login({ username, password });

      // Verificar si es primer login (debe cambiar contraseña)
      if (user?.first_login === true) {
        // Mostrar modal de cambio de contraseña obligatorio
        setShowChangePasswordModal(true);
        return; // No redirigir aún
      }

      // Redirigir según rol después del login exitoso
      handleRedirectAfterLogin();
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Error al iniciar sesión'
      );
    }
  };

  /**
   * Redirigir según rol del usuario
   */
  const handleRedirectAfterLogin = () => {
    const role = getRole();

    switch (role) {
      case 'super-admin':
      case 'university-admin':
      case 'faculty-admin':
      case 'professor-admin':
      case 'admin':
        navigate('/admin');
        break;
      case 'professor':
        navigate('/professor');
        break;
      case 'user':
      default:
        navigate('/');
        break;
    }
  };

  /**
   * Callback después de cambiar contraseña exitosamente
   */
  const handlePasswordChangeSuccess = () => {
    // Cerrar modal
    setShowChangePasswordModal(false);

    // Redirigir según rol
    handleRedirectAfterLogin();
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

          {/* REGISTRO PÚBLICO DESACTIVADO - Solo admins pueden crear usuarios */}
          {/* <div className="mt-6 pt-6 border-t border-border-primary/60">
            <p className="text-sm text-text-tertiary text-center">
              ¿No tienes una cuenta?{' '}
              <a
                href="/register"
                className="text-accent-1 hover:text-accent-2 transition-colors font-medium"
              >
                Regístrate
              </a>
            </p>
          </div> */}
        </Card>
      </div>

      {/* Modal de Cambio de Contraseña Obligatorio */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        isFirstLogin={true}
        onSuccess={handlePasswordChangeSuccess}
      />
    </div>
  );
};

export default Login;
