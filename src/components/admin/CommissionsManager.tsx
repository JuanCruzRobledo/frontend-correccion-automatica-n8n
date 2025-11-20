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
import { useAuth } from '../../hooks/useAuth';
import commissionService from '../../services/commissionService';
import courseService from '../../services/courseService';
import careerService from '../../services/careerService';
import facultyService from '../../services/facultyService';
import universityService from '../../services/universityService';
import { suggestUniversityId, cleanId } from '../../utils/slugify';
import type { Commission, Course, Career, Faculty, University } from '../../types';

interface CommissionsManagerProps {
  selectedProfessorCourse?: string;
}

export const CommissionsManager = ({ selectedProfessorCourse }: CommissionsManagerProps) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super-admin';
  const isProfessorAdmin = user?.role === 'professor-admin';
  const isFacultyAdmin = user?.role === 'faculty-admin';
  const userUniversityId = user?.university_id;
  const userFacultyId = user?.faculty_id;
  const userCourseIds = user?.course_ids || [];

  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [professors, setProfessors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros (auto-filtrar por universidad, facultad y curso según rol)
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterUniversityId, setFilterUniversityId] = useState(userUniversityId || '');
  const [filterFacultyId, setFilterFacultyId] = useState(userFacultyId || '');
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
    year: new Date().getFullYear(),
  });
  const [formErrors, setFormErrors] = useState({
    commission_id: '',
    name: '',
    course_id: '',
    career_id: '',
    faculty_id: '',
    university_id: '',
    year: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [suggestedId, setSuggestedId] = useState('');
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [selectedProfessorsForCreate, setSelectedProfessorsForCreate] = useState<string[]>([]);

  // Actualizar filtro de universidad cuando userUniversityId está disponible
  useEffect(() => {
    if (userUniversityId && !filterUniversityId) {
      setFilterUniversityId(userUniversityId);
    }
  }, [userUniversityId]);

  // Actualizar filtro de facultad cuando userFacultyId está disponible (para faculty-admin)
  useEffect(() => {
    if (userFacultyId && !filterFacultyId) {
      setFilterFacultyId(userFacultyId);
    }
  }, [userFacultyId]);

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

  // Actualizar jerarquía en cascada y cargar profesores cuando cambia universidad
  useEffect(() => {
    if (formData.university_id) {
      const filteredFaculties = faculties.filter(f => f.university_id === formData.university_id);
      if (formData.faculty_id && !filteredFaculties.find(f => f.faculty_id === formData.faculty_id)) {
        setFormData(prev => ({ ...prev, faculty_id: '', career_id: '', course_id: '' }));
      }

      // Cargar profesores cuando cambia universidad en modo creación
      if (modalMode === 'create' && isModalOpen) {
        const loadProfessors = async () => {
          try {
            const profsList = await commissionService.getProfessorsByUniversity(formData.university_id);
            setProfessors(profsList);
          } catch (err) {
            console.error('Error al cargar profesores:', err);
            setProfessors([]);
          }
        };
        loadProfessors();
      }
    }
  }, [formData.university_id, faculties, formData.faculty_id, modalMode, isModalOpen]);

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

  const handleCreate = async () => {
    setModalMode('create');
    const prefilledUniversityId = userUniversityId || filterUniversityId || '';

    // Para professor-admin: auto-llenar con los datos de la materia seleccionada
    if (isProfessorAdmin && selectedProfessorCourse) {
      const course = courses.find(c => c.course_id === selectedProfessorCourse);
      if (course) {
        setFormData({
          commission_id: '',
          name: '',
          course_id: selectedProfessorCourse,
          career_id: course.career_id,
          faculty_id: course.faculty_id,
          university_id: course.university_id,
          year: course.year || new Date().getFullYear(),
        });
      }
    } else {
      // Pre-llenar con valores de filtros (priorizar userUniversityId para university-admin)
      setFormData({
        commission_id: '',
        name: '',
        course_id: filterCourseId || '',
        career_id: filterCareerId || '',
        faculty_id: filterFacultyId || '',
        university_id: prefilledUniversityId,
        year: filterYear ? parseInt(filterYear) : new Date().getFullYear(),
      });
    }
    setFormErrors({
      commission_id: '',
      name: '',
      course_id: '',
      career_id: '',
      faculty_id: '',
      university_id: '',
      year: '',
    });
    setSelectedCommission(null);
    setSuggestedId('');
    setIsDuplicate(false);
    setCheckingDuplicate(false);
    setSelectedProfessorsForCreate([]);

    // Cargar profesores disponibles si ya hay universidad seleccionada
    if (prefilledUniversityId) {
      try {
        const profsList = await commissionService.getProfessorsByUniversity(prefilledUniversityId);
        setProfessors(profsList);
      } catch (err) {
        console.error('Error al cargar profesores:', err);
        setProfessors([]);
      }
    } else {
      setProfessors([]);
    }

    setIsModalOpen(true);
  };

  const handleUseSuggestion = () => {
    setFormData({ ...formData, commission_id: suggestedId });
  };

  const handleEdit = async (commission: Commission) => {
    setModalMode('edit');
    setFormData({
      commission_id: commission.commission_id,
      name: commission.name,
      course_id: commission.course_id,
      career_id: commission.career_id,
      faculty_id: commission.faculty_id,
      university_id: commission.university_id,
      year: commission.year,
    });
    setFormErrors({
      commission_id: '',
      name: '',
      course_id: '',
      career_id: '',
      faculty_id: '',
      university_id: '',
      year: '',
    });
    setSelectedCommission(commission);

    // Cargar profesores disponibles de la universidad (solo role=professor)
    if (commission.university_id) {
      try {
        const profsList = await commissionService.getProfessorsByUniversity(commission.university_id);
        setProfessors(profsList);
      } catch (err) {
        console.error('Error al cargar profesores:', err);
        setProfessors([]);
      }
    }

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

  const handleAssignProfessor = async (professorId: string) => {
    if (!selectedCommission) return;

    try {
      const updated = await commissionService.assignProfessor(selectedCommission._id, professorId);
      setSelectedCommission(updated);
      await loadData();
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al asignar profesor');
    }
  };

  const handleRemoveProfessor = async (professorId: string) => {
    if (!selectedCommission) return;

    if (!confirm('¿Quitar este profesor de la comisión?')) return;

    try {
      const updated = await commissionService.removeProfessor(selectedCommission._id, professorId);
      setSelectedCommission(updated);
      await loadData();
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al remover profesor');
    }
  };

  const handleAddProfessorForCreate = (professorId: string) => {
    if (!selectedProfessorsForCreate.includes(professorId)) {
      setSelectedProfessorsForCreate([...selectedProfessorsForCreate, professorId]);
    }
  };

  const handleRemoveProfessorForCreate = (professorId: string) => {
    setSelectedProfessorsForCreate(selectedProfessorsForCreate.filter(id => id !== professorId));
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
      year: '',
    };

    if (!formData.commission_id.trim()) errors.commission_id = 'El ID es requerido';
    if (!formData.name.trim()) errors.name = 'El nombre es requerido';
    if (!formData.course_id) errors.course_id = 'La materia es requerida';
    if (!formData.career_id) errors.career_id = 'La carrera es requerida';
    if (!formData.faculty_id) errors.faculty_id = 'La facultad es requerida';
    if (!formData.university_id) errors.university_id = 'La universidad es requerida';
    if (!formData.year) errors.year = 'El año es requerido';
    if (isDuplicate) errors.commission_id = 'Este ID ya existe en esta materia';

    if (Object.values(errors).some(e => e)) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);

      if (modalMode === 'create') {
        const newCommission = await commissionService.createCommission(formData);

        // Asignar profesores seleccionados si hay alguno
        if (selectedProfessorsForCreate.length > 0) {
          for (const professorId of selectedProfessorsForCreate) {
            try {
              await commissionService.assignProfessor(newCommission._id, professorId);
            } catch (err) {
              console.error('Error al asignar profesor:', err);
            }
          }
        }
      } else if (selectedCommission) {
        await commissionService.updateCommission(selectedCommission._id, {
          name: formData.name,
          course_id: formData.course_id,
          career_id: formData.career_id,
          faculty_id: formData.faculty_id,
          university_id: formData.university_id,
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
    // Para professor-admin: filtrar por la materia seleccionada desde AdminPanel
    if (isProfessorAdmin && selectedProfessorCourse) {
      return commission.course_id === selectedProfessorCourse;
    }

    // Para otros roles: filtros normales
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
  // Para faculty-admin, careers ya viene filtrado del backend
  const filteredCareersForFilter = isFacultyAdmin
    ? careers
    : (filterFacultyId ? careers.filter(c => c.faculty_id === filterFacultyId) : []);

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
      header: 'Profesores',
      accessor: (row: Commission) => {
        if (row.professors && row.professors.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {row.professors.map((prof) => (
                <span
                  key={prof._id}
                  className="inline-block px-2 py-0.5 rounded-full text-xs bg-accent-2/20 text-accent-2 border border-accent-2/30"
                >
                  {prof.name}
                </span>
              ))}
            </div>
          );
        }
        return row.professor_name || '-';
      },
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

  // Título dinámico según el rol
  const getTitle = () => {
    if (isProfessorAdmin && selectedProfessorCourse) {
      const course = courses.find(c => c.course_id === selectedProfessorCourse);
      const career = careers.find(ca => ca.career_id === course?.career_id);
      return `Gestión de Comisiones - ${course?.name || selectedProfessorCourse} (${career?.name || ''})`;
    }
    if (isFacultyAdmin && userFacultyId && userUniversityId) {
      const faculty = faculties.find(f => f.faculty_id === userFacultyId);
      const university = universities.find(u => u.university_id === userUniversityId);
      return `Gestión de Comisiones - ${faculty?.name || userFacultyId} de ${university?.name || userUniversityId}`;
    }
    if (userUniversityId && !isSuperAdmin) {
      const university = universities.find(u => u.university_id === userUniversityId);
      return `Gestión de Comisiones - ${university?.name || userUniversityId}`;
    }
    return 'Gestión de Comisiones';
  };

  return (
    <Card title={getTitle()}>
      <div className="mb-4 space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-text-disabled text-sm">
            {filteredCommissions.length} comisión{filteredCommissions.length !== 1 ? 'es' : ''} {filteredCommissions.length !== commissions.length ? `(de ${commissions.length} totales)` : 'registradas'}
          </p>
          <Button onClick={handleCreate}>+ Crear Comisión</Button>
        </div>

        {/* Filtros: ocultos para professor-admin */}
        {!isProfessorAdmin && (
          <div className={`grid grid-cols-1 ${isSuperAdmin ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-3`}>
            <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Año *
            </label>
            <select
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1"
              value={filterYear}
              onChange={(e) => {
                setFilterYear(e.target.value);
                // No resetear filterFacultyId si es faculty-admin (ya que no pueden cambiarlo)
                if (!isFacultyAdmin) {
                  setFilterFacultyId('');
                }
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

          {/* Filtro Universidad: solo para super-admin */}
          {isSuperAdmin && (
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
          )}

          {/* Filtro Facultad: solo visible si NO es faculty-admin */}
          {!isFacultyAdmin && (
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
          )}

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
              disabled={isFacultyAdmin ? false : !filterFacultyId}
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
        )}

        {/* Mensaje cuando no están todos los filtros seleccionados */}
        {!isProfessorAdmin && !allFiltersSelected && (
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
      ) : (isProfessorAdmin && selectedProfessorCourse) || allFiltersSelected ? (
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
          {/* Para professor-admin en modo creación: mostrar solo info de la materia */}
          {isProfessorAdmin && modalMode === 'create' && selectedProfessorCourse && (
            <div className="bg-bg-tertiary/50 border border-border-secondary rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-text-primary mb-2">Materia Asignada</p>
              <div>
                <p className="text-xs text-text-disabled">Materia</p>
                <p className="text-sm text-text-primary font-medium">
                  {courses.find(c => c.course_id === selectedProfessorCourse)?.name || selectedProfessorCourse}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-disabled">Carrera</p>
                <p className="text-sm text-text-primary">
                  {careers.find(ca => ca.career_id === formData.career_id)?.name || formData.career_id}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-disabled">Facultad</p>
                <p className="text-sm text-text-primary">
                  {faculties.find(f => f.faculty_id === formData.faculty_id)?.name || formData.faculty_id}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-disabled">Universidad</p>
                <p className="text-sm text-text-primary">
                  {universities.find(u => u.university_id === formData.university_id)?.name || formData.university_id}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-disabled">Año</p>
                <p className="text-sm text-text-primary">{formData.year}</p>
              </div>
            </div>
          )}

          {/* Para faculty-admin en modo creación: mostrar info de universidad y facultad */}
          {isFacultyAdmin && modalMode === 'create' && userFacultyId && userUniversityId && (
            <div className="bg-bg-tertiary/50 border border-border-secondary rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-text-primary mb-2">Facultad Asignada</p>
              <div>
                <p className="text-xs text-text-disabled">Universidad</p>
                <p className="text-sm text-text-primary font-medium">
                  {universities.find(u => u.university_id === userUniversityId)?.name || userUniversityId}
                </p>
              </div>
              <div>
                <p className="text-xs text-text-disabled">Facultad</p>
                <p className="text-sm text-text-primary font-medium">
                  {faculties.find(f => f.faculty_id === userFacultyId)?.name || userFacultyId}
                </p>
              </div>
            </div>
          )}

          {/* Para otros roles o modo edición: mostrar campos normales */}
          {!(isProfessorAdmin && modalMode === 'create') && !(isFacultyAdmin && modalMode === 'create') && (
            <>
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
                </div>
              )}

              {/* Campo Facultad: solo visible si NO es faculty-admin */}
              {!isFacultyAdmin && (
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
              )}

              {/* Mostrar facultad actual como read-only si es faculty-admin en modo edición */}
              {isFacultyAdmin && userFacultyId && modalMode === 'edit' && (
                <div className="bg-bg-tertiary/50 border border-border-secondary rounded-lg p-3">
                  <p className="text-sm text-text-disabled mb-1">Facultad</p>
                  <p className="text-text-primary font-medium">
                    {faculties.find(f => f.faculty_id === userFacultyId)?.name || userFacultyId}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Campos que aparecen para faculty-admin en creación: Carrera, Año, Materia */}
          {isFacultyAdmin && modalMode === 'create' && (
            <>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Carrera *
                </label>
                <select
                  className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1 disabled:opacity-50"
                  value={formData.career_id}
                  onChange={(e) => setFormData({ ...formData, career_id: e.target.value })}
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Materia *
                </label>
                <select
                  className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1 disabled:opacity-50"
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  disabled={!formData.career_id}
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
              </div>
            </>
          )}

          {/* Para non-faculty/professor-admin o en modo edición: mostrar campos normales */}
          {!isFacultyAdmin && !(isProfessorAdmin && modalMode === 'create') && (
            <>
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
            </>
          )}

          {/* Datos de la comisión */}
          <div className="border-t border-border-primary pt-4">
            <Input
              label="Nombre de la Comisión *"
              placeholder="ej: Comisión 1K1"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={formErrors.name}
              tooltip="Nombre descriptivo de la comisión. Ej: Comisión 1K1, Turno Mañana, Grupo A"
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
              tooltip="Identificador único de la comisión en formato kebab-case. Ej: 1k1, turno-manana"
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

          {/* Sección de Asignación de Profesores (modo creación) */}
          {modalMode === 'create' && professors.length > 0 && (
            <div className="border-t border-border-primary pt-4">
              <h4 className="text-sm font-medium text-text-primary mb-3">
                👨‍🏫 Asignar Profesores (Opcional)
              </h4>

              {/* Lista de profesores seleccionados */}
              {selectedProfessorsForCreate.length > 0 && (
                <div className="mb-3 space-y-2">
                  {selectedProfessorsForCreate.map((profId) => {
                    const prof = professors.find(p => p._id === profId);
                    if (!prof) return null;
                    return (
                      <div
                        key={profId}
                        className="flex items-center justify-between p-2 bg-bg-tertiary rounded-lg border border-border-secondary"
                      >
                        <div>
                          <p className="text-sm text-text-primary font-medium">{prof.name}</p>
                          <p className="text-xs text-text-disabled">{prof.username}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRemoveProfessorForCreate(profId)}
                        >
                          Quitar
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Select para agregar profesor */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Agregar Profesor
                </label>
                <select
                  className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddProfessorForCreate(e.target.value);
                      e.target.value = ''; // Reset select
                    }
                  }}
                >
                  <option value="">Seleccionar profesor...</option>
                  {professors
                    .filter((prof) => !selectedProfessorsForCreate.includes(prof._id))
                    .map((prof) => (
                      <option key={prof._id} value={prof._id}>
                        {prof.name} ({prof.username})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {/* Sección de Asignación de Profesores (solo en modo edición) */}
          {modalMode === 'edit' && selectedCommission && (
            <div className="border-t border-border-primary pt-4">
              <h4 className="text-sm font-medium text-text-primary mb-3">
                👨‍🏫 Profesores Asignados
              </h4>

              {/* Lista de profesores asignados */}
              {selectedCommission.professors && selectedCommission.professors.length > 0 ? (
                <div className="mb-3 space-y-2">
                  {selectedCommission.professors.map((prof) => (
                    <div
                      key={prof._id}
                      className="flex items-center justify-between p-2 bg-bg-tertiary rounded-lg border border-border-secondary"
                    >
                      <div>
                        <p className="text-sm text-text-primary font-medium">{prof.name}</p>
                        <p className="text-xs text-text-disabled">{prof.username}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleRemoveProfessor(prof._id)}
                      >
                        Quitar
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mb-3 p-3 bg-bg-tertiary/50 rounded-lg border border-border-secondary/50">
                  <p className="text-sm text-text-disabled">No hay profesores asignados</p>
                </div>
              )}

              {/* Select para asignar nuevo profesor */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Asignar Profesor
                </label>
                <select
                  className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAssignProfessor(e.target.value);
                      e.target.value = ''; // Reset select
                    }
                  }}
                >
                  <option value="">Seleccionar profesor...</option>
                  {professors
                    .filter(
                      (prof) =>
                        !selectedCommission.professors?.some((assigned) => assigned._id === prof._id)
                    )
                    .map((prof) => (
                      <option key={prof._id} value={prof._id}>
                        {prof.name} ({prof.username})
                      </option>
                    ))}
                </select>
                {professors.length === 0 && (
                  <p className="mt-1 text-xs text-text-disabled">
                    No hay profesores disponibles en esta universidad
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </Card>
  );
};
