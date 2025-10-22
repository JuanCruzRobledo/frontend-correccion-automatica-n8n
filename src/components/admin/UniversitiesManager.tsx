/**
 * UniversitiesManager - CRUD de Universidades
 * Panel de administración para gestionar universidades
 */
import { useState, useEffect } from 'react';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Modal } from '../shared/Modal';
import { Table } from '../shared/Table';
import { Card } from '../shared/Card';
import universityService from '../../services/universityService';
import { suggestUniversityId, cleanId, isValidId } from '../../utils/slugify';
import type { University } from '../../types';

export const UniversitiesManager = () => {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    university_id: '',
    name: '',
  });
  const [formErrors, setFormErrors] = useState({ university_id: '', name: '' });
  const [submitting, setSubmitting] = useState(false);
  const [suggestedId, setSuggestedId] = useState('');
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);

  // Cargar universidades al montar
  useEffect(() => {
    loadUniversities();
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
    if (modalMode !== 'create' || !formData.university_id.trim()) {
      setIsDuplicate(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setCheckingDuplicate(true);
      try {
        const existing = universities.find(
          (u) => u.university_id.toLowerCase() === formData.university_id.toLowerCase()
        );
        setIsDuplicate(!!existing);
      } catch (err) {
        console.error('Error checking duplicate:', err);
      } finally {
        setCheckingDuplicate(false);
      }
    }, 500); // Debounce de 500ms

    return () => clearTimeout(timeoutId);
  }, [formData.university_id, modalMode, universities]);

  const loadUniversities = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await universityService.getUniversities();
      setUniversities(data);
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al cargar universidades');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setFormData({ university_id: '', name: '' });
    setFormErrors({ university_id: '', name: '' });
    setSelectedUniversity(null);
    setSuggestedId('');
    setIsDuplicate(false);
    setCheckingDuplicate(false);
    setIsModalOpen(true);
  };

  const handleUseSuggestion = () => {
    setFormData({ ...formData, university_id: suggestedId });
  };

  const handleEdit = (university: University) => {
    setModalMode('edit');
    setFormData({
      university_id: university.university_id,
      name: university.name,
    });
    setFormErrors({ university_id: '', name: '' });
    setSelectedUniversity(university);
    setIsModalOpen(true);
  };

  const handleDelete = async (university: University) => {
    if (!confirm(`¿Estás seguro de eliminar la universidad "${university.name}"?`)) {
      return;
    }

    try {
      await universityService.deleteUniversity(university._id);
      await loadUniversities();
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al eliminar universidad');
    }
  };

  const handleSubmit = async () => {
    // Validar
    const errors = { university_id: '', name: '' };
    if (!formData.university_id.trim()) errors.university_id = 'El ID es requerido';
    if (!formData.name.trim()) errors.name = 'El nombre es requerido';
    if (isDuplicate) errors.university_id = 'Este ID ya existe';

    if (errors.university_id || errors.name) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);

      if (modalMode === 'create') {
        await universityService.createUniversity(formData);
      } else if (selectedUniversity) {
        await universityService.updateUniversity(selectedUniversity._id, {
          name: formData.name,
        });
      }

      setIsModalOpen(false);
      await loadUniversities();
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al guardar universidad');
    } finally {
      setSubmitting(false);
    }
  };

  // Columnas de la tabla
  const columns = [
    { header: 'ID', accessor: 'university_id' as keyof University },
    { header: 'Nombre', accessor: 'name' as keyof University },
    {
      header: 'Acciones',
      accessor: (row: University) => (
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
    <Card title="Gestión de Universidades">
      <div className="mb-4 flex justify-between items-center">
        <p className="text-text-disabled text-sm">
          {universities.length} universidades registradas
        </p>
        <Button onClick={handleCreate}>+ Crear Universidad</Button>
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
        <Table data={universities} columns={columns} emptyMessage="No hay universidades registradas" />
      )}

      {/* Modal Crear/Editar */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Crear Universidad' : 'Editar Universidad'}
        showFooter
        confirmText="Guardar"
        onConfirm={handleSubmit}
        confirmLoading={submitting}
      >
        <div className="space-y-4">
          <Input
            label="Nombre"
            placeholder="ej: UTN - Facultad Regional Córdoba"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
          />

          <div>
            <Input
              label="ID de la Universidad"
              placeholder="ej: utn-frc"
              value={formData.university_id}
              onChange={(e) =>
                setFormData({ ...formData, university_id: cleanId(e.target.value) })
              }
              error={formErrors.university_id}
              disabled={modalMode === 'edit'}
              helperText={modalMode === 'edit' ? 'El ID no se puede modificar' : 'Solo minúsculas, números y guiones'}
            />

            {/* Validación en tiempo real */}
            {modalMode === 'create' && formData.university_id && (
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
                {!checkingDuplicate && !isDuplicate && formData.university_id.length >= 3 && (
                  <div className="mt-2 p-2 bg-accent-1/10 border border-accent-1/50 rounded-lg">
                    <p className="text-xs text-accent-1">✓ ID disponible</p>
                  </div>
                )}
              </>
            )}

            {/* Sugerencia de ID */}
            {modalMode === 'create' && suggestedId && suggestedId !== formData.university_id && (
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

export default UniversitiesManager;
