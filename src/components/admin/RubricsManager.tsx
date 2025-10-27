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
import rubricService from '../../services/rubricService';
import universityService from '../../services/universityService';
import courseService from '../../services/courseService';
import n8nService from '../../services/n8nService';
import type { Rubric, University, Course } from '../../types';

export const RubricsManager = () => {
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [filterUniversityId, setFilterUniversityId] = useState('');
  const [filterCourseId, setFilterCourseId] = useState('');

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

  // Cargar datos al montar
  useEffect(() => {
    loadUniversities();
    loadAllCourses(); // Cargar TODOS los cursos una sola vez
    loadRubrics();
  }, []);

  // Reset course filter cuando cambia la universidad del filtro
  useEffect(() => {
    setFilterCourseId(''); // Reset course filter
  }, [filterUniversityId]);

  // Recargar rúbricas cuando cambian los filtros
  useEffect(() => {
    loadRubrics(filterUniversityId, filterCourseId);
  }, [filterUniversityId, filterCourseId]);

  const loadUniversities = async () => {
    try {
      const data = await universityService.getUniversities();
      setUniversities(data);
    } catch (err: unknown) {
      console.error('Error al cargar universidades:', err);
    }
  };

  const loadAllCourses = async () => {
    try {
      // Cargar TODOS los cursos sin filtro
      const data = await courseService.getCourses();
      setCourses(data);
    } catch (err: unknown) {
      console.error('Error al cargar cursos:', err);
    }
  };

  const loadRubrics = async (universityId?: string, courseId?: string) => {
    try {
      setLoading(true);
      setError('');
      const params: any = {};
      if (universityId) params.university_id = universityId;
      if (courseId) params.course_id = courseId;
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
      commission_id: '',
      course_id: filterCourseId || '',
      career_id: '',
      faculty_id: '',
      university_id: filterUniversityId || '',
      rubric_type: 'tp' as const,
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
    setIsModalOpen(true);
  };

  const handleCreateFromPDF = () => {
    setModalMode('create-pdf');
    setFormData({
      name: '',
      commission_id: '',
      course_id: filterCourseId || '',
      career_id: '',
      faculty_id: '',
      university_id: filterUniversityId || '',
      rubric_type: 'tp' as const,
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
      await loadRubrics(filterUniversityId, filterCourseId);
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
      await loadRubrics(filterUniversityId, filterCourseId);
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

  // Columnas de la tabla
  const columns = [
    { header: 'Nombre', accessor: 'name' as keyof Rubric },
    {
      header: 'Universidad',
      accessor: (row: Rubric) => getUniversityName(row.university_id),
    },
    {
      header: 'Curso',
      accessor: (row: Rubric) => getCourseName(row.course_id),
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

  // Filtrar cursos en memoria según universidad seleccionada en filtros
  // Solo muestra cursos de la universidad seleccionada
  const filteredCoursesForFilter = filterUniversityId
    ? courses.filter((c) => c.university_id === filterUniversityId)
    : [];

  // Filtrar cursos en memoria según universidad seleccionada en formulario
  // Solo muestra cursos de la universidad seleccionada
  const filteredCoursesForForm = formData.university_id
    ? courses.filter((c) => c.university_id === formData.university_id)
    : [];

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
        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            options={universities.map((u) => ({
              value: u.university_id,
              label: u.name,
            }))}
            value={filterUniversityId}
            onChange={(e) => setFilterUniversityId(e.target.value)}
            placeholder="Filtrar por universidad"
            className="w-full sm:w-64"
          />
          <Select
            options={filteredCoursesForFilter.map((c) => ({
              value: c.course_id,
              label: c.name,
            }))}
            value={filterCourseId}
            onChange={(e) => setFilterCourseId(e.target.value)}
            placeholder="Filtrar por curso"
            className="w-full sm:w-64"
            disabled={!filterUniversityId}
          />
        </div>
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
        <Table
          data={rubrics}
          columns={columns}
          emptyMessage="No hay rúbricas registradas"
        />
      )}

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
          />

          <Select
            label="Universidad"
            options={universities.map((u) => ({
              value: u.university_id,
              label: u.name,
            }))}
            value={formData.university_id}
            onChange={(e) => {
              setFormData({ ...formData, university_id: e.target.value, course_id: '' });
            }}
            error={formErrors.university_id}
            placeholder="Selecciona una universidad"
            disabled={modalMode === 'view' || modalMode === 'edit'}
          />

          <Select
            label="Curso"
            options={filteredCoursesForForm.map((c) => ({
              value: c.course_id,
              label: c.name,
            }))}
            value={formData.course_id}
            onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
            error={formErrors.course_id}
            placeholder="Selecciona un curso"
            disabled={
              !formData.university_id || modalMode === 'view' || modalMode === 'edit'
            }
          />

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
