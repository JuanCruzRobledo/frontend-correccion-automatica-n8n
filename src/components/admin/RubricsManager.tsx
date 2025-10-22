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
  const [formData, setFormData] = useState({
    name: '',
    university_id: '',
    course_id: '',
    rubric_json: '',
    pdf_file: null as File | null,
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    university_id: '',
    course_id: '',
    rubric_json: '',
    pdf_file: '',
  });
  const [submitting, setSubmitting] = useState(false);

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
      const data = await rubricService.getRubrics(universityId, courseId);
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
    resetForm();
    setIsModalOpen(true);
  };

  const handleCreateFromPDF = () => {
    setModalMode('create-pdf');
    resetForm();
    setIsModalOpen(true);
  };

  const handleView = (rubric: Rubric) => {
    setModalMode('view');
    setSelectedRubric(rubric);
    setFormData({
      name: rubric.name,
      university_id: rubric.university_id,
      course_id: rubric.course_id,
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
      university_id: rubric.university_id,
      course_id: rubric.course_id,
      rubric_json: JSON.stringify(rubric.rubric_json, null, 2),
      pdf_file: null,
    });
    setFormErrors({ name: '', university_id: '', course_id: '', rubric_json: '', pdf_file: '' });
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
      university_id: '',
      course_id: '',
      rubric_json: '',
      pdf_file: null,
    });
    setFormErrors({
      name: '',
      university_id: '',
      course_id: '',
      rubric_json: '',
      pdf_file: '',
    });
    setSelectedRubric(null);
  };

  const handleSubmit = async () => {
    // Validar
    const errors = {
      name: '',
      university_id: '',
      course_id: '',
      rubric_json: '',
      pdf_file: '',
    };

    if (!formData.name.trim()) errors.name = 'El nombre es requerido';
    if (!formData.university_id) errors.university_id = 'La universidad es requerida';
    if (!formData.course_id) errors.course_id = 'El curso es requerido';

    if (modalMode === 'create-json' || modalMode === 'edit') {
      if (!formData.rubric_json.trim()) {
        errors.rubric_json = 'El JSON de la rúbrica es requerido';
      } else {
        try {
          JSON.parse(formData.rubric_json);
        } catch {
          errors.rubric_json = 'El JSON no es válido';
        }
      }
    }

    if (modalMode === 'create-pdf' && !formData.pdf_file) {
      errors.pdf_file = 'El archivo PDF es requerido';
    }

    if (Object.values(errors).some((e) => e)) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);

      if (modalMode === 'create-json') {
        await rubricService.createRubric({
          name: formData.name,
          university_id: formData.university_id,
          course_id: formData.course_id,
          rubric_json: JSON.parse(formData.rubric_json),
        });
      } else if (modalMode === 'create-pdf' && formData.pdf_file) {
        await rubricService.createRubricFromPDF({
          name: formData.name,
          university_id: formData.university_id,
          course_id: formData.course_id,
          pdf: formData.pdf_file,
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
          className={`px-2 py-1 rounded text-xs ${
            row.source === 'pdf'
              ? 'bg-rose-500/20 text-rose-300'
              : row.source === 'json'
              ? 'bg-sky-500/20 text-sky-300'
              : 'bg-slate-500/20 text-slate-300'
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
          <p className="text-slate-400 text-sm">{rubrics.length} rúbricas registradas</p>

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
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Archivo PDF
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setFormData({ ...formData, pdf_file: file });
                }}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800/60 rounded-2xl text-slate-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-sky-400 file:text-white hover:file:bg-sky-500 transition-all"
              />
              {formErrors.pdf_file && (
                <p className="mt-1.5 text-sm text-rose-400">{formErrors.pdf_file}</p>
              )}
              <p className="mt-1.5 text-sm text-slate-400">
                El PDF será procesado por n8n para generar la rúbrica automáticamente
              </p>
            </div>
          )}

          {(modalMode === 'create-json' || modalMode === 'edit' || modalMode === 'view') && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                JSON de la Rúbrica
              </label>
              <textarea
                rows={15}
                value={formData.rubric_json}
                onChange={(e) => setFormData({ ...formData, rubric_json: e.target.value })}
                disabled={modalMode === 'view'}
                className={`w-full px-4 py-2.5 bg-slate-950 border ${
                  formErrors.rubric_json ? 'border-rose-500' : 'border-slate-800/60'
                } rounded-2xl text-slate-100 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400/70 disabled:opacity-40`}
                placeholder='{"rubric_id": "...", "title": "...", ...}'
              />
              {formErrors.rubric_json && (
                <p className="mt-1.5 text-sm text-rose-400">{formErrors.rubric_json}</p>
              )}
            </div>
          )}
        </div>
      </Modal>
    </Card>
  );
};

export default RubricsManager;
