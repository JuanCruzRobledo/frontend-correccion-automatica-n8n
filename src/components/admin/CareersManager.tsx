/**
 * CareersManager - CRUD de Carreras
 * Panel de administración para gestionar carreras
 */
import { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Modal } from '../shared/Modal';
import { Table } from '../shared/Table';
import { Card } from '../shared/Card';
import careerService from '../../services/careerService';
import facultyService from '../../services/facultyService';
import universityService from '../../services/universityService';
import { suggestUniversityId, cleanId } from '../../utils/slugify';
import type { Career, Faculty, University } from '../../types';

export const CareersManager = () => {
  const [careers, setCareers] = useState<Career[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [filterUniversityId, setFilterUniversityId] = useState('');
  const [filterFacultyId, setFilterFacultyId] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCareer, setSelectedCareer] = useState<Career | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    career_id: '',
    name: '',
    faculty_id: '',
    university_id: '',
  });
  const [formErrors, setFormErrors] = useState({ career_id: '', name: '', faculty_id: '', university_id: '' });
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
    if (modalMode !== 'create' || !formData.career_id.trim() || !formData.faculty_id) {
      setIsDuplicate(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCheckingDuplicate(true);
      try {
        const existing = careers.find(
          (c) =>
            c.career_id.toLowerCase() === formData.career_id.toLowerCase() &&
            c.faculty_id === formData.faculty_id
        );
        setIsDuplicate(!!existing);
      } catch (err) {
        console.error('Error checking duplicate:', err);
      } finally {
        setCheckingDuplicate(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.career_id, formData.faculty_id, modalMode, careers]);

  // Actualizar filtro de facultades cuando cambia universidad en modal
  useEffect(() => {
    if (formData.university_id) {
      const filteredFaculties = faculties.filter(f => f.university_id === formData.university_id);
      // Si la facultad seleccionada no está en la nueva universidad, limpiarla
      if (formData.faculty_id && !filteredFaculties.find(f => f.faculty_id === formData.faculty_id)) {
        setFormData(prev => ({ ...prev, faculty_id: '' }));
      }
    }
  }, [formData.university_id, faculties, formData.faculty_id]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [careersData, facultiesData, universitiesData] = await Promise.all([
        careerService.getCareers(),
        facultyService.getFaculties(),
        universityService.getUniversities(),
      ]);
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
    setFormData({ career_id: '', name: '', faculty_id: '', university_id: '' });
    setFormErrors({ career_id: '', name: '', faculty_id: '', university_id: '' });
    setSelectedCareer(null);
    setSuggestedId('');
    setIsDuplicate(false);
    setCheckingDuplicate(false);
    setIsModalOpen(true);
  };

  const handleUseSuggestion = () => {
    setFormData({ ...formData, career_id: suggestedId });
  };

  const handleEdit = (career: Career) => {
    setModalMode('edit');
    setFormData({
      career_id: career.career_id,
      name: career.name,
      faculty_id: career.faculty_id,
      university_id: career.university_id,
    });
    setFormErrors({ career_id: '', name: '', faculty_id: '', university_id: '' });
    setSelectedCareer(career);
    setIsModalOpen(true);
  };

  const handleDelete = async (career: Career) => {
    if (!confirm(`¿Estás seguro de eliminar la carrera "${career.name}"?`)) {
      return;
    }

    try {
      await careerService.deleteCareer(career._id);
      await loadData();
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al eliminar carrera');
    }
  };

  const handleSubmit = async () => {
    // Validar
    const errors = { career_id: '', name: '', faculty_id: '', university_id: '' };
    if (!formData.career_id.trim()) errors.career_id = 'El ID es requerido';
    if (!formData.name.trim()) errors.name = 'El nombre es requerido';
    if (!formData.faculty_id) errors.faculty_id = 'La facultad es requerida';
    if (!formData.university_id) errors.university_id = 'La universidad es requerida';
    if (isDuplicate) errors.career_id = 'Este ID ya existe en esta facultad';

    if (errors.career_id || errors.name || errors.faculty_id || errors.university_id) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);

      if (modalMode === 'create') {
        await careerService.createCareer(formData);
      } else if (selectedCareer) {
        await careerService.updateCareer(selectedCareer._id, {
          name: formData.name,
          faculty_id: formData.faculty_id,
          university_id: formData.university_id,
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al guardar carrera');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtrar carreras
  const filteredCareers = careers.filter(career => {
    if (filterUniversityId && career.university_id !== filterUniversityId) return false;
    if (filterFacultyId && career.faculty_id !== filterFacultyId) return false;
    return true;
  });

  // Facultades filtradas por universidad seleccionada en filtro
  const filteredFacultiesForFilter = filterUniversityId
    ? faculties.filter(f => f.university_id === filterUniversityId)
    : faculties;

  // Facultades filtradas por universidad seleccionada en modal
  const filteredFacultiesForModal = formData.university_id
    ? faculties.filter(f => f.university_id === formData.university_id)
    : [];

  // Columnas de la tabla
  const columns = [
    { header: 'ID', accessor: 'career_id' as keyof Career },
    { header: 'Nombre', accessor: 'name' as keyof Career },
    {
      header: 'Facultad',
      accessor: (row: Career) => {
        const faculty = faculties.find((f) => f.faculty_id === row.faculty_id);
        return faculty?.name || row.faculty_id;
      },
    },
    {
      header: 'Universidad',
      accessor: (row: Career) => {
        const university = universities.find((u) => u.university_id === row.university_id);
        return university?.name || row.university_id;
      },
    },
    {
      header: 'Acciones',
      accessor: (row: Career) => (
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
    <Card title="Gestión de Carreras">
      <div className="mb-4 space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-text-disabled text-sm">
            {filteredCareers.length} carrera{filteredCareers.length !== 1 ? 's' : ''} {filteredCareers.length !== careers.length ? `(de ${careers.length} totales)` : 'registradas'}
          </p>
          <Button onClick={handleCreate}>+ Crear Carrera</Button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Filtrar por Universidad
            </label>
            <select
              className="w-full px-3 py-2 bg-bg-secondary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1"
              value={filterUniversityId}
              onChange={(e) => {
                setFilterUniversityId(e.target.value);
                setFilterFacultyId(''); // Limpiar filtro de facultad
              }}
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
        <Table data={filteredCareers} columns={columns} emptyMessage="No hay carreras registradas" />
      )}

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Crear Carrera' : 'Editar Carrera'}
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
              {filteredFacultiesForModal.map((faculty) => (
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

          <Input
            label="Nombre"
            placeholder="ej: Ingeniería en Sistemas de Información"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
          />

          <div>
            <Input
              label="ID de la Carrera"
              placeholder="ej: isi"
              value={formData.career_id}
              onChange={(e) =>
                setFormData({ ...formData, career_id: cleanId(e.target.value) })
              }
              error={formErrors.career_id}
              disabled={modalMode === 'edit'}
              helperText={modalMode === 'edit' ? 'El ID no se puede modificar' : 'Solo minúsculas, números y guiones'}
            />

            {/* Sugerencia de ID */}
            {modalMode === 'create' && suggestedId && suggestedId !== formData.career_id && (
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
            {modalMode === 'create' && formData.career_id && formData.faculty_id && (
              <>
                {checkingDuplicate && (
                  <div className="mt-2 p-2 bg-bg-tertiary/50 border border-border-secondary/50 rounded-lg">
                    <p className="text-xs text-text-tertiary">Verificando disponibilidad...</p>
                  </div>
                )}
                {!checkingDuplicate && isDuplicate && (
                  <div className="mt-2 p-2 bg-danger-1/10 border border-danger-1/50 rounded-lg">
                    <p className="text-xs text-danger-1">⚠️ Este ID ya está en uso en esta facultad</p>
                  </div>
                )}
                {!checkingDuplicate && !isDuplicate && formData.career_id.length >= 2 && (
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
