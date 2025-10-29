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
import facultyService from '../../services/facultyService';
import careerService from '../../services/careerService';
import { suggestCourseId, cleanId, isValidId } from '../../utils/slugify';
import type { Course, University, Faculty, Career } from '../../types';

export const CoursesManager = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [filterUniversityId, setFilterUniversityId] = useState('');
  const [filterFacultyId, setFilterFacultyId] = useState('');
  const [filterCareerId, setFilterCareerId] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    course_id: '',
    name: '',
    year: new Date().getFullYear(), // Año actual por defecto
    career_id: '',
    faculty_id: '',
    university_id: '',
  });
  const [formErrors, setFormErrors] = useState({
    course_id: '',
    name: '',
    year: '',
    career_id: '',
    faculty_id: '',
    university_id: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [suggestedId, setSuggestedId] = useState('');
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);

  // Cargar datos al montar
  useEffect(() => {
    loadData();
  }, []);

  // Cargar facultades cuando cambia universidad en filtro
  useEffect(() => {
    if (filterUniversityId) {
      loadFaculties(filterUniversityId);
    } else {
      setFaculties([]);
    }
    setFilterFacultyId('');
    setFilterCareerId('');
  }, [filterUniversityId]);

  // Cargar carreras cuando cambia facultad en filtro
  useEffect(() => {
    if (filterFacultyId) {
      loadCareers(filterFacultyId);
    } else {
      setCareers([]);
    }
    setFilterCareerId('');
  }, [filterFacultyId]);

  // Recargar cursos cuando cambia el filtro de carrera
  useEffect(() => {
    if (filterCareerId) {
      loadCourses({ career_id: filterCareerId });
    } else {
      // Si se limpia el filtro, limpiar la tabla también
      setCourses([]);
      setLoading(false);
    }
  }, [filterCareerId]);

  // Cascada para modal: limpiar facultad/carrera cuando cambia universidad
  useEffect(() => {
    if (formData.university_id) {
      const filteredFaculties = faculties.filter(f => f.university_id === formData.university_id);
      if (formData.faculty_id && !filteredFaculties.find(f => f.faculty_id === formData.faculty_id)) {
        setFormData(prev => ({ ...prev, faculty_id: '', career_id: '' }));
      }
    }
  }, [formData.university_id, faculties, formData.faculty_id]);

  // Cascada para modal: limpiar carrera cuando cambia facultad
  useEffect(() => {
    if (formData.faculty_id) {
      const filteredCareers = careers.filter(c => c.faculty_id === formData.faculty_id);
      if (formData.career_id && !filteredCareers.find(c => c.career_id === formData.career_id)) {
        setFormData(prev => ({ ...prev, career_id: '' }));
      }
    }
  }, [formData.faculty_id, careers, formData.career_id]);

  // Auto-sugerir ID cuando cambia el nombre, año o universidad (solo en modo creación)
  useEffect(() => {
    if (modalMode === 'create' && formData.name.trim() && formData.year) {
      const suggestion = suggestCourseId(formData.year, formData.name);
      setSuggestedId(suggestion);
    } else {
      setSuggestedId('');
    }
  }, [formData.name, formData.year, modalMode]);

  // Validar ID duplicado con debounce (solo en modo creación)
  useEffect(() => {
    if (modalMode !== 'create' || !formData.course_id.trim() || !formData.career_id) {
      setIsDuplicate(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCheckingDuplicate(true);
      try {
        const existing = courses.find(
          (c) =>
            c.course_id.toLowerCase() === formData.course_id.toLowerCase() &&
            c.career_id === formData.career_id
        );
        setIsDuplicate(!!existing);
      } catch (err) {
        console.error('Error checking duplicate:', err);
      } finally {
        setCheckingDuplicate(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.course_id, formData.career_id, modalMode, courses]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [universitiesData, facultiesData, careersData] = await Promise.all([
        universityService.getUniversities(),
        facultyService.getAllFaculties(),
        careerService.getAllCareers(),
      ]);
      setUniversities(universitiesData);
      setFaculties(facultiesData);
      setCareers(careersData);
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadFaculties = async (universityId: string) => {
    try {
      const data = await facultyService.getFaculties(universityId);
      setFaculties(data);
    } catch (err: unknown) {
      console.error('Error al cargar facultades:', err);
    }
  };

  const loadCareers = async (facultyId: string) => {
    try {
      const data = await careerService.getCareers(facultyId);
      setCareers(data);
    } catch (err: unknown) {
      console.error('Error al cargar carreras:', err);
    }
  };

  const loadCourses = async (params: { career_id?: string }) => {
    try {
      setLoading(true);
      setError('');
      const data = await courseService.getCourses(params);
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
    setFormData({
      course_id: '',
      name: '',
      year: new Date().getFullYear(), // Año actual por defecto
      career_id: filterCareerId || '',
      faculty_id: filterFacultyId || '',
      university_id: filterUniversityId || '',
    });
    setFormErrors({ course_id: '', name: '', year: '', career_id: '', faculty_id: '', university_id: '' });
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
      year: course.year,
      career_id: course.career_id,
      faculty_id: course.faculty_id,
      university_id: course.university_id,
    });
    setFormErrors({ course_id: '', name: '', year: '', career_id: '', faculty_id: '', university_id: '' });
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const handleDelete = async (course: Course) => {
    if (!confirm(`¿Estás seguro de eliminar el curso "${course.name}"?`)) {
      return;
    }

    try {
      await courseService.deleteCourse(course._id);
      await loadCourses({ career_id: filterCareerId });
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
    const errors = { course_id: '', name: '', year: '', career_id: '', faculty_id: '', university_id: '' };
    if (!formData.course_id.trim()) errors.course_id = 'El ID es requerido';
    if (!formData.name.trim()) errors.name = 'El nombre es requerido';
    if (!formData.year || formData.year < 2020 || formData.year > 2100) errors.year = 'El año debe estar entre 2020 y 2100';
    if (!formData.career_id) errors.career_id = 'La carrera es requerida';
    if (!formData.faculty_id) errors.faculty_id = 'La facultad es requerida';
    if (!formData.university_id) errors.university_id = 'La universidad es requerida';
    if (isDuplicate) errors.course_id = 'Este ID ya existe en esta carrera';

    if (errors.course_id || errors.name || errors.year || errors.career_id || errors.faculty_id || errors.university_id) {
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
          year: formData.year,
          career_id: formData.career_id,
          faculty_id: formData.faculty_id,
          university_id: formData.university_id,
        });
      }

      setIsModalOpen(false);
      await loadCourses({ career_id: filterCareerId });
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

  // Columnas de la tabla
  const columns = [
    { header: 'ID', accessor: 'course_id' as keyof Course },
    { header: 'Nombre', accessor: 'name' as keyof Course },
    { header: 'Año', accessor: 'year' as keyof Course },
    {
      header: 'Carrera',
      accessor: (row: Course) => {
        const career = careers.find((c) => c.career_id === row.career_id);
        return career?.name || row.career_id;
      },
    },
    {
      header: 'Facultad',
      accessor: (row: Course) => {
        const faculty = faculties.find((f) => f.faculty_id === row.faculty_id);
        return faculty?.name || row.faculty_id;
      },
    },
    {
      header: 'Universidad',
      accessor: (row: Course) => {
        const university = universities.find((u) => u.university_id === row.university_id);
        return university?.name || row.university_id;
      },
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

  // Filtros en cascada para la vista
  const filteredFacultiesForFilter = filterUniversityId
    ? faculties.filter(f => f.university_id === filterUniversityId)
    : [];

  const filteredCareersForFilter = filterFacultyId
    ? careers.filter(c => c.faculty_id === filterFacultyId)
    : [];

  return (
    <Card title="Gestión de Cursos/Materias">
      <div className="mb-4 space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-text-disabled text-sm">
            {filterCareerId && courses.length > 0 ? `${courses.length} curso${courses.length !== 1 ? 's' : ''} registrado${courses.length !== 1 ? 's' : ''}` : 'Selecciona una carrera para ver sus cursos'}
          </p>
          <Button onClick={handleCreate} disabled={!filterCareerId}>+ Crear Curso</Button>
        </div>

        {/* Filtros en cascada */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Filtrar por Facultad
            </label>
            <select
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1 disabled:opacity-50"
              value={filterFacultyId}
              onChange={(e) => setFilterFacultyId(e.target.value)}
              disabled={!filterUniversityId}
            >
              <option value="">Todas las facultades</option>
              {filteredFacultiesForFilter.map((faculty) => (
                <option key={faculty._id} value={faculty.faculty_id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Filtrar por Carrera
            </label>
            <select
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1 disabled:opacity-50"
              value={filterCareerId}
              onChange={(e) => setFilterCareerId(e.target.value)}
              disabled={!filterFacultyId}
            >
              <option value="">Todas las carreras</option>
              {filteredCareersForFilter.map((career) => (
                <option key={career._id} value={career.career_id}>
                  {career.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-danger-1/10 border border-danger-1/50 rounded-xl p-3">
          <p className="text-danger-1 text-sm">{error}</p>
        </div>
      )}

      {!filterCareerId ? (
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
            Selecciona una carrera
          </h3>
          <p className="text-sm text-text-tertiary">
            Usa los selectores de arriba para filtrar por universidad, facultad y carrera
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
          emptyMessage="No hay cursos registrados para esta carrera"
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
              {faculties.filter(f => f.university_id === formData.university_id).map((faculty) => (
                <option key={faculty._id} value={faculty.faculty_id}>
                  {faculty.name}
                </option>
              ))}
            </select>
            {formErrors.faculty_id && (
              <p className="mt-1 text-xs text-danger-1">{formErrors.faculty_id}</p>
            )}
            {!formData.university_id && (
              <p className="mt-1 text-xs text-text-disabled">Primero selecciona una universidad</p>
            )}
            {modalMode === 'edit' && (
              <p className="mt-1 text-xs text-text-disabled">La facultad no se puede modificar</p>
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
              {careers.filter(c => c.faculty_id === formData.faculty_id).map((career) => (
                <option key={career._id} value={career.career_id}>
                  {career.name}
                </option>
              ))}
            </select>
            {formErrors.career_id && (
              <p className="mt-1 text-xs text-danger-1">{formErrors.career_id}</p>
            )}
            {!formData.faculty_id && (
              <p className="mt-1 text-xs text-text-disabled">Primero selecciona una facultad</p>
            )}
            {modalMode === 'edit' && (
              <p className="mt-1 text-xs text-text-disabled">La carrera no se puede modificar</p>
            )}
          </div>

          <Input
            label="Nombre del Curso"
            placeholder="ej: Programación 1"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
          />

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Año *
            </label>
            <select
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            >
              {Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            {formErrors.year && (
              <p className="mt-1 text-xs text-danger-1">{formErrors.year}</p>
            )}
            <p className="mt-1 text-xs text-text-disabled">Año calendario del curso</p>
          </div>

          <div>
            <Input
              label="ID del Curso"
              placeholder="ej: prog-1"
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
            {modalMode === 'create' && formData.course_id && formData.career_id && (
              <>
                {checkingDuplicate && (
                  <div className="mt-2 p-2 bg-bg-tertiary/50 border border-border-secondary/50 rounded-lg">
                    <p className="text-xs text-text-tertiary">Verificando disponibilidad...</p>
                  </div>
                )}
                {!checkingDuplicate && isDuplicate && (
                  <div className="mt-2 p-2 bg-danger-1/10 border border-danger-1/50 rounded-lg">
                    <p className="text-xs text-danger-1">⚠️ Este ID ya está en uso en esta carrera</p>
                  </div>
                )}
                {!checkingDuplicate && !isDuplicate && formData.course_id.length >= 2 && (
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
