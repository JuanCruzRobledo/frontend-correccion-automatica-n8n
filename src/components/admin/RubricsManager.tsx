/**
 * RubricsManager - CRUD de Rúbricas
 * Panel de administración para gestionar rúbricas (JSON y PDF)
 */
import { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Select } from '../shared/Select';
import { Modal } from '../shared/Modal';
import { Table } from '../shared/Table';
import { Card } from '../shared/Card';
import { useAuth } from '../../hooks/useAuth';
import rubricService from '../../services/rubricService';
import universityService from '../../services/universityService';
import facultyService from '../../services/facultyService';
import careerService from '../../services/careerService';
import courseService from '../../services/courseService';
import commissionService from '../../services/commissionService';
import n8nService from '../../services/n8nService';
import type { Rubric, University, Faculty, Career, Course, Commission } from '../../types';

export const RubricsManager = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super-admin';
  const userUniversityId = user?.university_id;

  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [careers, setCareers] = useState<Career[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros (auto-filtrar por universidad si no es super-admin)
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterUniversityId, setFilterUniversityId] = useState(userUniversityId || '');
  const [filterFacultyId, setFilterFacultyId] = useState('');
  const [filterCareerId, setFilterCareerId] = useState('');
  const [filterCourseId, setFilterCourseId] = useState('');
  const [filterCommissionId, setFilterCommissionId] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create-json' | 'create-pdf' | 'edit' | 'view'>(
    'create-json'
  );
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    commission_id: string;
    course_id: string;
    career_id: string;
    faculty_id: string;
    university_id: string;
    rubric_type: import('../../types').RubricType;
    rubric_number: number;
    year: number;
    rubric_json: string;
    pdf_file: File | null;
  }>({
    name: '',
    commission_id: '',
    course_id: '',
    career_id: '',
    faculty_id: '',
    university_id: '',
    rubric_type: 'tp',
    rubric_number: 1,
    year: new Date().getFullYear(),
    rubric_json: '',
    pdf_file: null,
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    commission_id: '',
    course_id: '',
    career_id: '',
    faculty_id: '',
    university_id: '',
    rubric_type: '',
    rubric_number: '',
    year: '',
    rubric_json: '',
    pdf_file: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [generatingFromPDF, setGeneratingFromPDF] = useState(false);

  // Actualizar filtro de universidad cuando userUniversityId está disponible
  useEffect(() => {
    if (userUniversityId && !filterUniversityId) {
      setFilterUniversityId(userUniversityId);
    }
  }, [userUniversityId]);

  // Cargar datos al montar
  useEffect(() => {
    loadData();
  }, []);

  // Recargar rúbricas cuando cambian los filtros
  useEffect(() => {
    loadRubrics();
  }, [filterYear, filterUniversityId, filterFacultyId, filterCareerId, filterCourseId, filterCommissionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [universitiesData, facultiesData, careersData, coursesData, commissionsData] = await Promise.all([
        universityService.getUniversities(),
        facultyService.getFaculties(),
        careerService.getCareers(),
        courseService.getCourses(),
        commissionService.getCommissions(),
      ]);
      setUniversities(universitiesData);
      setFaculties(facultiesData);
      setCareers(careersData);
      setCourses(coursesData);
      setCommissions(commissionsData);
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadRubrics = async () => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (filterYear) params.year = parseInt(filterYear);
      if (filterUniversityId) params.university_id = filterUniversityId;
      if (filterFacultyId) params.faculty_id = filterFacultyId;
      if (filterCareerId) params.career_id = filterCareerId;
      if (filterCourseId) params.course_id = filterCourseId;
      if (filterCommissionId) params.commission_id = filterCommissionId;
      const data = await rubricService.getRubrics(params);
      setRubrics(data);
    } catch (err: unknown) {
      setError(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Error al cargar rúbricas'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromJSON = () => {
    setModalMode('create-json');
    setFormData({
      name: '',
      commission_id: filterCommissionId || '',
      course_id: filterCourseId || '',
      career_id: filterCareerId || '',
      faculty_id: filterFacultyId || '',
      university_id: userUniversityId || filterUniversityId || '',
      rubric_type: 'tp' as const,
      rubric_number: 1,
      year: filterYear ? parseInt(filterYear) : new Date().getFullYear(),
      rubric_json: '',
      pdf_file: null,
    });
    setFormErrors({
      name: '',
      commission_id: '',
      course_id: '',
      career_id: '',
      faculty_id: '',
      university_id: '',
      rubric_type: '',
      rubric_number: '',
      year: '',
      rubric_json: '',
      pdf_file: '',
    });
    setSelectedRubric(null);
    setIsModalOpen(true);
  };

  const handleCreateFromPDF = () => {
    setModalMode('create-pdf');
    setFormData({
      name: '',
      commission_id: filterCommissionId || '',
      course_id: filterCourseId || '',
      career_id: filterCareerId || '',
      faculty_id: filterFacultyId || '',
      university_id: userUniversityId || filterUniversityId || '',
      rubric_type: 'tp' as const,
      rubric_number: 1,
      year: filterYear ? parseInt(filterYear) : new Date().getFullYear(),
      rubric_json: '',
      pdf_file: null,
    });
    setFormErrors({
      name: '',
      commission_id: '',
      course_id: '',
      career_id: '',
      faculty_id: '',
      university_id: '',
      rubric_type: '',
      rubric_number: '',
      year: '',
      rubric_json: '',
      pdf_file: '',
    });
    setSelectedRubric(null);
    setIsModalOpen(true);
  };

  const handleView = (rubric: Rubric) => {
    setModalMode('view');
    setSelectedRubric(rubric);
    setFormData({
      name: rubric.name,
      commission_id: rubric.commission_id,
      course_id: rubric.course_id,
      career_id: rubric.career_id,
      faculty_id: rubric.faculty_id,
      university_id: rubric.university_id,
      rubric_type: rubric.rubric_type,
      rubric_number: rubric.rubric_number,
      year: rubric.year,
      rubric_json: JSON.stringify(rubric.rubric_json, null, 2),
      pdf_file: null,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (rubric: Rubric) => {
    setModalMode('edit');
    setSelectedRubric(rubric);
    setFormData({
      name: rubric.name,
      commission_id: rubric.commission_id,
      course_id: rubric.course_id,
      career_id: rubric.career_id,
      faculty_id: rubric.faculty_id,
      university_id: rubric.university_id,
      rubric_type: rubric.rubric_type,
      rubric_number: rubric.rubric_number,
      year: rubric.year,
      rubric_json: JSON.stringify(rubric.rubric_json, null, 2),
      pdf_file: null,
    });
    setFormErrors({
      name: '',
      commission_id: '',
      course_id: '',
      career_id: '',
      faculty_id: '',
      university_id: '',
      rubric_type: '',
      rubric_number: '',
      year: '',
      rubric_json: '',
      pdf_file: '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (rubric: Rubric) => {
    if (!confirm(`¿Estás seguro de eliminar la rúbrica "${rubric.name}"?`)) {
      return;
    }

    try {
      await rubricService.deleteRubric(rubric._id);
      await loadRubrics();
    } catch (err: unknown) {
      alert(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Error al eliminar rúbrica'
      );
    }
  };

  const handleDownloadJSON = (rubric: Rubric) => {
    const blob = new Blob([JSON.stringify(rubric.rubric_json, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${rubric.rubric_id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      commission_id: '',
      course_id: '',
      career_id: '',
      faculty_id: '',
      university_id: '',
      rubric_type: 'tp',
      rubric_number: 1,
      year: new Date().getFullYear(),
      rubric_json: '',
      pdf_file: null,
    });
    setFormErrors({
      name: '',
      commission_id: '',
      course_id: '',
      career_id: '',
      faculty_id: '',
      university_id: '',
      rubric_type: '',
      rubric_number: '',
      year: '',
      rubric_json: '',
      pdf_file: '',
    });
    setSelectedRubric(null);
  };

  const handleJSONFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        // Intentar parsear para validar que es JSON válido
        JSON.parse(content);
        // Si es válido, actualizar el textarea
        setFormData({
          ...formData,
          rubric_json: JSON.stringify(JSON.parse(content), null, 2)
        });
        setFormErrors({ ...formErrors, rubric_json: '' });
      } catch (err) {
        setFormErrors({
          ...formErrors,
          rubric_json: 'El archivo no contiene JSON válido'
        });
      }
    };
    reader.readAsText(file);
  };

  /**
   * Genera el JSON de la rúbrica desde el PDF usando n8n
   * Este es el nuevo flujo: generar → mostrar → editar (opcional) → guardar
   */
  const handleGenerateJSONFromPDF = async () => {
    // Validar campos requeridos antes de generar
    const errors = {
      name: '',
      commission_id: '',
      course_id: '',
      career_id: '',
      faculty_id: '',
      university_id: '',
      rubric_type: '',
      rubric_number: '',
      year: '',
      rubric_json: '',
      pdf_file: '',
    };

    if (!formData.pdf_file) {
      errors.pdf_file = 'Debes seleccionar un archivo PDF';
      setFormErrors(errors);
      return;
    }

    try {
      setGeneratingFromPDF(true);
      setFormErrors({
        name: '',
        commission_id: '',
        course_id: '',
        career_id: '',
        faculty_id: '',
        university_id: '',
        rubric_type: '',
        rubric_number: '',
        year: '',
        rubric_json: '',
        pdf_file: '',
      });

      // Llamar directamente a n8n para generar el JSON
      const rubricJsonObject = await n8nService.generateRubricFromPDF(formData.pdf_file);

      // Formatear el JSON y mostrarlo en el textarea
      const formattedJson = JSON.stringify(rubricJsonObject, null, 2);
      setFormData({ ...formData, rubric_json: formattedJson });

      alert('✅ JSON generado exitosamente. Revisa y edita si es necesario, luego presiona "Guardar".');
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'message' in err
        ? String(err.message)
        : 'Error al generar JSON desde PDF';

      setFormErrors({ ...formErrors, pdf_file: errorMessage });
      alert('❌ ' + errorMessage);
    } finally {
      setGeneratingFromPDF(false);
    }
  };

  const handleSubmit = async () => {
    // Validar
    const errors = {
      name: '',
      commission_id: '',
      course_id: '',
      career_id: '',
      faculty_id: '',
      university_id: '',
      rubric_type: '',
      rubric_number: '',
      year: '',
      rubric_json: '',
      pdf_file: '',
    };

    if (!formData.name.trim()) errors.name = 'El nombre es requerido';
    if (!formData.commission_id) errors.commission_id = 'La comisión es requerida';
    if (!formData.course_id) errors.course_id = 'El curso es requerido';
    if (!formData.career_id) errors.career_id = 'La carrera es requerida';
    if (!formData.faculty_id) errors.faculty_id = 'La facultad es requerida';
    if (!formData.university_id) errors.university_id = 'La universidad es requerida';

    // Para create-json, edit y create-pdf (ahora también requiere JSON)
    if (modalMode === 'create-json' || modalMode === 'edit' || modalMode === 'create-pdf') {
      if (!formData.rubric_json.trim()) {
        errors.rubric_json = 'El JSON de la rúbrica es requerido. Primero genera el JSON desde el PDF.';
      } else {
        try {
          JSON.parse(formData.rubric_json);
        } catch {
          errors.rubric_json = 'El JSON no es válido';
        }
      }
    }

    if (Object.values(errors).some((e) => e)) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);

      if (modalMode === 'create-json' || modalMode === 'create-pdf') {
        // Ambos modos ahora usan el mismo endpoint (con JSON ya generado)
        await rubricService.createRubric({
          name: formData.name,
          commission_id: formData.commission_id,
          course_id: formData.course_id,
          career_id: formData.career_id,
          faculty_id: formData.faculty_id,
          university_id: formData.university_id,
          rubric_type: formData.rubric_type,
          rubric_number: formData.rubric_number,
          year: formData.year,
          rubric_json: JSON.parse(formData.rubric_json),
        });
      } else if (modalMode === 'edit' && selectedRubric) {
        await rubricService.updateRubric(selectedRubric._id, {
          name: formData.name,
          rubric_json: JSON.parse(formData.rubric_json),
        });
      }

      setIsModalOpen(false);
      await loadRubrics();
    } catch (err: unknown) {
      alert(
        err && typeof err === 'object' && 'message' in err
          ? String(err.message)
          : 'Error al guardar rúbrica'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Obtener nombres
  const getUniversityName = (universityId: string) => {
    const uni = universities.find((u) => u.university_id === universityId);
    return uni ? uni.name : universityId;
  };

  const getCourseName = (courseId: string) => {
    const course = courses.find((c) => c.course_id === courseId);
    return course ? course.name : courseId;
  };

  const getCommissionName = (commissionId: string) => {
    const commission = commissions.find((c) => c.commission_id === commissionId);
    return commission ? commission.name : commissionId;
  };

  // Columnas de la tabla
  const columns = [
    { header: 'Nombre', accessor: 'name' as keyof Rubric },
    {
      header: 'Materia',
      accessor: (row: Rubric) => getCourseName(row.course_id),
    },
    {
      header: 'Comisión',
      accessor: (row: Rubric) => getCommissionName(row.commission_id),
    },
    {
      header: 'Año',
      accessor: (row: Rubric) => row.year,
    },
    {
      header: 'Fuente',
      accessor: (row: Rubric) => (
        <span
          className={`px-2 py-1 rounded text-xs ${row.source === 'pdf'
            ? 'bg-danger-1/20 text-danger-1'
            : row.source === 'json'
              ? 'bg-accent-1/20 text-accent-1'
              : 'bg-bg-tertiary/20 text-text-tertiary'
            }`}
        >
          {row.source.toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Acciones',
      accessor: (row: Rubric) => (
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="secondary" onClick={() => handleView(row)}>
            Ver
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleEdit(row)}>
            Editar
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleDownloadJSON(row)}>
            Descargar
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(row)}>
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  // Años disponibles para el filtro
  const availableYears = Array.from(
    new Set(courses.map(c => c.year).filter((year): year is number => year !== undefined))
  ).sort((a, b) => b - a);

  // Facultades filtradas para el filtro principal
  const filteredFacultiesForFilter = filterUniversityId
    ? faculties.filter(f => f.university_id === filterUniversityId)
    : faculties;

  // Carreras filtradas para el filtro principal
  const filteredCareersForFilter = filterFacultyId
    ? careers.filter(c => c.faculty_id === filterFacultyId)
    : careers;

  // Materias filtradas para el filtro principal
  const filteredCoursesForFilter = filterCareerId
    ? courses.filter(c => c.career_id === filterCareerId && c.year?.toString() === filterYear)
    : courses.filter(c => c.year?.toString() === filterYear);

  // Comisiones filtradas para el filtro principal
  const filteredCommissionsForFilter = filterCourseId
    ? commissions.filter(c =>
        c.course_id === filterCourseId &&
        c.career_id === filterCareerId &&
        c.faculty_id === filterFacultyId &&
        c.university_id === filterUniversityId &&
        c.year?.toString() === filterYear
      )
    : [];

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

  const filteredCommissionsForModal = formData.course_id
    ? commissions.filter(c =>
        c.course_id === formData.course_id &&
        c.career_id === formData.career_id &&
        c.faculty_id === formData.faculty_id &&
        c.university_id === formData.university_id &&
        c.year === formData.year
      )
    : [];

  // Verificar si todos los filtros están seleccionados
  const allFiltersSelected = filterYear && filterUniversityId && filterFacultyId && filterCareerId && filterCourseId && filterCommissionId;

  return (
    <Card title="Gestión de Rúbricas">
      <div className="mb-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-text-disabled text-sm">{rubrics.length} rúbricas registradas</p>

          <div className="flex gap-2">
            <Button onClick={handleCreateFromJSON}>+ Desde JSON</Button>
            <Button onClick={handleCreateFromPDF} variant="secondary">
              + Desde PDF
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className={`grid grid-cols-1 md:grid-cols-3 ${isSuperAdmin ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-3`}>
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
                setFilterCommissionId('');
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
                  setFilterCommissionId('');
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
                setFilterCommissionId('');
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
                setFilterCommissionId('');
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
              onChange={(e) => {
                setFilterCourseId(e.target.value);
                setFilterCommissionId('');
              }}
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

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Comisión *
            </label>
            <select
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1 disabled:opacity-50"
              value={filterCommissionId}
              onChange={(e) => setFilterCommissionId(e.target.value)}
              disabled={!filterCourseId}
            >
              <option value="">Seleccionar comisión...</option>
              {filteredCommissionsForFilter.map((commission) => (
                <option key={commission._id} value={commission.commission_id}>
                  {commission.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mensaje cuando no están todos los filtros seleccionados */}
        {!allFiltersSelected && (
          <div className="mt-3 bg-accent-1/10 border border-accent-1/50 rounded-xl p-3">
            <p className="text-accent-1 text-sm">
              📋 Por favor, selecciona todos los filtros (Año, Universidad, Facultad, Carrera, Materia y Comisión) para ver las rúbricas.
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
        <Table
          data={rubrics}
          columns={columns}
          emptyMessage="No hay rúbricas registradas para los filtros seleccionados"
        />
      ) : null}

      {/* Modal Crear/Editar/Ver */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          modalMode === 'create-json'
            ? 'Crear Rúbrica desde JSON'
            : modalMode === 'create-pdf'
              ? 'Crear Rúbrica desde PDF'
              : modalMode === 'edit'
                ? 'Editar Rúbrica'
                : 'Ver Rúbrica'
        }
        showFooter={modalMode !== 'view'}
        confirmText="Guardar"
        onConfirm={handleSubmit}
        confirmLoading={submitting}
        size="xl"
      >
        <div className="space-y-4">
          <Input
            label="Nombre de la Rúbrica"
            placeholder="ej: TP Listas - Python"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            disabled={modalMode === 'view'}
            tooltip="Nombre descriptivo de la rúbrica de evaluación. Ej: TP1 - Listas, Parcial 2do Cuatrimestre"
          />

          {/* Campo Universidad: solo visible para super-admin */}
          {isSuperAdmin && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Universidad *
              </label>
              <select
                className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1"
                value={formData.university_id}
                onChange={(e) => setFormData({ ...formData, university_id: e.target.value, faculty_id: '', career_id: '', course_id: '', commission_id: '' })}
                disabled={modalMode === 'view' || modalMode === 'edit'}
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
              {(modalMode === 'edit' || modalMode === 'view') && (
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

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Facultad *
            </label>
            <select
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1 disabled:opacity-50"
              value={formData.faculty_id}
              onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value, career_id: '', course_id: '', commission_id: '' })}
              disabled={!formData.university_id || modalMode === 'view' || modalMode === 'edit'}
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
              onChange={(e) => setFormData({ ...formData, career_id: e.target.value, course_id: '', commission_id: '' })}
              disabled={!formData.faculty_id || modalMode === 'view' || modalMode === 'edit'}
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
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear(), course_id: '', commission_id: '' })}
              error={formErrors.year}
              disabled={modalMode === 'view' || modalMode === 'edit'}
            />
            {(modalMode === 'edit' || modalMode === 'view') && (
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
              onChange={(e) => setFormData({ ...formData, course_id: e.target.value, commission_id: '' })}
              disabled={!formData.career_id || modalMode === 'view' || modalMode === 'edit'}
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
            {(modalMode === 'edit' || modalMode === 'view') && (
              <p className="mt-1 text-xs text-text-disabled">La materia no se puede modificar</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Comisión *
            </label>
            <select
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1 disabled:opacity-50"
              value={formData.commission_id}
              onChange={(e) => setFormData({ ...formData, commission_id: e.target.value })}
              disabled={!formData.course_id || modalMode === 'view' || modalMode === 'edit'}
            >
              <option value="">Seleccionar comisión...</option>
              {filteredCommissionsForModal.map((commission) => (
                <option key={commission._id} value={commission.commission_id}>
                  {commission.name}
                </option>
              ))}
            </select>
            {formErrors.commission_id && (
              <p className="mt-1 text-xs text-danger-1">{formErrors.commission_id}</p>
            )}
            {(modalMode === 'edit' || modalMode === 'view') && (
              <p className="mt-1 text-xs text-text-disabled">La comisión no se puede modificar</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Tipo de Rúbrica *
              </label>
              <select
                className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1 disabled:opacity-50"
                value={formData.rubric_type}
                onChange={(e) => setFormData({ ...formData, rubric_type: e.target.value as import('../../types').RubricType })}
                disabled={modalMode === 'view' || modalMode === 'edit'}
              >
                <option value="tp">TP - Trabajo Práctico</option>
                <option value="parcial-1">Parcial 1</option>
                <option value="parcial-2">Parcial 2</option>
                <option value="recuperatorio-1">Recuperatorio 1</option>
                <option value="recuperatorio-2">Recuperatorio 2</option>
                <option value="final">Final</option>
                <option value="global">Global</option>
              </select>
              {formErrors.rubric_type && (
                <p className="mt-1 text-xs text-danger-1">{formErrors.rubric_type}</p>
              )}
              {(modalMode === 'edit' || modalMode === 'view') && (
                <p className="mt-1 text-xs text-text-disabled">El tipo no se puede modificar</p>
              )}
            </div>

            <div>
              <Input
                label="Número de Rúbrica *"
                type="number"
                min={1}
                placeholder="1"
                value={formData.rubric_number.toString()}
                onChange={(e) => setFormData({ ...formData, rubric_number: parseInt(e.target.value) || 1 })}
                error={formErrors.rubric_number}
                disabled={modalMode === 'view' || modalMode === 'edit'}
              />
              {(modalMode === 'edit' || modalMode === 'view') && (
                <p className="mt-1 text-xs text-text-disabled">El número no se puede modificar</p>
              )}
            </div>
          </div>

          {modalMode === 'create-pdf' && (
            <div>
              <label className="block text-sm font-medium text-text-tertiary mb-2">
                Archivo PDF
              </label>
              <div className="space-y-3">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setFormData({ ...formData, pdf_file: file });
                  }}
                  className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary/60 rounded-2xl text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gradient-to-r file:from-accent-1 file:to-accent-2 file:text-white hover:file:from-accent-2 hover:file:to-accent-3 transition-all"
                />
                {formErrors.pdf_file && (
                  <p className="mt-1.5 text-sm text-danger-1">{formErrors.pdf_file}</p>
                )}

                <Button
                  onClick={handleGenerateJSONFromPDF}
                  disabled={!formData.pdf_file || generatingFromPDF}
                  variant="primary"
                  className="w-full"
                >
                  {generatingFromPDF ? '⏳ Generando JSON desde PDF...' : '🚀 Generar JSON desde PDF'}
                </Button>

                <p className="text-sm text-text-tertiary">
                  1. Selecciona un PDF<br />
                  2. Haz clic en "Generar JSON desde PDF"<br />
                  3. Revisa/edita el JSON generado abajo<br />
                  4. Haz clic en "Guardar" para persistir en la base de datos
                </p>
              </div>
            </div>
          )}

          {(modalMode === 'create-json' || modalMode === 'create-pdf' || modalMode === 'edit' || modalMode === 'view') && (
            <div>
              <label className="block text-sm font-medium text-text-tertiary mb-2">
                JSON de la Rúbrica
                {modalMode === 'create-pdf' && !formData.rubric_json && (
                  <span className="ml-2 text-xs text-text-tertiary">(Se generará al procesar el PDF)</span>
                )}
              </label>

              {/* Archivo JSON - Solo visible en create-json y edit */}
              {(modalMode === 'create-json' || modalMode === 'edit') && (
                <div className="mb-3">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleJSONFileUpload}
                    className="w-full px-4 py-2.5 bg-bg-tertiary border border-border-primary/60 rounded-2xl text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gradient-to-r file:from-accent-1 file:to-accent-2 file:text-white hover:file:from-accent-2 hover:file:to-accent-3 transition-all mb-3"
                  />
                  <p className="text-sm text-text-tertiary mt-1">
                    Sube un archivo JSON o pega el contenido directamente abajo
                  </p>
                </div>
              )}

              {/* Textarea para JSON */}
              <textarea
                rows={15}
                value={formData.rubric_json}
                onChange={(e) => setFormData({ ...formData, rubric_json: e.target.value })}
                disabled={modalMode === 'view'}
                className={`w-full px-4 py-2.5 bg-bg-tertiary border ${formErrors.rubric_json ? 'border-danger-1' : 'border-border-primary/60'
                  } rounded-2xl text-text-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-accent-1/70 disabled:opacity-40`}
                placeholder={modalMode === 'create-pdf'
                  ? 'El JSON se generará automáticamente al procesar el PDF...'
                  : '{"rubric_id": "...", "title": "...", ...}'}
              />
              {formErrors.rubric_json && (
                <p className="mt-1.5 text-sm text-danger-1">{formErrors.rubric_json}</p>
              )}
              {modalMode === 'create-pdf' && formData.rubric_json && (
                <p className="mt-1.5 text-sm text-accent-1">
                  ✅ JSON generado correctamente. Puedes editarlo antes de guardar.
                </p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </Card>
  );
};

export default RubricsManager;
