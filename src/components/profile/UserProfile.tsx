/**
 * UserProfile - Perfil de usuario con gestión de API Key de Gemini
 * Permite al usuario configurar su API key personal y cambiar contraseña
 */
import { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Card } from '../shared/Card';
import { ChangePasswordModal } from '../auth/ChangePasswordModal';
import profileService from '../../services/profileService';
import type { UserProfile as UserProfileType } from '../../types';

export const UserProfile = () => {
  const [profile, setProfile] = useState<UserProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Estados para API Key
  const [apiKey, setApiKey] = useState('');
  const [apiKeyError, setApiKeyError] = useState('');
  const [configuringApiKey, setConfiguringApiKey] = useState(false);
  const [deletingApiKey, setDeletingApiKey] = useState(false);

  // Estado para modal de cambio de contraseña
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigureApiKey = async () => {
    // Validar formato
    if (!apiKey.trim()) {
      setApiKeyError('La API key es requerida');
      return;
    }

    if (!apiKey.startsWith('AIza')) {
      setApiKeyError('Formato de API key inválido (debe empezar con "AIza")');
      return;
    }

    try {
      setConfiguringApiKey(true);
      setApiKeyError('');
      setSuccessMessage('');

      await profileService.setGeminiApiKey(apiKey);

      // Recargar perfil
      await loadProfile();

      // Limpiar input y mostrar éxito
      setApiKey('');
      setSuccessMessage('✅ API key configurada exitosamente');

      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: unknown) {
      setApiKeyError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al configurar API key');
    } finally {
      setConfiguringApiKey(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!confirm('¿Estás seguro de eliminar tu API key de Gemini? No podrás realizar correcciones sin configurarla nuevamente.')) {
      return;
    }

    try {
      setDeletingApiKey(true);
      setError('');
      setSuccessMessage('');

      await profileService.deleteGeminiApiKey();

      // Recargar perfil
      await loadProfile();

      setSuccessMessage('🗑️ API key eliminada exitosamente');

      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al eliminar API key');
    } finally {
      setDeletingApiKey(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-1"></div>
          <p className="text-text-disabled mt-4">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card title="Error">
          <p className="text-danger-1">No se pudo cargar el perfil</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-3xl font-bold text-text-primary">Mi Perfil</h1>
        <p className="text-text-secondary mt-2">Gestiona tu información personal y configuración de API</p>
      </div>

      {/* Mensaje de error global */}
      {error && (
        <div className="bg-danger-1/10 border border-danger-1/50 rounded-xl p-4">
          <p className="text-danger-1 font-medium">{error}</p>
        </div>
      )}

      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="bg-accent-1/10 border border-accent-1/50 rounded-xl p-4">
          <p className="text-accent-1 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Información del Usuario */}
      <Card title="Información del Usuario">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-tertiary mb-1">Nombre de usuario</label>
              <p className="text-lg font-semibold text-text-primary">{profile.username}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-tertiary mb-1">Rol</label>
              <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                profile.role === 'admin'
                  ? 'bg-accent-1/20 text-accent-1'
                  : 'bg-bg-tertiary text-text-secondary'
              }`}>
                {profile.role === 'admin' ? '👑 Administrador' : '👤 Usuario'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-tertiary mb-1">Cuenta creada</label>
              <p className="text-text-secondary">{formatDate(profile.createdAt)}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-tertiary mb-1">Última actualización</label>
              <p className="text-text-secondary">{formatDate(profile.updatedAt)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Seguridad */}
      <Card title="Seguridad">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-tertiary mb-2">
              Contraseña
            </label>
            <p className="text-sm text-text-secondary mb-4">
              Cambia tu contraseña para mantener tu cuenta segura
            </p>
            <Button
              variant="secondary"
              onClick={() => setShowChangePasswordModal(true)}
            >
              🔒 Cambiar Contraseña
            </Button>
          </div>
        </div>
      </Card>

      {/* API Key de Gemini */}
      <Card title="API Key de Gemini">
        <div className="space-y-4">
          <div className="bg-bg-tertiary/30 border border-border-primary/60 rounded-xl p-4">
            <p className="text-sm text-text-secondary">
              ⚠️ <strong>API Key obligatoria:</strong> Para usar el sistema de corrección automática, debes configurar tu propia API key de Gemini.
              Esta key se usa exclusivamente bajo tu cuota personal.
            </p>
            <p className="text-sm text-text-tertiary mt-2">
              Obtén tu API key gratis en:{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-1 hover:text-accent-2 underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          {profile.hasGeminiApiKey ? (
            /* Usuario YA TIENE API key configurada */
            <div className="space-y-4">
              <div className="bg-accent-1/10 border border-accent-1/50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-accent-1 font-semibold flex items-center gap-2">
                      <span>✓</span>
                      <span>API Key configurada</span>
                    </p>
                    <p className="text-sm text-text-secondary mt-1">
                      Últimos 4 dígitos: <span className="font-mono font-bold">****{profile.gemini_api_key_last_4}</span>
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleDeleteApiKey}
                    disabled={deletingApiKey}
                  >
                    {deletingApiKey ? 'Eliminando...' : '🗑️ Eliminar'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-text-tertiary mb-1">Configurada el</label>
                  <p className="text-text-secondary">{formatDate(profile.gemini_api_key_configured_at)}</p>
                </div>
                <div>
                  <label className="block text-text-tertiary mb-1">Última validación</label>
                  <p className="text-text-secondary">{formatDate(profile.gemini_api_key_last_validated)}</p>
                </div>
              </div>

              <div>
                <label className="block text-text-tertiary mb-1 text-sm">Estado de validación</label>
                <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium ${
                  profile.gemini_api_key_is_valid
                    ? 'bg-accent-1/20 text-accent-1'
                    : 'bg-danger-1/20 text-danger-1'
                }`}>
                  {profile.gemini_api_key_is_valid ? '✓ Válida' : '✗ Inválida'}
                </span>
              </div>
            </div>
          ) : (
            /* Usuario NO tiene API key configurada */
            <div className="space-y-4">
              <div className="bg-danger-1/10 border border-danger-1/50 rounded-xl p-4">
                <p className="text-danger-1 font-medium">
                  ⚠️ No tienes una API key configurada
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  Debes configurar tu API key de Gemini para poder usar el sistema de corrección.
                </p>
              </div>

              <div className="space-y-3">
                <Input
                  label="API Key de Gemini"
                  type="password"
                  placeholder="AIza..."
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    setApiKeyError('');
                  }}
                  error={apiKeyError}
                  helperText="Debe empezar con 'AIza' - La key se validará antes de guardar"
                />

                <Button
                  variant="primary"
                  onClick={handleConfigureApiKey}
                  disabled={configuringApiKey || !apiKey.trim()}
                  className="w-full"
                >
                  {configuringApiKey ? (
                    <>
                      <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Validando y guardando...
                    </>
                  ) : (
                    '🔑 Configurar API Key'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Modal de Cambio de Contraseña */}
      <ChangePasswordModal
        isOpen={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        isFirstLogin={false}
        onSuccess={() => {
          setShowChangePasswordModal(false);
          setSuccessMessage('✅ Contraseña actualizada exitosamente');
          setTimeout(() => setSuccessMessage(''), 5000);
        }}
      />
    </div>
  );
};

export default UserProfile;
