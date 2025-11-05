/**
 * Componente de Registro
 * Permite a nuevos usuarios crear una cuenta en el sistema
 */
import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { Card } from '../shared/Card';
import authService from '../../services/authService';

export const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateUsername = (username: string): string | null => {
    if (username.length < 3) {
      return 'El usuario debe tener al menos 3 caracteres';
    }
    if (!/^[a-z0-9_-]+$/.test(username)) {
      return 'El usuario solo puede contener letras minúsculas, números, guiones y guiones bajos';
    }
    return null;
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      // Registrar usuario (solo enviar username, name y password, el backend asigna rol 'user')
      await authService.register({ username: username.toLowerCase(), name, password });

      // Login automático después del registro
      await login({ username: username.toLowerCase(), password });

      // Redirigir a home
      navigate('/');
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Error al crear la cuenta'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-bg-primary flex items-center justify-center p-4">
      {/* Aurora Background */}
      <div className="backdrop-aurora pointer-events-none">
        <div className="aurora-1"></div>
        <div className="aurora-2"></div>
      </div>

      {/* Register Card */}
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
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Crear Cuenta</h1>
            <p className="text-text-tertiary mt-2">Regístrate para comenzar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Usuario"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="Elige un nombre de usuario"
              required
              autoComplete="username"
              helperText="Solo letras minúsculas, números, guiones y guiones bajos"
            />

            <Input
              label="Nombre completo"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre completo"
              required
              autoComplete="name"
            />

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              autoComplete="new-password"
            />

            <Input
              label="Confirmar Contraseña"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite tu contraseña"
              required
              autoComplete="new-password"
            />

            {error && (
              <div className="bg-danger-1/10 border border-danger-1/50 rounded-xl p-3">
                <p className="text-danger-1 text-sm">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Crear Cuenta
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-border-primary/60">
            <p className="text-sm text-text-tertiary text-center">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to="/login"
                className="text-accent-1 hover:text-accent-2 transition-colors font-medium"
              >
                Inicia sesión
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;
