/**
 * SubmissionsList - Lista de entregas de alumnos para una rúbrica
 * Muestra tabla con entregas y acciones disponibles
 */
import { useState, useEffect } from 'react';
import { Table } from '../shared/Table';
import { Button } from '../shared/Button';
import submissionService, { type Submission } from '../../services/submissionService';

interface SubmissionsListProps {
  rubricId: string;
  commissionId: string;
  onRefresh: () => void;
}

export const SubmissionsList = ({ rubricId, commissionId, onRefresh }: SubmissionsListProps) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSubmissions();
  }, [rubricId]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await submissionService.getSubmissionsByRubric(rubricId);
      setSubmissions(data);
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al cargar entregas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (submission: Submission) => {
    if (!confirm(`¿Estás seguro de eliminar la entrega de "${submission.student_name}"?`)) {
      return;
    }

    try {
      await submissionService.deleteSubmission(submission._id);
      await loadSubmissions();
      onRefresh();
    } catch (err: unknown) {
      alert(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al eliminar entrega');
    }
  };

  const handleViewInDrive = (submission: Submission) => {
    if (submission.drive_file_url) {
      window.open(submission.drive_file_url, '_blank');
    } else {
      alert('El archivo aún no está disponible en Drive');
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: Submission['status']) => {
    const styles = {
      uploaded: 'bg-accent-1/20 text-accent-1 border-accent-1/30',
      'pending-correction': 'bg-accent-2/20 text-accent-2 border-accent-2/30',
      corrected: 'bg-accent-3/20 text-accent-3 border-accent-3/30',
      failed: 'bg-danger-1/20 text-danger-1 border-danger-1/30',
    };

    const labels = {
      uploaded: '✅ Subido',
      'pending-correction': '⏳ Pendiente',
      corrected: '✔️ Corregido',
      failed: '❌ Error',
    };

    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const columns = [
    {
      header: 'Alumno',
      accessor: (row: Submission) => (
        <span className="font-medium text-text-primary">{row.student_name}</span>
      ),
    },
    {
      header: 'Archivo',
      accessor: (row: Submission) => (
        <span className="text-text-secondary text-sm font-mono">{row.file_name}</span>
      ),
    },
    {
      header: 'Fecha',
      accessor: (row: Submission) => (
        <span className="text-text-secondary text-sm">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      header: 'Estado',
      accessor: (row: Submission) => getStatusBadge(row.status),
    },
    {
      header: 'Nota',
      accessor: (row: Submission) => (
        <span className="font-medium text-text-primary">
          {row.correction?.grade ? `${row.correction.grade}/100` : '-'}
        </span>
      ),
    },
    {
      header: 'Acciones',
      accessor: (row: Submission) => (
        <div className="flex gap-2">
          {row.drive_file_url && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleViewInDrive(row)}
              title="Ver en Google Drive"
            >
              📂 Drive
            </Button>
          )}

          {row.status === 'corrected' && row.correction && (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  // TODO: Implementar modal de detalle de corrección
                  alert('Detalle de corrección: ' + JSON.stringify(row.correction, null, 2));
                }}
                title="Ver detalle de corrección"
              >
                📊 Ver
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={async () => {
                  try {
                    const response = await fetch(
                      `http://localhost:5000/api/submissions/${row.submission_id}/devolution-pdf`,
                      {
                        method: 'GET',
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        },
                      }
                    );

                    if (!response.ok) throw new Error('Error al descargar PDF');

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${row.student_name}_devolucion.pdf`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  } catch (error) {
                    alert('Error: ' + (error instanceof Error ? error.message : 'Error desconocido'));
                  }
                }}
                title="Descargar PDF de devolución"
              >
                📄 PDF
              </Button>
            </>
          )}

          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(row)}
            title="Eliminar entrega"
          >
            🗑️
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent-1"></div>
        <p className="text-text-disabled mt-2">Cargando entregas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-danger-1/10 border border-danger-1/50 rounded-xl p-4">
        <p className="text-danger-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-text-primary">
          📄 Entregas ({submissions.length})
        </h3>
        <Button size="sm" variant="secondary" onClick={loadSubmissions}>
          🔄 Actualizar
        </Button>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-12 bg-bg-tertiary/50 rounded-xl border border-border-secondary/50">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-text-secondary mb-1">No hay entregas aún</p>
          <p className="text-text-disabled text-sm">
            Sube la primera entrega usando el botón "Subir Entrega"
          </p>
        </div>
      ) : (
        <Table
          data={submissions}
          columns={columns}
          emptyMessage="No hay entregas para esta rúbrica"
        />
      )}
    </div>
  );
};

export default SubmissionsList;
