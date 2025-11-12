/**
 * FacultiesManager - CRUD de Facultades
 * Panel de administración para gestionar facultades
 */
import { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Modal } from '../shared/Modal';
import { Table } from '../shared/Table';
import { Card } from '../shared/Card';
import { useAuth } from '../../hooks/useAuth';
import facultyService from '../../services/facultyService';
import universityService from '../../services/universityService';
import { suggestUniversityId, cleanId } from '../../utils/slugify';
import type { Faculty, University } from '../../types';

export const FacultiesManager = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super-admin';
  const userUniversityId = user?.university_id;

  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtro (solo para super-admin, university-admin auto-filtra por su universidad)
  const [filterUniversityId, setFilterUniversityId] = useState(userUniversityId || '');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    faculty_id: '',
    name: '',
    university_id: '',
  });
  const [formErrors, setFormErrors] = useState({ faculty_id: '', name: '', university_id: '' });
  const [submitting, setSubmitting] = useState(false);
  const [suggestedId, setSuggestedId] = useState('');
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);

  // Cargar datos al montar
  useEffect(() => {
    loadData();
  }, []);

  // Auto-sugerir ID cuando cambia el nombre (solo en modo creación)
  useEffect(() => {
    if (modalMode === 'create' && formData.name.trim()) {
      const suggestion = suggestUniversityId(formData.name);
      setSuggestedId(suggestion);
    } else {
      setSuggestedId('');
    }
  }, [formData.name, modalMode]);

  // Validar ID duplicado con debounce (solo en modo creación)
  useEffect(() => {
    if (modalMode !== 'create' || !formData.faculty_id.trim() || !formData.university_id) {
      setIsDuplicate(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCheckingDuplicate(true);
      try {
        const existing = faculties.find(
          (f) =>
            f.faculty_id.toLowerCase() === formData.faculty_id.toLowerCase() &&
            f.university_id === formData.university_id
        );
        setIsDuplicate(!!existing);
      } catch (err) {
        console.error('Error checking duplicate:', err);
      } finally {
        setCheckingDuplicate(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.faculty_id, formData.university_id, modalMode, faculties]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [facultiesData, universitiesData] = await Promise.all([
        facultyService.getFaculties(),
        universityService.getUniversities(),
      ]);
      setFaculties(facultiesData);
      setUniversities(universitiesData);
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setFormData({ faculty_id: '', name: '', university_id: filterUniversityId || '' });
    setFormErrors({ faculty_id: '', name: '', university_id: '' });
    setSelectedFaculty(null);
    setSuggestedId('');
    setIsDuplicate(false);
    setCheckingDuplicate(false);
    setIsModalOpen(true);
  };

  const handleUseSuggestion = () => {
    setFormData({ ...formData, faculty_id: suggestedId });
  };

  const handleEdit = (faculty: Faculty) => {
    setModalMode('edit');
    setFormData({
      faculty_id: faculty.faculty_id,
      name: faculty.name,
      university_id: faculty.university_id,
    });
    setFormErrors({ faculty_id: '', name: '', university_id: '' });
    setSelectedFaculty(faculty);
    setIsModalOpen(true);
  };

  const handleDelete = async (faculty: Faculty) => {
    if (!confirm(`¿Estás seguro de eliminar la facultad "${faculty.name}"?`)) {
      return;
    }

    try {
      await facultyService.deleteFaculty(faculty._id);
      await loadData();
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al eliminar facultad');
    }
  };

  const handleSubmit = async () => {
    // Validar
    const errors = { faculty_id: '', name: '', university_id: '' };
    if (!formData.faculty_id.trim()) errors.faculty_id = 'El ID es requerido';
    if (!formData.name.trim()) errors.name = 'El nombre es requerido';
    if (!formData.university_id) errors.university_id = 'La universidad es requerida';
    if (isDuplicate) errors.faculty_id = 'Este ID ya existe en esta universidad';

    if (errors.faculty_id || errors.name || errors.university_id) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);

      if (modalMode === 'create') {
        await facultyService.createFaculty(formData);
      } else if (selectedFaculty) {
        await facultyService.updateFaculty(selectedFaculty._id, {
          name: formData.name,
          university_id: formData.university_id,
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al guardar facultad');
    } finally {
      setSubmitting(false);
    }
  };

  // Columnas de la tabla
  const columns = [
    { header: 'ID', accessor: 'faculty_id' as keyof Faculty },
    { header: 'Nombre', accessor: 'name' as keyof Faculty },
    {
      header: 'Universidad',
      accessor: (row: Faculty) => {
        const university = universities.find((u) => u.university_id === row.university_id);
        return university?.name || row.university_id;
      },
    },
    {
      header: 'Acciones',
      accessor: (row: Faculty) => (
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleEdit(row)}>
            Editar
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row)}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  // Filtrar facultades
  const filteredFaculties = faculties.filter(faculty => {
    if (filterUniversityId && faculty.university_id !== filterUniversityId) return false;
    return true;
  });

  return (
    <Card title="Gestión de Facultades">
      <div className="mb-4 space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-text-disabled text-sm">
            {filteredFaculties.length} facultad{filteredFaculties.length !== 1 ? 'es' : ''} {filteredFaculties.length !== faculties.length ? `(de ${faculties.length} totales)` : 'registradas'}
          </p>
          <Button onClick={handleCreate}>+ Crear Facultad</Button>
        </div>

        {/* Filtro por Universidad (solo para super-admin) */}
        {isSuperAdmin && (
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Filtrar por Universidad
            </label>
            <select
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1"
              value={filterUniversityId}
              onChange={(e) => setFilterUniversityId(e.target.value)}
            >
              <option value="">Todas las universidades</option>
              {universities.map((uni) => (
                <option key={uni._id} value={uni.university_id}>
                  {uni.name}
                </option>
              ))}
            </select>
          </div>
        )}
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
        <Table data={filteredFaculties} columns={columns} emptyMessage="No hay facultades registradas" />
      )}

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Crear Facultad' : 'Editar Facultad'}
        showFooter
        confirmText="Guardar"
        onConfirm={handleSubmit}
        confirmLoading={submitting}
      >
        <div className="space-y-4">
          {/* Campo Universidad: solo visible para super-admin */}
          {isSuperAdmin && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Universidad *
              </label>
              <select
                className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1"
                value={formData.university_id}
                onChange={(e) => setFormData({ ...formData, university_id: e.target.value })}
                disabled={modalMode === 'edit'}
              >
                <option value="">Seleccionar universidad...</option>
                {universities.map((uni) => (
                  <option key={uni._id} value={uni.university_id}>
                    {uni.name}
                  </option>
                ))}
              </select>
              {formErrors.university_id && (
                <p className="mt-1 text-xs text-danger-1">{formErrors.university_id}</p>
              )}
              {modalMode === 'edit' && (
                <p className="mt-1 text-xs text-text-disabled">La universidad no se puede modificar</p>
              )}
            </div>
          )}

          {/* Mostrar universidad actual si no es super-admin */}
          {!isSuperAdmin && userUniversityId && (
            <div className="bg-bg-tertiary/50 border border-border-secondary rounded-lg p-3">
              <p className="text-sm text-text-disabled mb-1">Universidad</p>
              <p className="text-text-primary font-medium">
                {universities.find(u => u.university_id === userUniversityId)?.name || userUniversityId}
              </p>
              <p className="text-xs text-text-disabled mt-1">
                (gestionas solo esta universidad)
              </p>
            </div>
          )}

          <Input
            label="Nombre"
            placeholder="ej: Facultad de Ingeniería"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
          />

          <div>
            <Input
              label="ID de la Facultad"
              placeholder="ej: fing"
              value={formData.faculty_id}
              onChange={(e) =>
                setFormData({ ...formData, faculty_id: cleanId(e.target.value) })
              }
              error={formErrors.faculty_id}
              disabled={modalMode === 'edit'}
              helperText={modalMode === 'edit' ? 'El ID no se puede modificar' : 'Solo minúsculas, números y guiones'}
            />

            {/* Sugerencia de ID */}
            {modalMode === 'create' && suggestedId && suggestedId !== formData.faculty_id && (
              <div className="mt-2 p-2 bg-accent-1/10 border border-accent-1/50 rounded-lg">
                <p className="text-xs text-text-secondary">
                  Sugerencia: <strong className="text-accent-1">{suggestedId}</strong>
                  <button
                    type="button"
                    onClick={handleUseSuggestion}
                    className="ml-2 text-accent-1 hover:text-accent-2 underline"
                  >
                    Usar
                  </button>
                </p>
              </div>
            )}

            {/* Validación en tiempo real */}
            {modalMode === 'create' && formData.faculty_id && formData.university_id && (
              <>
                {checkingDuplicate && (
                  <div className="mt-2 p-2 bg-bg-tertiary/50 border border-border-secondary/50 rounded-lg">
                    <p className="text-xs text-text-tertiary">Verificando disponibilidad...</p>
                  </div>
                )}
                {!checkingDuplicate && isDuplicate && (
                  <div className="mt-2 p-2 bg-danger-1/10 border border-danger-1/50 rounded-lg">
                    <p className="text-xs text-danger-1">⚠️ Este ID ya está en uso en esta universidad</p>
                  </div>
                )}
                {!checkingDuplicate && !isDuplicate && formData.faculty_id.length >= 2 && (
                  <div className="mt-2 p-2 bg-accent-1/10 border border-accent-1/50 rounded-lg">
                    <p className="text-xs text-accent-1">✓ ID disponible</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>
    </Card>
  );
};
