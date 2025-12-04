/**
 * ProfessorView - Vista principal para profesores y super-admin
 * Muestra comisiones asignadas (profesor) o todas las comisiones (super-admin)
 * Permite gestionar entregas de alumnos
 */
import { useState, useEffect } from 'react';
import { Card } from '../shared/Card';
import { Button } from '../shared/Button';
import { UploadSubmissionModal } from './UploadSubmissionModal';
import { SubmissionsList } from './SubmissionsList';
import { HierarchicalFilters, FilterState } from './HierarchicalFilters';
import submissionService from '../../services/submissionService';
import rubricService from '../../services/rubricService';
import universityService from '../../services/universityService';
import { useAuth } from '../../hooks/useAuth';
import type { Rubric, University } from '../../types';

interface Commission {
  _id: string;
  commission_id: string;
  name: string;
  course_id: string;
  year: number;
  university_id?: {
    _id: string;
    name: string;
    university_id: string;
  } | string;
  faculty_id?: {
    _id: string;
    name: string;
  } | string;
  career_id?: {
    _id: string;
    name: string;
  } | string;
}

export const ProfessorView = () => {
  const { user, loading: authLoading } = useAuth();
  const isSuperAdmin = user?.role === 'super-admin';

  const [allCommissions, setAllCommissions] = useState<Commission[]>([]); // Todas las comisiones sin filtrar
  const [commissions, setCommissions] = useState<Commission[]>([]); // Comisiones filtradas
  const [selectedCommission, setSelectedCommission] = useState<Commission | null>(null);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRubrics, setLoadingRubrics] = useState(false);
  const [error, setError] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Mapa de IDs de universidad a nombres (para super-admin)
  const [universityMap, setUniversityMap] = useState<Record<string, string>>({});

  // Estado de filtros jerárquicos (solo para super-admin)
  const [filters, setFilters] = useState<FilterState>({
    universityId: '',
    facultyId: '',
    careerId: '',
    courseId: '',
  });

  // Cargar universidades para el mapa de nombres (solo super-admin)
  useEffect(() => {
    if (!authLoading && isSuperAdmin) {
      loadUniversities();
    }
  }, [authLoading, isSuperAdmin]);

  // Cargar comisiones cuando el usuario esté cargado
  useEffect(() => {
    if (!authLoading && user) {
      console.log('🔍 [DEBUG] Usuario cargado, ejecutando loadCommissions');
      loadCommissions();
    }
  }, [authLoading, user]);

  // Aplicar filtros cuando cambian (solo para super-admin)
  useEffect(() => {
    if (isSuperAdmin) {
      applyFilters();
    }
  }, [filters, allCommissions, isSuperAdmin]);

  // Cargar rúbricas cuando se selecciona una comisión
  useEffect(() => {
    if (selectedCommission) {
      loadRubrics(selectedCommission.commission_id);
    } else {
      setRubrics([]);
      setSelectedRubric(null);
    }
  }, [selectedCommission]);

  const loadUniversities = async () => {
    try {
      const universities = await universityService.getUniversities();
      const map: Record<string, string> = {};
      universities.forEach((uni) => {
        map[uni.university_id] = uni.name;
      });
      setUniversityMap(map);
    } catch (error) {
      console.error('Error al cargar universidades:', error);
    }
  };

  const loadCommissions = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 [DEBUG] Cargando comisiones...');
      console.log('🔍 [DEBUG] isSuperAdmin:', isSuperAdmin);
      console.log('🔍 [DEBUG] user:', user);

      const data = await submissionService.getMyCommissions();
      console.log('✅ [DEBUG] Comisiones recibidas:', data.length);
      console.log('📋 [DEBUG] Primera comisión:', data[0]);

      // Para super-admin, guardar todas las comisiones y luego aplicar filtros
      if (isSuperAdmin) {
        console.log('✅ [DEBUG] Es super-admin, guardando en allCommissions');
        setAllCommissions(data);
        setCommissions(data); // Inicialmente mostrar todas
      } else {
        console.log('✅ [DEBUG] No es super-admin, guardando solo en commissions');
        // Para profesores, mostrar directamente sus comisiones
        setCommissions(data);
      }

      // Auto-seleccionar la primera comisión si existe
      if (data.length > 0) {
        setSelectedCommission(data[0]);
      }
    } catch (err: unknown) {
      console.error('❌ [DEBUG] Error al cargar comisiones:', err);
      setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al cargar comisiones');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allCommissions];

    // Aplicar filtro de universidad (ahora es siempre string)
    if (filters.universityId) {
      filtered = filtered.filter((c) => c.university_id === filters.universityId);
    }

    // Aplicar filtro de facultad
    if (filters.facultyId) {
      filtered = filtered.filter((c) => c.faculty_id === filters.facultyId);
    }

    // Aplicar filtro de carrera
    if (filters.careerId) {
      filtered = filtered.filter((c) => c.career_id === filters.careerId);
    }

    // Aplicar filtro de materia/curso
    if (filters.courseId) {
      filtered = filtered.filter((c) => c.course_id === filters.courseId);
    }

    setCommissions(filtered);

    // Si la comisión seleccionada ya no está en la lista filtrada, deseleccionar
    if (selectedCommission && !filtered.find((c) => c._id === selectedCommission._id)) {
      setSelectedCommission(filtered.length > 0 ? filtered[0] : null);
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
        <Card title={isSuperAdmin ? "🏛️ Todas las Comisiones" : "👨‍🏫 Mis Comisiones"}>
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <p className="text-text-secondary text-lg mb-2">
              {isSuperAdmin ? 'No hay comisiones en el sistema' : 'No tienes comisiones asignadas'}
            </p>
            <p className="text-text-disabled text-sm">
              {isSuperAdmin
                ? 'Crea comisiones desde el panel de administración.'
                : 'Contacta al administrador de tu universidad para que te asigne comisiones.'
              }
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
        {/* Panel de filtros jerárquicos (solo super-admin) */}
        {isSuperAdmin && (
          <HierarchicalFilters onFilterChange={setFilters} />
        )}

        <div className="p-4 border-b border-border-primary">
          <h2 className="text-lg font-semibold text-text-primary">
            {isSuperAdmin ? '🏛️ Todas las Comisiones' : '👨‍🏫 Mis Comisiones'}
          </h2>
          <p className="text-sm text-text-disabled mt-1">
            {commissions.length} comisión{commissions.length !== 1 ? 'es' : ''}
            {isSuperAdmin && allCommissions.length !== commissions.length && (
              <span className="text-accent-1 font-medium"> ({allCommissions.length} totales)</span>
            )}
          </p>
        </div>

        <div className="p-2">
          {commissions.map((commission) => {
            // Obtener el nombre de la universidad usando el mapa
            const universityId = typeof commission.university_id === 'string'
              ? commission.university_id
              : commission.university_id?.university_id;
            const universityName = universityId ? universityMap[universityId] : null;

            return (
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
                <div className="text-xs text-text-disabled mt-1">
                  {commission.course_id} • {commission.year}
                </div>
                {/* Mostrar universidad si es super-admin */}
                {isSuperAdmin && universityName && (
                  <div className="text-xs text-accent-1/80 mt-1 font-medium">
                    🏛️ {universityName}
                  </div>
                )}
              </button>
            );
          })}
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

                    {/* Acciones de Reportes */}
                    {selectedRubric && (
                      <div className="mt-4 mb-4 flex gap-3 items-center bg-bg-tertiary/50 p-4 rounded-xl border border-border-secondary">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text-primary">Reportes y Devoluciones</p>
                          <p className="text-xs text-text-disabled mt-0.5">
                            Descarga reportes de similitud y genera PDFs de devolución para los estudiantes
                          </p>
                        </div>

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={async () => {
                            if (!selectedCommission || !selectedRubric) return;
                            try {
                              const response = await fetch(
                                `http://localhost:5000/api/commissions/${selectedCommission.commission_id}/rubrics/${selectedRubric.rubric_id}/similarity/pdf`,
                                {
                                  method: 'GET',
                                  headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                  },
                                }
                              );

                              if (!response.ok) throw new Error('Error al descargar reporte');

                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `reporte_similitud_${selectedCommission.commission_id}_${selectedRubric.rubric_id}.pdf`;
                              a.click();
                              window.URL.revokeObjectURL(url);
                            } catch (error) {
                              alert('Error al descargar reporte: ' + (error instanceof Error ? error.message : 'Error desconocido'));
                            }
                          }}
                        >
                          📊 Reporte Similitud
                        </Button>

                        <Button
                          size="sm"
                          variant="primary"
                          onClick={async () => {
                            if (!selectedCommission || !selectedRubric) return;
                            if (!confirm('¿Generar PDFs de devolución para todos los estudiantes corregidos?')) return;

                            try {
                              const response = await fetch(
                                `http://localhost:5000/api/commissions/${selectedCommission.commission_id}/rubrics/${selectedRubric.rubric_id}/generate-devolution-pdfs`,
                                {
                                  method: 'POST',
                                  headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                  },
                                }
                              );

                              if (!response.ok) throw new Error('Error al generar PDFs');

                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `devoluciones_${selectedCommission.commission_id}_${selectedRubric.rubric_id}.zip`;
                              a.click();
                              window.URL.revokeObjectURL(url);
                            } catch (error) {
                              alert('Error al generar PDFs: ' + (error instanceof Error ? error.message : 'Error desconocido'));
                            }
                          }}
                        >
                          📄 PDFs Devolución
                        </Button>
                      </div>
                    )}

                    {/* Lista de entregas */}
                    {selectedRubric && (
                      <SubmissionsList
                        rubricId={selectedRubric.rubric_id}
                        commissionId={selectedCommission.commission_id}
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
