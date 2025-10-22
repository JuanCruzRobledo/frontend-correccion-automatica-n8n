/**
 * CoursesManager - CRUD de Cursos/Materias
 * Panel de administración para gestionar cursos
 */
import { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Select } from '../shared/Select';
import { Modal } from '../shared/Modal';
import { Table } from '../shared/Table';
import { Card } from '../shared/Card';
import courseService from '../../services/courseService';
import universityService from '../../services/universityService';
import { suggestCourseId, cleanId, isValidId } from '../../utils/slugify';
import type { Course, University } from '../../types';

export const CoursesManager = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtro
  const [filterUniversityId, setFilterUniversityId] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    course_id: '',
    name: '',
    university_id: '',
  });
  const [formErrors, setFormErrors] = useState({
    course_id: '',
    name: '',
    university_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [suggestedId, setSuggestedId] = useState('');
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);

  // Cargar datos al montar
  useEffect(() => {
    loadUniversities();
    // NO cargar cursos automáticamente, esperar a que se seleccione universidad
  }, []);

  // Recargar cursos cuando cambia el filtro
  useEffect(() => {
    if (filterUniversityId) {
      loadCourses(filterUniversityId);
    } else {
      // Si se limpia el filtro, limpiar la tabla también
      setCourses([]);
      setLoading(false);
    }
  }, [filterUniversityId]);

  // Auto-sugerir ID cuando cambia el nombre o la universidad (solo en modo creación)
  useEffect(() => {
    if (modalMode === 'create' && formData.name.trim() && formData.university_id) {
      const suggestion = suggestCourseId(formData.university_id, formData.name);
      setSuggestedId(suggestion);
    } else {
      setSuggestedId('');
    }
  }, [formData.name, formData.university_id, modalMode]);

  // Validar ID duplicado con debounce (solo en modo creación)
  useEffect(() => {
    if (modalMode !== 'create' || !formData.course_id.trim()) {
      setIsDuplicate(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCheckingDuplicate(true);
      try {
        // Cargar todos los cursos para verificar duplicados
        const allCourses = await courseService.getCourses();
        const existing = allCourses.find(
          (c) => c.course_id.toLowerCase() === formData.course_id.toLowerCase()
        );
        setIsDuplicate(!!existing);
      } catch (err) {
        console.error('Error checking duplicate:', err);
      } finally {
        setCheckingDuplicate(false);
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [formData.course_id, modalMode]);

  const loadUniversities = async () => {
    try {
      const data = await universityService.getUniversities();
      setUniversities(data);
    } catch (err: unknown) {
      console.error('Error al cargar universidades:', err);
    }
  };

  const loadCourses = async (universityId?: string) => {
    try {
      setLoading(true);
      setError('');
      const data = await courseService.getCourses(universityId);
      setCourses(data);
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Error al cargar cursos'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setFormData({ course_id: '', name: '', university_id: '' });
    setFormErrors({ course_id: '', name: '', university_id: '' });
    setSelectedCourse(null);
    setSuggestedId('');
    setIsDuplicate(false);
    setCheckingDuplicate(false);
    setIsModalOpen(true);
  };

  const handleUseSuggestion = () => {
    setFormData({ ...formData, course_id: suggestedId });
  };

  const handleEdit = (course: Course) => {
    setModalMode('edit');
    setFormData({
      course_id: course.course_id,
      name: course.name,
      university_id: course.university_id,
    });
    setFormErrors({ course_id: '', name: '', university_id: '' });
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const handleDelete = async (course: Course) => {
    if (!confirm(`¿Estás seguro de eliminar el curso "${course.name}"?`)) {
      return;
    }

    try {
      await courseService.deleteCourse(course._id);
      await loadCourses(filterUniversityId);
    } catch (err: unknown) {
      alert(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Error al eliminar curso'
      );
    }
  };

  const handleSubmit = async () => {
    // Validar
    const errors = { course_id: '', name: '', university_id: '' };
    if (!formData.course_id.trim()) errors.course_id = 'El ID es requerido';
    if (!formData.name.trim()) errors.name = 'El nombre es requerido';
    if (!formData.university_id) errors.university_id = 'La universidad es requerida';
    if (isDuplicate) errors.course_id = 'Este ID ya existe';

    if (errors.course_id || errors.name || errors.university_id) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);

      if (modalMode === 'create') {
        await courseService.createCourse(formData);
      } else if (selectedCourse) {
        await courseService.updateCourse(selectedCourse._id, {
          name: formData.name,
          university_id: formData.university_id,
        });
      }

      setIsModalOpen(false);
      await loadCourses(filterUniversityId);
    } catch (err: unknown) {
      alert(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Error al guardar curso'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Obtener nombre de universidad
  const getUniversityName = (universityId: string) => {
    const uni = universities.find((u) => u.university_id === universityId);
    return uni ? uni.name : universityId;
  };

  // Columnas de la tabla
  const columns = [
    { header: 'ID', accessor: 'course_id' as keyof Course },
    { header: 'Nombre', accessor: 'name' as keyof Course },
    {
      header: 'Universidad',
      accessor: (row: Course) => getUniversityName(row.university_id),
    },
    {
      header: 'Acciones',
      accessor: (row: Course) => (
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

  return (
    <Card title="Gestión de Cursos/Materias">
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          {filterUniversityId ? (
            <p className="text-text-disabled text-sm">{courses.length} cursos registrados</p>
          ) : (
            <p className="text-text-disabled text-sm">Selecciona una universidad para ver sus cursos</p>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <Select
            options={universities.map((u) => ({
              value: u.university_id,
              label: u.name,
            }))}
            value={filterUniversityId}
            onChange={(e) => setFilterUniversityId(e.target.value)}
            placeholder="Selecciona universidad"
            className="w-full sm:w-64"
          />
          {filterUniversityId && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setFilterUniversityId('');
              }}
            >
              Limpiar filtro
            </Button>
          )}
          <Button onClick={handleCreate}>+ Crear Curso</Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-danger-1/10 border border-danger-1/50 rounded-xl p-3">
          <p className="text-danger-1 text-sm">{error}</p>
        </div>
      )}

      {!filterUniversityId ? (
        <div className="text-center py-16 bg-bg-secondary/30 rounded-xl border border-border-primary/40">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-text-disabled"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-text-secondary mb-2">
            Selecciona una universidad
          </h3>
          <p className="text-sm text-text-tertiary">
            Usa el selector de arriba para ver los cursos de una universidad específica
          </p>
        </div>
      ) : loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent-1"></div>
          <p className="text-text-disabled mt-2">Cargando...</p>
        </div>
      ) : (
        <Table
          data={courses}
          columns={columns}
          emptyMessage="No hay cursos registrados para esta universidad"
        />
      )}

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Crear Curso' : 'Editar Curso'}
        showFooter
        confirmText="Guardar"
        onConfirm={handleSubmit}
        confirmLoading={submitting}
      >
        <div className="space-y-4">
          <Select
            label="Universidad"
            options={universities.map((u) => ({
              value: u.university_id,
              label: u.name,
            }))}
            value={formData.university_id}
            onChange={(e) =>
              setFormData({ ...formData, university_id: e.target.value })
            }
            error={formErrors.university_id}
            placeholder="Selecciona una universidad"
          />

          <Input
            label="Nombre del Curso"
            placeholder="ej: Programación 1"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
          />

          <div>
            <Input
              label="ID del Curso"
              placeholder="ej: utn-frm-programacion-1"
              value={formData.course_id}
              onChange={(e) =>
                setFormData({ ...formData, course_id: cleanId(e.target.value) })
              }
              error={formErrors.course_id}
              disabled={modalMode === 'edit'}
              helperText={
                modalMode === 'edit'
                  ? 'El ID no se puede modificar'
                  : 'Solo minúsculas, números y guiones'
              }
            />

            {/* Validación en tiempo real */}
            {modalMode === 'create' && formData.course_id && (
              <>
                {checkingDuplicate && (
                  <div className="mt-2 p-2 bg-bg-tertiary/50 border border-border-secondary/50 rounded-lg">
                    <p className="text-xs text-text-tertiary">Verificando disponibilidad...</p>
                  </div>
                )}
                {!checkingDuplicate && isDuplicate && (
                  <div className="mt-2 p-2 bg-danger-1/10 border border-danger-1/50 rounded-lg">
                    <p className="text-xs text-danger-1">⚠️ Este ID ya está en uso</p>
                  </div>
                )}
                {!checkingDuplicate && !isDuplicate && formData.course_id.length >= 3 && (
                  <div className="mt-2 p-2 bg-accent-1/10 border border-accent-1/50 rounded-lg">
                    <p className="text-xs text-accent-1">✓ ID disponible</p>
                  </div>
                )}
              </>
            )}

            {/* Sugerencia de ID */}
            {modalMode === 'create' && suggestedId && suggestedId !== formData.course_id && (
              <div className="mt-2 p-3 bg-accent-1/10 border border-accent-1/30 rounded-lg">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-xs text-text-tertiary mb-1">ID sugerido:</p>
                    <code className="text-sm text-accent-1 font-mono">{suggestedId}</code>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleUseSuggestion}
                    type="button"
                  >
                    Usar sugerencia
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </Card>
  );
};

export default CoursesManager;
