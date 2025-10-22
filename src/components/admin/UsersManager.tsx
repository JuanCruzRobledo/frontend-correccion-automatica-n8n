/**
 * UsersManager - CRUD de Usuarios
 * Panel de administración para gestionar usuarios
 */
import { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Select } from '../shared/Select';
import { Modal } from '../shared/Modal';
import { Table } from '../shared/Table';
import { Card } from '../shared/Card';
import userService, { type CreateUserForm, type UpdateUserForm } from '../../services/userService';
import type { User } from '../../types';

export const UsersManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateUserForm | UpdateUserForm>({
    username: '',
    password: '',
    role: 'user',
  });
  const [formErrors, setFormErrors] = useState({ username: '', password: '', role: '' });
  const [submitting, setSubmitting] = useState(false);

  // Cargar usuarios al montar y cuando cambia showDeleted
  useEffect(() => {
    loadUsers();
  }, [showDeleted]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await userService.getAllUsers(showDeleted);
      setUsers(data);
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setFormData({ username: '', password: '', role: 'user' });
    setFormErrors({ username: '', password: '', role: '' });
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setModalMode('edit');
    setFormData({
      username: user.username,
      password: '', // No pre-llenar la contraseña
      role: user.role,
    });
    setFormErrors({ username: '', password: '', role: '' });
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (user: User) => {
    if (user.username === 'admin') {
      alert('No se puede eliminar el administrador principal');
      return;
    }

    if (!confirm(`¿Estás seguro de eliminar el usuario "${user.username}"?`)) {
      return;
    }

    try {
      await userService.deleteUser(user._id);
      await loadUsers();
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al eliminar usuario');
    }
  };

  const handleRestore = async (user: User) => {
    if (!confirm(`¿Restaurar el usuario "${user.username}"?`)) {
      return;
    }

    try {
      await userService.restoreUser(user._id);
      await loadUsers();
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al restaurar usuario');
    }
  };

  const handleSubmit = async () => {
    // Validar
    const errors = { username: '', password: '', role: '' };

    if (!formData.username?.trim()) {
      errors.username = 'El nombre de usuario es requerido';
    } else if (!/^[a-z0-9_-]+$/.test(formData.username)) {
      errors.username = 'Solo letras minúsculas, números, guiones y guiones bajos';
    } else if (formData.username.length < 3) {
      errors.username = 'Mínimo 3 caracteres';
    }

    if (modalMode === 'create' && !formData.password?.trim()) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Mínimo 6 caracteres';
    }

    if (!formData.role) {
      errors.role = 'El rol es requerido';
    }

    if (errors.username || errors.password || errors.role) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);

      if (modalMode === 'create') {
        await userService.createUser(formData as CreateUserForm);
      } else if (selectedUser) {
        // En modo edición, solo enviar campos que cambiaron
        const updateData: UpdateUserForm = {};

        if (formData.username && formData.username !== selectedUser.username) {
          updateData.username = formData.username;
        }

        if (formData.password) {
          updateData.password = formData.password;
        }

        if (formData.role && formData.role !== selectedUser.role) {
          updateData.role = formData.role;
        }

        // Solo actualizar si hay cambios
        if (Object.keys(updateData).length > 0) {
          await userService.updateUser(selectedUser._id, updateData);
        }
      }

      setIsModalOpen(false);
      await loadUsers();
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al guardar usuario');
    } finally {
      setSubmitting(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Columnas de la tabla
  const columns = [
    { header: 'Usuario', accessor: 'username' as keyof User },
    {
      header: 'Rol',
      accessor: (row: User) => (
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
            row.role === 'admin'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
          }`}
        >
          {row.role === 'admin' ? '👨‍💼 Admin' : '👤 Usuario'}
        </span>
      ),
    },
    {
      header: 'Estado',
      accessor: (row: User) => (
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
            row.deleted
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}
        >
          {row.deleted ? '🚫 Eliminado' : '✅ Activo'}
        </span>
      ),
    },
    {
      header: 'Fecha de Creación',
      accessor: (row: User) => formatDate(row.createdAt),
    },
    {
      header: 'Acciones',
      accessor: (row: User) => (
        <div className="flex gap-2">
          {row.deleted ? (
            <Button size="sm" variant="primary" onClick={() => handleRestore(row)}>
              Restaurar
            </Button>
          ) : (
            <>
              <Button size="sm" variant="secondary" onClick={() => handleEdit(row)}>
                Editar
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleDelete(row)}
                disabled={row.username === 'admin'}
              >
                Eliminar
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <Card title="Gestión de Usuarios">
      <div className="mb-4 flex justify-between items-center flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <p className="text-slate-400 text-sm">
            {users.length} usuario{users.length !== 1 ? 's' : ''} {showDeleted ? 'en total' : 'activos'}
          </p>

          {/* Toggle para mostrar eliminados */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900 cursor-pointer"
            />
            <span className="text-sm text-slate-300">Mostrar eliminados</span>
          </label>
        </div>

        <Button onClick={handleCreate}>+ Crear Usuario</Button>
      </div>

      {error && (
        <div className="mb-4 bg-rose-500/10 border border-rose-500/50 rounded-xl p-3">
          <p className="text-rose-400 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
          <p className="text-slate-400 mt-2">Cargando...</p>
        </div>
      ) : (
        <Table data={users} columns={columns} emptyMessage="No hay usuarios registrados" />
      )}

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Crear Usuario' : 'Editar Usuario'}
        showFooter
        confirmText="Guardar"
        onConfirm={handleSubmit}
        confirmLoading={submitting}
      >
        <div className="space-y-4">
          <Input
            label="Nombre de Usuario"
            placeholder="ej: juan_perez"
            value={formData.username || ''}
            onChange={(e) =>
              setFormData({ ...formData, username: e.target.value.toLowerCase() })
            }
            error={formErrors.username}
            helperText="Solo letras minúsculas, números, guiones y guiones bajos (mín. 3 caracteres)"
            disabled={selectedUser?.username === 'admin'}
          />

          <Input
            label={modalMode === 'create' ? 'Contraseña' : 'Nueva Contraseña (opcional)'}
            type="password"
            placeholder={modalMode === 'create' ? 'Mínimo 6 caracteres' : 'Dejar vacío para mantener la actual'}
            value={formData.password || ''}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={formErrors.password}
            helperText="Mínimo 6 caracteres"
          />

          <Select
            label="Rol"
            value={formData.role || 'user'}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'user' })}
            error={formErrors.role}
            disabled={selectedUser?.username === 'admin'}
            options={[
              { value: 'user', label: '👤 Usuario - Solo puede usar el sistema' },
              { value: 'admin', label: '👨‍💼 Admin - Acceso completo al panel de administración' },
            ]}
          />

          {selectedUser?.username === 'admin' && (
            <div className="bg-amber-500/10 border border-amber-500/50 rounded-xl p-3">
              <p className="text-amber-300 text-sm">
                ⚠️ El administrador principal no puede cambiar su username ni rol
              </p>
            </div>
          )}
        </div>
      </Modal>
    </Card>
  );
};

export default UsersManager;
