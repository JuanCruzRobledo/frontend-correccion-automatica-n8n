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
import facultyService from '../../services/facultyService';
import courseService from '../../services/courseService';
import { getCreatableRoles, getRequiredFieldsForRole, getRoleDisplayName } from '../../utils/roleHelper';
import type { User } from '../../types';

interface University {
  _id: string;
  university_id: string;
  name: string;
}

interface Faculty {
  _id: string;
  faculty_id: string;
  name: string;
  university_id: string;
}

interface Course {
  _id: string;
  course_id: string;
  name: string;
  university_id: string;
  faculty_id: string;
}

export const UsersManager = () => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super-admin';
  const userUniversityId = currentUser?.university_id;
  const userFacultyId = currentUser?.faculty_id;

  const [users, setUsers] = useState<User[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
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
    faculty_id: '',
    course_ids: [],
  });
  const [formErrors, setFormErrors] = useState({
    username: '',
    name: '',
    password: '',
    role: '',
    university_id: '',
    faculty_id: '',
    course_ids: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Cargar usuarios y datos iniciales al montar
  useEffect(() => {
    loadUsers();
    loadUniversities();
    loadFaculties();
    loadCourses();
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

  const loadFaculties = async () => {
    try {
      const data = await facultyService.getAllFaculties();
      setFaculties(data);
    } catch (err: unknown) {
      console.error('Error al cargar facultades:', err);
    }
  };

  const loadCourses = async () => {
    try {
      const data = await courseService.getCourses();
      setCourses(data);
    } catch (err: unknown) {
      console.error('Error al cargar cursos:', err);
    }
  };

  const handleCreate = () => {
    setModalMode('create');

    // Determinar rol inicial basado en lo que puede crear el usuario actual
    const creatableRoles = getCreatableRoles(currentUser);
    const initialRole = (creatableRoles.length > 0 ? creatableRoles[creatableRoles.length - 1] : 'user') as any;

    setFormData({
      username: '',
      name: '',
      password: '',
      role: initialRole,
      university_id: userUniversityId || '',
      faculty_id: userFacultyId || '',
      course_ids: [],
    });
    setFormErrors({
      username: '',
      name: '',
      password: '',
      role: '',
      university_id: '',
      faculty_id: '',
      course_ids: ''
    });
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setModalMode('edit');
    setFormData({
      username: user.username,
      name: user.name,
      password: '',
      role: user.role,
      university_id: user.university_id || '',
      faculty_id: user.faculty_id || '',
      course_ids: user.course_ids || [],
    });
    setFormErrors({
      username: '',
      name: '',
      password: '',
      role: '',
      university_id: '',
      faculty_id: '',
      course_ids: ''
    });
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
    const errors = {
      username: '',
      name: '',
      password: '',
      role: '',
      university_id: '',
      faculty_id: '',
      course_ids: ''
    };

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

    // Validar campos requeridos según el rol
    const requiredFields = getRequiredFieldsForRole(formData.role || 'user');

    if (requiredFields.includes('university_id') && !formData.university_id?.trim()) {
      errors.university_id = 'La universidad es requerida para este rol';
    }

    if (requiredFields.includes('faculty_id') && !formData.faculty_id?.trim()) {
      errors.faculty_id = 'La facultad es requerida para este rol';
    }

    if (requiredFields.includes('course_ids')) {
      if (!formData.course_ids || !Array.isArray(formData.course_ids) || formData.course_ids.length === 0) {
        errors.course_ids = 'Debe seleccionar al menos un curso';
      }
    }

    if (errors.username || errors.name || errors.password || errors.role || errors.university_id || errors.faculty_id || errors.course_ids) {
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

        if (formData.faculty_id !== selectedUser.faculty_id) {
          updateData.faculty_id = formData.faculty_id;
        }

        // Comparar course_ids (arrays)
        const oldCourseIds = selectedUser.course_ids || [];
        const newCourseIds = formData.course_ids || [];
        if (JSON.stringify(oldCourseIds.sort()) !== JSON.stringify(newCourseIds.sort())) {
          updateData.course_ids = newCourseIds;
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
            onChange={(e) => {
              const newRole = e.target.value;
              // Limpiar campos que no son requeridos para el nuevo rol
              const requiredFields = getRequiredFieldsForRole(newRole);
              setFormData({
                ...formData,
                role: newRole as any,
                faculty_id: requiredFields.includes('faculty_id') ? formData.faculty_id : '',
                course_ids: requiredFields.includes('course_ids') ? formData.course_ids : [],
              });
            }}
            error={formErrors.role}
            disabled={selectedUser?.username === 'admin'}
            tooltip="Selecciona el rol según las responsabilidades del usuario"
            options={getCreatableRoles(currentUser).map(role => {
              const roleLabels: Record<string, string> = {
                'super-admin': '🌟 Super Admin - Acceso global',
                'university-admin': '🏛️ Admin Universidad - Gestiona su universidad',
                'faculty-admin': '🏫 Admin Facultad - Gestiona su facultad',
                'professor-admin': '👨‍🏫 Jefe de Cátedra - Gestiona materias',
                'professor': '👨‍🏫 Profesor - Corrige entregas',
                'user': '👤 Usuario - Solo corrección',
              };
              return {
                value: role,
                label: roleLabels[role] || role,
              };
            })}
          />

          {/* Campo Universidad: visible para super-admin cuando el rol lo requiere */}
          {isSuperAdmin && getRequiredFieldsForRole(formData.role || 'user').includes('university_id') && (
            <Select
              label="Universidad"
              value={formData.university_id || ''}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  university_id: e.target.value,
                  faculty_id: '', // Resetear facultad al cambiar universidad
                  course_ids: [], // Resetear cursos al cambiar universidad
                });
              }}
              error={formErrors.university_id}
              tooltip="Universidad a la que pertenece el usuario"
              options={universities.map((uni) => ({
                value: uni.university_id,
                label: uni.name,
              }))}
              placeholder="Selecciona una universidad"
            />
          )}

          {/* Mostrar universidad heredada si no es super-admin */}
          {!isSuperAdmin && userUniversityId && getRequiredFieldsForRole(formData.role || 'user').includes('university_id') && (
            <div className="bg-bg-tertiary/50 border border-border-secondary rounded-lg p-3">
              <p className="text-sm text-text-disabled mb-1">Universidad</p>
              <p className="text-text-primary font-medium">
                {universities.find(u => u.university_id === userUniversityId)?.name || userUniversityId}
              </p>
              <p className="text-xs text-text-disabled mt-1">
                (heredado automáticamente)
              </p>
            </div>
          )}

          {/* Campo Facultad: visible cuando el rol lo requiere */}
          {getRequiredFieldsForRole(formData.role || 'user').includes('faculty_id') && (
            <>
              {(isSuperAdmin || currentUser?.role === 'university-admin') && (
                <Select
                  label="Facultad"
                  value={formData.faculty_id || ''}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      faculty_id: e.target.value,
                      course_ids: [], // Resetear cursos al cambiar facultad
                    });
                  }}
                  error={formErrors.faculty_id}
                  tooltip="Facultad a la que pertenece el usuario"
                  options={faculties
                    .filter(f => !formData.university_id || f.university_id === formData.university_id)
                    .map((faculty) => ({
                      value: faculty.faculty_id,
                      label: faculty.name,
                    }))}
                  placeholder="Selecciona una facultad"
                />
              )}

              {currentUser?.role === 'faculty-admin' && userFacultyId && (
                <div className="bg-bg-tertiary/50 border border-border-secondary rounded-lg p-3">
                  <p className="text-sm text-text-disabled mb-1">Facultad</p>
                  <p className="text-text-primary font-medium">
                    {faculties.find(f => f.faculty_id === userFacultyId)?.name || userFacultyId}
                  </p>
                  <p className="text-xs text-text-disabled mt-1">
                    (heredado automáticamente)
                  </p>
                </div>
              )}

              {currentUser?.role === 'professor-admin' && userFacultyId && (
                <div className="bg-bg-tertiary/50 border border-border-secondary rounded-lg p-3">
                  <p className="text-sm text-text-disabled mb-1">Facultad</p>
                  <p className="text-text-primary font-medium">
                    {faculties.find(f => f.faculty_id === userFacultyId)?.name || userFacultyId}
                  </p>
                  <p className="text-xs text-text-disabled mt-1">
                    (heredado automáticamente)
                  </p>
                </div>
              )}
            </>
          )}

          {/* Campo Cursos: visible cuando el rol lo requiere */}
          {getRequiredFieldsForRole(formData.role || 'user').includes('course_ids') && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Cursos *
              </label>
              <div className="max-h-48 overflow-y-auto border border-border-secondary rounded-lg p-3 bg-bg-tertiary/50">
                {courses
                  .filter(c => {
                    // Filtrar por universidad y facultad si están seleccionadas
                    if (formData.university_id && c.university_id !== formData.university_id) return false;
                    if (formData.faculty_id && c.faculty_id !== formData.faculty_id) return false;

                    // Si es professor-admin, solo mostrar sus cursos
                    if (currentUser?.role === 'professor-admin') {
                      return currentUser.course_ids?.includes(c.course_id);
                    }

                    return true;
                  })
                  .map((course) => (
                    <label key={course.course_id} className="flex items-center gap-2 py-2 cursor-pointer hover:bg-bg-secondary/30 rounded px-2">
                      <input
                        type="checkbox"
                        checked={formData.course_ids?.includes(course.course_id) || false}
                        onChange={(e) => {
                          const currentCourses = formData.course_ids || [];
                          const newCourses = e.target.checked
                            ? [...currentCourses, course.course_id]
                            : currentCourses.filter(id => id !== course.course_id);
                          setFormData({ ...formData, course_ids: newCourses });
                        }}
                        className="w-4 h-4 rounded border-border-secondary bg-bg-tertiary text-accent-1 focus:ring-accent-1 cursor-pointer"
                      />
                      <span className="text-sm text-text-primary">{course.name}</span>
                      <span className="text-xs text-text-disabled ml-auto">{course.course_id}</span>
                    </label>
                  ))}
                {courses.filter(c => {
                  if (formData.university_id && c.university_id !== formData.university_id) return false;
                  if (formData.faculty_id && c.faculty_id !== formData.faculty_id) return false;
                  if (currentUser?.role === 'professor-admin') {
                    return currentUser.course_ids?.includes(c.course_id);
                  }
                  return true;
                }).length === 0 && (
                  <p className="text-sm text-text-disabled text-center py-4">
                    {!formData.university_id
                      ? 'Selecciona una universidad primero'
                      : !formData.faculty_id
                      ? 'Selecciona una facultad primero'
                      : 'No hay cursos disponibles'}
                  </p>
                )}
              </div>
              {formErrors.course_ids && (
                <p className="text-xs text-danger-1 mt-1">{formErrors.course_ids}</p>
              )}
              <p className="text-xs text-text-disabled mt-1">
                Selecciona los cursos que gestionará este usuario
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
