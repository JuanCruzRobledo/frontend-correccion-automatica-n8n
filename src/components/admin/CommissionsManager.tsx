/**
 * CommissionsManager - CRUD de Comisiones
 * Panel de administración para gestionar comisiones
 */
import { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Modal } from '../shared/Modal';
import { Table } from '../shared/Table';
import { Card } from '../shared/Card';
import commissionService from '../../services/commissionService';
import courseService from '../../services/courseService';
import careerService from '../../services/careerService';
import facultyService from '../../services/facultyService';
import universityService from '../../services/universityService';
import { suggestUniversityId, cleanId } from '../../utils/slugify';
import type { Commission, Course, Career, Faculty, University } from '../../types';

export const CommissionsManager = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterUniversityId, setFilterUniversityId] = useState('');
  const [filterFacultyId, setFilterFacultyId] = useState('');
  const [filterCareerId, setFilterCareerId] = useState('');
  const [filterCourseId, setFilterCourseId] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    commission_id: '',
    name: '',
    course_id: '',
    career_id: '',
    faculty_id: '',
    university_id: '',
    professor_name: '',
    professor_email: '',
    year: new Date().getFullYear(),
  });
  const [formErrors, setFormErrors] = useState({
    commission_id: '',
    name: '',
    course_id: '',
    career_id: '',
    faculty_id: '',
    university_id: '',
    professor_email: '',
    year: '',
  });
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
    if (modalMode !== 'create' || !formData.commission_id.trim() || !formData.course_id) {
      setIsDuplicate(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCheckingDuplicate(true);
      try {
        const existing = commissions.find(
          (c) =>
            c.commission_id.toLowerCase() === formData.commission_id.toLowerCase() &&
            c.course_id === formData.course_id
        );
        setIsDuplicate(!!existing);
      } catch (err) {
        console.error('Error checking duplicate:', err);
      } finally {
        setCheckingDuplicate(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.commission_id, formData.course_id, modalMode, commissions]);

  // Actualizar jerarquía en cascada
  useEffect(() => {
    if (formData.university_id) {
      const filteredFaculties = faculties.filter(f => f.university_id === formData.university_id);
      if (formData.faculty_id && !filteredFaculties.find(f => f.faculty_id === formData.faculty_id)) {
        setFormData(prev => ({ ...prev, faculty_id: '', career_id: '', course_id: '' }));
      }
    }
  }, [formData.university_id, faculties, formData.faculty_id]);

  useEffect(() => {
    if (formData.faculty_id) {
      const filteredCareers = careers.filter(c => c.faculty_id === formData.faculty_id);
      if (formData.career_id && !filteredCareers.find(c => c.career_id === formData.career_id)) {
        setFormData(prev => ({ ...prev, career_id: '', course_id: '' }));
      }
    }
  }, [formData.faculty_id, careers, formData.career_id]);

  useEffect(() => {
    if (formData.career_id) {
      const filteredCourses = courses.filter(c => c.career_id === formData.career_id && c.year === formData.year);
      if (formData.course_id && !filteredCourses.find(c => c.course_id === formData.course_id)) {
        setFormData(prev => ({ ...prev, course_id: '' }));
      }
    }
  }, [formData.career_id, formData.year, courses, formData.course_id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [commissionsData, coursesData, careersData, facultiesData, universitiesData] = await Promise.all([
        commissionService.getCommissions(),
        courseService.getCourses(),
        careerService.getCareers(),
        facultyService.getFaculties(),
        universityService.getUniversities(),
      ]);
      setCommissions(commissionsData);
      setCourses(coursesData);
      setCareers(careersData);
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
    // Pre-llenar con valores de filtros
    setFormData({
      commission_id: '',
      name: '',
      course_id: filterCourseId || '',
      career_id: filterCareerId || '',
      faculty_id: filterFacultyId || '',
      university_id: filterUniversityId || '',
      professor_name: '',
      professor_email: '',
      year: filterYear ? parseInt(filterYear) : new Date().getFullYear(),
    });
    setFormErrors({
      commission_id: '',
      name: '',
      course_id: '',
      career_id: '',
      faculty_id: '',
      university_id: '',
      professor_email: '',
      year: '',
    });
    setSelectedCommission(null);
    setSuggestedId('');
    setIsDuplicate(false);
    setCheckingDuplicate(false);
    setIsModalOpen(true);
  };

  const handleUseSuggestion = () => {
    setFormData({ ...formData, commission_id: suggestedId });
  };

  const handleEdit = (commission: Commission) => {
    setModalMode('edit');
    setFormData({
      commission_id: commission.commission_id,
      name: commission.name,
      course_id: commission.course_id,
      career_id: commission.career_id,
      faculty_id: commission.faculty_id,
      university_id: commission.university_id,
      professor_name: commission.professor_name || '',
      professor_email: commission.professor_email || '',
      year: commission.year,
    });
    setFormErrors({
      commission_id: '',
      name: '',
      course_id: '',
      career_id: '',
      faculty_id: '',
      university_id: '',
      professor_email: '',
      year: '',
    });
    setSelectedCommission(commission);
    setIsModalOpen(true);
  };

  const handleDelete = async (commission: Commission) => {
    if (!confirm(`¿Estás seguro de eliminar la comisión "${commission.name}"?`)) {
      return;
    }

    try {
      await commissionService.deleteCommission(commission._id);
      await loadData();
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al eliminar comisión');
    }
  };

  const handleSubmit = async () => {
    // Validar
    const errors = {
      commission_id: '',
      name: '',
      course_id: '',
      career_id: '',
      faculty_id: '',
      university_id: '',
      professor_email: '',
      year: '',
    };

    if (!formData.commission_id.trim()) errors.commission_id = 'El ID es requerido';
    if (!formData.name.trim()) errors.name = 'El nombre es requerido';
    if (!formData.course_id) errors.course_id = 'La materia es requerida';
    if (!formData.career_id) errors.career_id = 'La carrera es requerida';
    if (!formData.faculty_id) errors.faculty_id = 'La facultad es requerida';
    if (!formData.university_id) errors.university_id = 'La universidad es requerida';
    if (!formData.year) errors.year = 'El año es requerido';
    if (formData.professor_email && !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.professor_email)) {
      errors.professor_email = 'Email inválido';
    }
    if (isDuplicate) errors.commission_id = 'Este ID ya existe en esta materia';

    if (Object.values(errors).some(e => e)) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);

      if (modalMode === 'create') {
        await commissionService.createCommission(formData);
      } else if (selectedCommission) {
        await commissionService.updateCommission(selectedCommission._id, {
          name: formData.name,
          course_id: formData.course_id,
          career_id: formData.career_id,
          faculty_id: formData.faculty_id,
          university_id: formData.university_id,
          professor_name: formData.professor_name || undefined,
          professor_email: formData.professor_email || undefined,
          year: formData.year,
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al guardar comisión');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrar comisiones
  const filteredCommissions = commissions.filter(commission => {
    if (filterYear && commission.year.toString() !== filterYear) return false;
    if (filterUniversityId && commission.university_id !== filterUniversityId) return false;
    if (filterFacultyId && commission.faculty_id !== filterFacultyId) return false;
    if (filterCareerId && commission.career_id !== filterCareerId) return false;
    if (filterCourseId && commission.course_id !== filterCourseId) return false;
    return true;
  });

  // Facultades filtradas para el filtro principal
  const filteredFacultiesForFilter = filterUniversityId
    ? faculties.filter(f => f.university_id === filterUniversityId)
    : faculties;

  // Carreras filtradas para el filtro principal
  const filteredCareersForFilter = filterFacultyId
    ? careers.filter(c => c.faculty_id === filterFacultyId)
    : careers;

  // Cursos filtrados para el filtro principal
  const filteredCoursesForFilter = filterCareerId
    ? courses.filter(c => c.career_id === filterCareerId && c.year?.toString() === filterYear)
    : courses.filter(c => c.year?.toString() === filterYear);

  // Datos en cascada para el modal
  const filteredFacultiesForModal = formData.university_id
    ? faculties.filter(f => f.university_id === formData.university_id)
    : [];

  const filteredCareersForModal = formData.faculty_id
    ? careers.filter(c => c.faculty_id === formData.faculty_id)
    : [];

  const filteredCoursesForModal = formData.career_id
    ? courses.filter(c => c.career_id === formData.career_id && c.year === formData.year)
    : [];

  // Años disponibles para el filtro
  const availableYears = Array.from(
    new Set(courses.map(c => c.year).filter((year): year is number => year !== undefined))
  ).sort((a, b) => b - a);

  // Verificar si todos los filtros están seleccionados
  const allFiltersSelected = filterYear && filterUniversityId && filterFacultyId && filterCareerId && filterCourseId;

  // Columnas de la tabla
  const columns = [
    { header: 'ID', accessor: 'commission_id' as keyof Commission },
    { header: 'Nombre', accessor: 'name' as keyof Commission },
    {
      header: 'Materia',
      accessor: (row: Commission) => {
        const course = courses.find((c) => c.course_id === row.course_id);
        return course?.name || row.course_id;
      },
    },
    {
      header: 'Año',
      accessor: (row: Commission) => row.year,
    },
    {
      header: 'Profesor',
      accessor: (row: Commission) => row.professor_name || '-',
    },
    {
      header: 'Acciones',
      accessor: (row: Commission) => (
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
    <Card title="Gestión de Comisiones">
      <div className="mb-4 space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-text-disabled text-sm">
            {filteredCommissions.length} comisión{filteredCommissions.length !== 1 ? 'es' : ''} {filteredCommissions.length !== commissions.length ? `(de ${commissions.length} totales)` : 'registradas'}
          </p>
          <Button onClick={handleCreate}>+ Crear Comisión</Button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Año *
            </label>
            <select
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1"
              value={filterYear}
              onChange={(e) => {
                setFilterYear(e.target.value);
                setFilterFacultyId('');
                setFilterCareerId('');
                setFilterCourseId('');
              }}
            >
              <option value="">Seleccionar año...</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Universidad *
            </label>
            <select
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1 disabled:opacity-50"
              value={filterUniversityId}
              onChange={(e) => {
                setFilterUniversityId(e.target.value);
                setFilterFacultyId('');
                setFilterCareerId('');
                setFilterCourseId('');
              }}
              disabled={!filterYear}
            >
              <option value="">Seleccionar universidad...</option>
              {universities.map((uni) => (
                <option key={uni._id} value={uni.university_id}>
                  {uni.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Facultad *
            </label>
            <select
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1 disabled:opacity-50"
              value={filterFacultyId}
              onChange={(e) => {
                setFilterFacultyId(e.target.value);
                setFilterCareerId('');
                setFilterCourseId('');
              }}
              disabled={!filterUniversityId}
            >
              <option value="">Seleccionar facultad...</option>
              {filteredFacultiesForFilter.map((faculty) => (
                <option key={faculty._id} value={faculty.faculty_id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Carrera *
            </label>
            <select
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1 disabled:opacity-50"
              value={filterCareerId}
              onChange={(e) => {
                setFilterCareerId(e.target.value);
                setFilterCourseId('');
              }}
              disabled={!filterFacultyId}
            >
              <option value="">Seleccionar carrera...</option>
              {filteredCareersForFilter.map((career) => (
                <option key={career._id} value={career.career_id}>
                  {career.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Materia *
            </label>
            <select
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1 disabled:opacity-50"
              value={filterCourseId}
              onChange={(e) => setFilterCourseId(e.target.value)}
              disabled={!filterCareerId}
            >
              <option value="">Seleccionar materia...</option>
              {filteredCoursesForFilter.map((course) => (
                <option key={course._id} value={course.course_id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mensaje cuando no están todos los filtros seleccionados */}
        {!allFiltersSelected && (
          <div className="mt-3 bg-accent-1/10 border border-accent-1/50 rounded-xl p-3">
            <p className="text-accent-1 text-sm">
              📋 Por favor, selecciona todos los filtros (Año, Universidad, Facultad, Carrera y Materia) para ver las comisiones.
            </p>
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
      ) : allFiltersSelected ? (
        <Table data={filteredCommissions} columns={columns} emptyMessage="No hay comisiones registradas para los filtros seleccionados" />
      ) : null}

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Crear Comisión' : 'Editar Comisión'}
        showFooter
        confirmText="Guardar"
        onConfirm={handleSubmit}
        confirmLoading={submitting}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          {/* Jerarquía */}
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
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Facultad *
            </label>
            <select
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1 disabled:opacity-50"
              value={formData.faculty_id}
              onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
              disabled={!formData.university_id || modalMode === 'edit'}
            >
              <option value="">Seleccionar facultad...</option>
              {filteredFacultiesForModal.map((faculty) => (
                <option key={faculty._id} value={faculty.faculty_id}>
                  {faculty.name}
                </option>
              ))}
            </select>
            {formErrors.faculty_id && (
              <p className="mt-1 text-xs text-danger-1">{formErrors.faculty_id}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Carrera *
            </label>
            <select
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1 disabled:opacity-50"
              value={formData.career_id}
              onChange={(e) => setFormData({ ...formData, career_id: e.target.value })}
              disabled={!formData.faculty_id || modalMode === 'edit'}
            >
              <option value="">Seleccionar carrera...</option>
              {filteredCareersForModal.map((career) => (
                <option key={career._id} value={career.career_id}>
                  {career.name}
                </option>
              ))}
            </select>
            {formErrors.career_id && (
              <p className="mt-1 text-xs text-danger-1">{formErrors.career_id}</p>
            )}
          </div>

          <div>
            <Input
              label="Año *"
              type="number"
              placeholder="2025"
              value={formData.year.toString()}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
              error={formErrors.year}
              disabled={modalMode === 'edit'}
            />
            {modalMode === 'edit' && (
              <p className="mt-1 text-xs text-text-disabled">El año no se puede modificar</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Materia *
            </label>
            <select
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1 disabled:opacity-50"
              value={formData.course_id}
              onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
              disabled={!formData.career_id || modalMode === 'edit'}
            >
              <option value="">Seleccionar materia...</option>
              {filteredCoursesForModal.map((course) => (
                <option key={course._id} value={course.course_id}>
                  {course.name} ({course.year})
                </option>
              ))}
            </select>
            {formErrors.course_id && (
              <p className="mt-1 text-xs text-danger-1">{formErrors.course_id}</p>
            )}
            {modalMode === 'edit' && (
              <p className="mt-1 text-xs text-text-disabled">La materia no se puede modificar</p>
            )}
          </div>

          {/* Datos de la comisión */}
          <div className="border-t border-border-primary pt-4">
            <Input
              label="Nombre de la Comisión *"
              placeholder="ej: Comisión 1K1"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
            />
          </div>

          <div>
            <Input
              label="ID de la Comisión"
              placeholder="ej: 1k1"
              value={formData.commission_id}
              onChange={(e) =>
                setFormData({ ...formData, commission_id: cleanId(e.target.value) })
              }
              error={formErrors.commission_id}
              disabled={modalMode === 'edit'}
              helperText={modalMode === 'edit' ? 'El ID no se puede modificar' : 'Solo minúsculas, números y guiones'}
            />

            {/* Sugerencia de ID */}
            {modalMode === 'create' && suggestedId && suggestedId !== formData.commission_id && (
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
            {modalMode === 'create' && formData.commission_id && formData.course_id && (
              <>
                {checkingDuplicate && (
                  <div className="mt-2 p-2 bg-bg-tertiary/50 border border-border-secondary/50 rounded-lg">
                    <p className="text-xs text-text-tertiary">Verificando disponibilidad...</p>
                  </div>
                )}
                {!checkingDuplicate && isDuplicate && (
                  <div className="mt-2 p-2 bg-danger-1/10 border border-danger-1/50 rounded-lg">
                    <p className="text-xs text-danger-1">⚠️ Este ID ya está en uso en esta materia</p>
                  </div>
                )}
                {!checkingDuplicate && !isDuplicate && formData.commission_id.length >= 2 && (
                  <div className="mt-2 p-2 bg-accent-1/10 border border-accent-1/50 rounded-lg">
                    <p className="text-xs text-accent-1">✓ ID disponible</p>
                  </div>
                )}
              </>
            )}
          </div>

          <Input
            label="Nombre del Profesor"
            placeholder="ej: Prof. Juan Pérez"
            value={formData.professor_name}
            onChange={(e) => setFormData({ ...formData, professor_name: e.target.value })}
          />

          <Input
            label="Email del Profesor"
            type="email"
            placeholder="ej: juan.perez@example.com"
            value={formData.professor_email}
            onChange={(e) => setFormData({ ...formData, professor_email: e.target.value })}
            error={formErrors.professor_email}
          />
        </div>
      </Modal>
    </Card>
  );
};
