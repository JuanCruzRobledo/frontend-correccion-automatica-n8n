/**
 * ChangePasswordModal - Modal para cambiar contraseña
 * Puede ser usado en primer login (obligatorio) o desde configuración (opcional)
 */
import { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Input } from '../shared/Input';
import authService from '../../services/authService';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirstLogin: boolean; // Si es true, el modal es obligatorio (no se puede cerrar)
  onSuccess?: () => void; // Callback opcional después de cambiar contraseña exitosamente
}

export const ChangePasswordModal = ({
  isOpen,
  onClose,
  isFirstLogin,
  onSuccess,
}: ChangePasswordModalProps) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    general: '',
  });
  const [loading, setLoading] = useState(false);

  /**
   * Validar formulario
   */
  const validate = (): boolean => {
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      general: '',
    };

    // Validar contraseña actual
    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'La contraseña actual es requerida';
    }

    // Validar nueva contraseña
    if (!formData.newPassword.trim()) {
      newErrors.newPassword = 'La nueva contraseña es requerida';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'La nueva contraseña debe tener al menos 8 caracteres';
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = 'La nueva contraseña debe ser diferente a la actual';
    }

    // Validar confirmación
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Debes confirmar la nueva contraseña';
    } else if (formData.confirmPassword !== formData.newPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);

    // Retornar true si no hay errores
    return !Object.values(newErrors).some((error) => error !== '');
  };

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = async () => {
    // Limpiar errores previos
    setErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      general: '',
    });

    // Validar
    if (!validate()) {
      return;
    }

    try {
      setLoading(true);

      // Llamar al servicio
      await authService.changePassword(
        formData.currentPassword,
        formData.newPassword
      );

      // Éxito: limpiar formulario
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Llamar callback de éxito si existe
      if (onSuccess) {
        onSuccess();
      }

      // Cerrar modal
      onClose();
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);

      // Mostrar error
      setErrors((prev) => ({
        ...prev,
        general: error.response?.data?.message || 'Error al cambiar la contraseña',
      }));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Manejar cierre del modal
   */
  const handleClose = () => {
    // Si es primer login, NO permitir cerrar
    if (isFirstLogin) {
      return;
    }

    // Limpiar formulario y cerrar
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setErrors({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      general: '',
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isFirstLogin ? 'Cambio de Contraseña Obligatorio' : 'Cambiar Contraseña'}
      showFooter
      confirmText="Cambiar Contraseña"
      cancelText={isFirstLogin ? undefined : 'Cancelar'} // No mostrar botón cancelar si es first_login
      onConfirm={handleSubmit}
      confirmLoading={loading}
    >
      <div className="space-y-4">
        {/* Mensaje informativo para primer login */}
        {isFirstLogin && (
          <div className="bg-warning-1/10 border border-warning-1/50 rounded-xl p-4">
            <p className="text-sm text-warning-1">
              🔒 Por seguridad, debes cambiar tu contraseña en el primer inicio de sesión.
            </p>
          </div>
        )}

        {/* Error general */}
        {errors.general && (
          <div className="bg-danger-1/10 border border-danger-1/50 rounded-xl p-3">
            <p className="text-danger-1 text-sm">{errors.general}</p>
          </div>
        )}

        {/* Contraseña Actual */}
        <Input
          label="Contraseña Actual"
          type="password"
          placeholder="Ingresa tu contraseña actual"
          value={formData.currentPassword}
          onChange={(e) =>
            setFormData({ ...formData, currentPassword: e.target.value })
          }
          error={errors.currentPassword}
        />

        {/* Nueva Contraseña */}
        <Input
          label="Nueva Contraseña"
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={formData.newPassword}
          onChange={(e) =>
            setFormData({ ...formData, newPassword: e.target.value })
          }
          error={errors.newPassword}
          tooltip="La contraseña debe tener al menos 8 caracteres y ser diferente a la actual"
        />

        {/* Confirmar Nueva Contraseña */}
        <Input
          label="Confirmar Nueva Contraseña"
          type="password"
          placeholder="Repite la nueva contraseña"
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          error={errors.confirmPassword}
        />

        {/* Requisitos de contraseña */}
        <div className="bg-bg-tertiary/50 border border-border-secondary rounded-lg p-3">
          <p className="text-xs text-text-disabled font-medium mb-2">
            Requisitos de la contraseña:
          </p>
          <ul className="text-xs text-text-disabled space-y-1">
            <li
              className={
                formData.newPassword.length >= 8
                  ? 'text-success-1'
                  : 'text-text-disabled'
              }
            >
              {formData.newPassword.length >= 8 ? '✓' : '○'} Mínimo 8 caracteres
            </li>
            <li
              className={
                formData.newPassword &&
                formData.newPassword !== formData.currentPassword
                  ? 'text-success-1'
                  : 'text-text-disabled'
              }
            >
              {formData.newPassword &&
              formData.newPassword !== formData.currentPassword
                ? '✓'
                : '○'}{' '}
              Diferente a la contraseña actual
            </li>
            <li
              className={
                formData.confirmPassword &&
                formData.confirmPassword === formData.newPassword
                  ? 'text-success-1'
                  : 'text-text-disabled'
              }
            >
              {formData.confirmPassword &&
              formData.confirmPassword === formData.newPassword
                ? '✓'
                : '○'}{' '}
              Confirmación coincide
            </li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default ChangePasswordModal;
