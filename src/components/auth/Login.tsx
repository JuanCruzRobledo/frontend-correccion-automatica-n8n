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
    <div className="relative min-h-screen flex flex-col lg:flex-row">
      <div className="backdrop-aurora pointer-events-none fixed inset-0">
        <div className="aurora-1"></div>
        <div className="aurora-2"></div>
      </div>

      {/* Left Side - Branding & Info (Hidden on mobile, visible on desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-bg-secondary relative">
        <div className="flex flex-col justify-center w-full px-16 py-16 relative z-10">
          {/* Logo y título */}
          <div className="mb-12">
            <img
              src="/active-ia-logo.svg"
              alt="Active-IA Logo"
              className="w-24 h-24 mb-6"
            />
            <h1 className="text-5xl font-bold text-text-primary mb-4">
              Active-IA
            </h1>
            <p className="text-xl text-text-secondary">
              Sistema Inteligente de Corrección Automática
            </p>
          </div>

          {/* Descripción */}
          <p className="text-lg text-text-tertiary leading-relaxed mb-12 max-w-lg">
            Potencia tus correcciones con inteligencia artificial.
            Convierte rúbricas en segundos y obtén retroalimentación
            detallada para cada estudiante de forma automática.
          </p>

          {/* Features - Lista simple */}
          <div className="space-y-6 max-w-lg">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent-1/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-accent-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Corrección Rápida</h3>
                <p className="text-sm text-text-tertiary">Procesa entregas en minutos</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent-2/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-accent-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Precisión IA</h3>
                <p className="text-sm text-text-tertiary">Evaluaciones consistentes y objetivas</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-accent-3/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-accent-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Análisis Detallado</h3>
                <p className="text-sm text-text-tertiary">Retroalimentación personalizada</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 lg:w-1/2 bg-bg-primary flex items-center justify-center p-4 relative">
        <div className="w-full max-w-2xl px-4 py-8 relative z-10">
          {/* Logo mobile (solo visible en mobile) */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/active-ia-logo.svg"
              alt="Active-IA Logo"
              className="w-20 h-20 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-text-primary">Active-IA</h1>
          </div>

          <Card className="p-8 lg:p-12">
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-text-primary mb-3">Bienvenido</h2>
              <p className="text-lg text-text-tertiary">Inicia sesión para continuar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                <div className="bg-danger-1/10 border border-danger-1/50 rounded-xl p-4">
                  <p className="text-danger-1 text-sm">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full py-4 text-lg" loading={loading}>
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

          {/* Footer info */}
          <p className="text-center text-text-disabled text-sm mt-8">
            Sistema de Corrección Automática con IA
          </p>
        </div>
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
