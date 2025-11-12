/**
 * ProfessorView - Vista principal para profesores
 * Muestra sus comisiones asignadas y permite gestionar entregas de alumnos
 */
import { useState, useEffect } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { UploadSubmissionModal } from './UploadSubmissionModal';
import { SubmissionsList } from './SubmissionsList';
import submissionService from '../../services/submissionService';
import rubricService from '../../services/rubricService';
import type { Rubric } from '../../types';

interface Commission {
  _id: string;
  commission_id: string;
  name: string;
  course_id: string;
  year: number;
}

export const ProfessorView = () => {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRubrics, setLoadingRubrics] = useState(false);
  const [error, setError] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Cargar comisiones al montar
  useEffect(() => {
    loadCommissions();
  }, []);

  // Cargar rúbricas cuando se selecciona una comisión
  useEffect(() => {
    if (selectedCommission) {
      loadRubrics(selectedCommission.commission_id);
    } else {
      setRubrics([]);
      setSelectedRubric(null);
    }
  }, [selectedCommission]);

  const loadCommissions = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await submissionService.getMyCommissions();
      setCommissions(data);

      // Auto-seleccionar la primera comisión si existe
      if (data.length > 0) {
        setSelectedCommission(data[0]);
      }
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al cargar comisiones');
    } finally {
      setLoading(false);
    }
  };

  const loadRubrics = async (commissionId: string) => {
    try {
      setLoadingRubrics(true);
      const data = await rubricService.getRubricsByCommission(commissionId);
      setRubrics(data);

      // Auto-seleccionar la primera rúbrica si existe
      if (data.length > 0) {
        setSelectedRubric(data[0]);
      }
    } catch (err: unknown) {
      console.error('Error al cargar rúbricas:', err);
      setRubrics([]);
    } finally {
      setLoadingRubrics(false);
    }
  };

  const handleUploadSuccess = () => {
    // Recargar la lista de submissions
    setIsUploadModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent-1"></div>
          <p className="text-text-disabled mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card title="Error">
          <div className="bg-danger-1/10 border border-danger-1/50 rounded-xl p-4">
            <p className="text-danger-1">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  if (commissions.length === 0) {
    return (
      <div className="p-6">
        <Card title="👨‍🏫 Mis Comisiones">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-text-secondary text-lg mb-2">No tienes comisiones asignadas</p>
            <p className="text-text-disabled text-sm">
              Contacta al administrador de tu universidad para que te asigne comisiones.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - Lista de comisiones */}
      <aside className="w-80 bg-bg-secondary border-r border-border-primary overflow-y-auto">
        <div className="p-4 border-b border-border-primary">
          <h2 className="text-lg font-semibold text-text-primary">👨‍🏫 Mis Comisiones</h2>
          <p className="text-sm text-text-disabled mt-1">{commissions.length} comisión{commissions.length !== 1 ? 'es' : ''}</p>
        </div>

        <div className="p-2">
          {commissions.map((commission) => (
            <button
              key={commission._id}
              onClick={() => setSelectedCommission(commission)}
              className={`w-full text-left p-3 rounded-xl mb-2 transition-all ${
                selectedCommission?._id === commission._id
                  ? 'bg-accent-1/20 border-2 border-accent-1/50'
                  : 'bg-bg-tertiary border border-border-secondary hover:bg-bg-tertiary/70'
              }`}
            >
              <div className="font-medium text-text-primary">{commission.name}</div>
              <div className="text-xs text-text-disabled mt-1">{commission.course_id} • {commission.year}</div>
            </button>
          ))}
        </div>
      </aside>

      {/* Panel principal */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          {selectedCommission && (
            <>
              {/* Header */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-text-primary mb-2">
                  {selectedCommission.name}
                </h1>
                <p className="text-text-secondary">
                  {selectedCommission.course_id} • Año {selectedCommission.year}
                </p>
              </div>

              {/* Selector de rúbrica */}
              <Card title="📋 Rúbricas de la Comisión">
                {loadingRubrics ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent-1"></div>
                    <p className="text-text-disabled mt-2">Cargando rúbricas...</p>
                  </div>
                ) : rubrics.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-text-disabled">No hay rúbricas disponibles para esta comisión</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <select
                        className="flex-1 px-4 py-2 bg-bg-tertiary border border-border-primary rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-1"
                        value={selectedRubric?._id || ''}
                        onChange={(e) => {
                          const rubric = rubrics.find(r => r._id === e.target.value);
                          setSelectedRubric(rubric || null);
                        }}
                      >
                        <option value="">Selecciona una rúbrica...</option>
                        {rubrics.map((rubric) => (
                          <option key={rubric._id} value={rubric._id}>
                            {rubric.name} ({rubric.rubric_type})
                          </option>
                        ))}
                      </select>

                      {selectedRubric && (
                        <Button
                          className="ml-3"
                          onClick={() => setIsUploadModalOpen(true)}
                        >
                          + Subir Entrega
                        </Button>
                      )}
                    </div>

                    {/* Lista de entregas */}
                    {selectedRubric && (
                      <SubmissionsList
                        rubricId={selectedRubric.rubric_id}
                        onRefresh={() => {}}
                      />
                    )}
                  </>
                )}
              </Card>
            </>
          )}
        </div>
      </main>

      {/* Modal para subir entrega */}
      {selectedRubric && selectedCommission && (
        <UploadSubmissionModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          rubricId={selectedRubric.rubric_id}
          commissionId={selectedCommission.commission_id}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
};

export default ProfessorView;
