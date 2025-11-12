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
import { useAuth } from '../../hooks/useAuth';
import userService, { type CreateUserForm, type UpdateUserForm } from '../../services/userService';
import universityService from '../../services/universityService';
import type { User } from '../../types';

interface University {
  _id: string;
  university_id: string;
  name: string;
}

export const UsersManager = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super-admin';
  const userUniversityId = currentUser?.university_id;

  const [users, setUsers] = useState<User[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
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
    name: '',
    password: '',
    role: 'user',
    university_id: '',
  });
  const [formErrors, setFormErrors] = useState({ username: '', name: '', password: '', role: '', university_id: '' });
  const [submitting, setSubmitting] = useState(false);

  // Cargar usuarios y universidades al montar
  useEffect(() => {
    loadUsers();
    loadUniversities();
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

  const loadUniversities = async () => {
    try {
      const data = await universityService.getUniversities();
      setUniversities(data);
    } catch (err: unknown) {
      console.error('Error al cargar universidades:', err);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setFormData({
      username: '',
      name: '',
      password: '',
      role: 'user',
      university_id: userUniversityId || '' // Pre-llenar para university-admin
    });
    setFormErrors({ username: '', name: '', password: '', role: '', university_id: '' });
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setModalMode('edit');
    setFormData({
      username: user.username,
      name: user.name,
      password: '', // No pre-llenar la contraseña
      role: user.role,
      university_id: user.university_id || '',
    });
    setFormErrors({ username: '', name: '', password: '', role: '', university_id: '' });
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
    const errors = { username: '', name: '', password: '', role: '', university_id: '' };

    if (!formData.username?.trim()) {
      errors.username = 'El nombre de usuario es requerido';
    } else if (!/^[a-z0-9_-]+$/.test(formData.username)) {
      errors.username = 'Solo letras minúsculas, números, guiones y guiones bajos';
    } else if (formData.username.length < 3) {
      errors.username = 'Mínimo 3 caracteres';
    }

    if (!formData.name?.trim()) {
      errors.name = 'El nombre es requerido';
    }

    if (modalMode === 'create' && !formData.password?.trim()) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Mínimo 6 caracteres';
    }

    if (!formData.role) {
      errors.role = 'El rol es requerido';
    }

    // Validar university_id: requerido para todos excepto super-admin
    if (formData.role !== 'super-admin' && !formData.university_id?.trim()) {
      errors.university_id = 'La universidad es requerida para este rol';
    }

    if (errors.username || errors.name || errors.password || errors.role || errors.university_id) {
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

        if (formData.name && formData.name !== selectedUser.name) {
          updateData.name = formData.name;
        }

        if (formData.password) {
          updateData.password = formData.password;
        }

        if (formData.role && formData.role !== selectedUser.role) {
          updateData.role = formData.role;
        }

        if (formData.university_id !== selectedUser.university_id) {
          updateData.university_id = formData.university_id;
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

  // Filtrar usuarios por universidad si no es super-admin
  const filteredUsers = isSuperAdmin
    ? users
    : users.filter(u => u.university_id === userUniversityId);

  // Columnas de la tabla
  const columns = [
    { header: 'Usuario', accessor: 'username' as keyof User },
    { header: 'Nombre', accessor: 'name' as keyof User },
    {
      header: 'Rol',
      accessor: (row: User) => (
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
            row.role === 'admin'
              ? 'bg-accent-3/20 text-accent-3 border border-accent-3/30'
              : 'bg-accent-1/20 text-accent-1 border border-accent-1/30'
          }`}
        >
          {row.role === 'super-admin' && '🌟 Super Admin'}
          {row.role === 'university-admin' && '👨‍💼 Admin Universidad'}
          {row.role === 'professor' && '👨‍🏫 Profesor'}
          {row.role === 'user' && '👤 Usuario'}
          {row.role === 'admin' && '👨‍💼 Admin'}
        </span>
      ),
    },
    // Columna Universidad: solo visible para super-admin
    ...(isSuperAdmin ? [{
      header: 'Universidad',
      accessor: (row: User) => {
        if (!row.university_id) return '-';
        const uni = universities.find(u => u.university_id === row.university_id);
        return uni?.name || row.university_id;
      },
    }] : []),
    {
      header: 'Estado',
      accessor: (row: User) => (
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
            row.deleted
              ? 'bg-danger-1/20 text-danger-1 border border-danger-1/30'
              : 'bg-accent-1/20 text-accent-1 border border-accent-1/30'
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
          <p className="text-text-disabled text-sm">
            {filteredUsers.length} usuario{filteredUsers.length !== 1 ? 's' : ''} {showDeleted ? 'en total' : 'activos'}
            {!isSuperAdmin && users.length !== filteredUsers.length && ` (de ${users.length} totales)`}
          </p>

          {/* Toggle para mostrar eliminados */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
              className="w-4 h-4 rounded border-border-secondary bg-bg-tertiary text-accent-1 focus:ring-accent-1 focus:ring-offset-bg-primary cursor-pointer"
            />
            <span className="text-sm text-text-tertiary">Mostrar eliminados</span>
          </label>
        </div>

        <Button onClick={handleCreate}>+ Crear Usuario</Button>
      </div>

      {error && (
        <div className="mb-4 bg-danger-1/10 border border-danger-1/50 rounded-xl p-3">
          <p className="text-danger-1 text-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent-1"></div>
          <p className="text-text-disabled mt-2">Cargando...</p>
        </div>
      ) : (
        <Table data={filteredUsers} columns={columns} emptyMessage="No hay usuarios registrados" />
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
            tooltip="Identificador único del usuario para iniciar sesión. Ej: juan_perez, prof-garcia"
          />

          <Input
            label="Nombre Completo"
            placeholder="ej: Juan Pérez"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            helperText="Nombre completo del usuario"
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
            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
            error={formErrors.role}
            disabled={selectedUser?.username === 'admin' || !isSuperAdmin}
            tooltip="super-admin: acceso global | university-admin: su universidad | professor: sus comisiones | user: solo corrección"
            options={isSuperAdmin ? [
              { value: 'user', label: '👤 Usuario - Solo puede usar el sistema de corrección' },
              { value: 'professor', label: '👨‍🏫 Profesor - Gestiona entregas de sus comisiones' },
              { value: 'university-admin', label: '👨‍💼 Admin Universidad - Gestiona su universidad' },
              { value: 'super-admin', label: '🌟 Super Admin - Acceso global a todas las universidades' },
            ] : [
              // university-admin solo puede crear usuarios y profesores
              { value: 'user', label: '👤 Usuario - Solo puede usar el sistema de corrección' },
              { value: 'professor', label: '👨‍🏫 Profesor - Gestiona entregas de sus comisiones' },
            ]}
          />

          {/* Campo Universidad: solo visible para super-admin */}
          {isSuperAdmin && formData.role !== 'super-admin' && (
            <Select
              label="Universidad"
              value={formData.university_id || ''}
              onChange={(e) => setFormData({ ...formData, university_id: e.target.value })}
              error={formErrors.university_id}
              tooltip="Universidad a la que pertenece el usuario (no requerido para super-admin)"
              options={universities.map((uni) => ({
                value: uni.university_id,
                label: uni.name,
              }))}
              placeholder="Selecciona una universidad"
            />
          )}

          {/* Mostrar universidad actual si no es super-admin */}
          {!isSuperAdmin && userUniversityId && (
            <div className="bg-bg-tertiary/50 border border-border-secondary rounded-lg p-3">
              <p className="text-sm text-text-disabled mb-1">Universidad</p>
              <p className="text-text-primary font-medium">
                {universities.find(u => u.university_id === userUniversityId)?.name || userUniversityId}
              </p>
              <p className="text-xs text-text-disabled mt-1">
                (los usuarios que crees pertenecerán a tu universidad)
              </p>
            </div>
          )}

          {selectedUser?.username === 'admin' && (
            <div className="bg-accent-2/10 border border-accent-2/50 rounded-xl p-3">
              <p className="text-text-tertiary text-sm">
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
