/**
 * UploadSubmissionModal - Modal para subir entregas de alumnos
 * Soporta 3 modos: TXT directo, ZIP individual (auto-consolidar), ZIP batch (múltiples entregas)
 */
import { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Input } from '../shared/Input';
import submissionService, { type BatchSubmissionsResponse } from '../../services/submissionService';

interface UploadSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  rubricId: string;
  commissionId: string;
  onSuccess: () => void;
}

type UploadMode = 'txt' | 'zip-individual' | 'zip-batch';

export const UploadSubmissionModal = ({
  isOpen,
  onClose,
  rubricId,
  commissionId,
  onSuccess,
}: UploadSubmissionModalProps) => {
  // Estado común
  const [uploadMode, setUploadMode] = useState<UploadMode>('txt');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Estado para modo TXT y ZIP Individual
  const [studentName, setStudentName] = useState('');
  const [filePreview, setFilePreview] = useState('');

  // Estado para configuración de consolidación (ZIP Individual y Batch)
  const [consolidationMode, setConsolidationMode] = useState('1');
  const [customExtensions, setCustomExtensions] = useState('');
  const [includeTests, setIncludeTests] = useState(false);
  const [forceOverwrite, setForceOverwrite] = useState(false);

  // Estado para modo Batch
  const [runSimilarityAnalysis, setRunSimilarityAnalysis] = useState(false);
  const [batchResults, setBatchResults] = useState<BatchSubmissionsResponse | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError('');
    setBatchResults(null);

    if (!selectedFile) {
      setFile(null);
      setFilePreview('');
      return;
    }

    // Validar extensión según modo
    if (uploadMode === 'txt' && !selectedFile.name.endsWith('.txt')) {
      setError('Solo se permiten archivos .txt en este modo');
      setFile(null);
      setFilePreview('');
      return;
    }

    if ((uploadMode === 'zip-individual' || uploadMode === 'zip-batch') && !selectedFile.name.endsWith('.zip')) {
      setError('Solo se permiten archivos .zip en este modo');
      setFile(null);
      setFilePreview('');
      return;
    }

    // Validar tamaño
    const maxSize = uploadMode === 'zip-batch' ? 500 * 1024 * 1024 : 50 * 1024 * 1024; // 500MB para batch, 50MB para otros
    if (selectedFile.size > maxSize) {
      setError(`El archivo no puede superar ${maxSize / (1024 * 1024)}MB`);
      setFile(null);
      setFilePreview('');
      return;
    }

    setFile(selectedFile);

    // Leer preview solo para TXT
    if (uploadMode === 'txt') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setFilePreview(content.substring(0, 500));
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setProcessing(true);
      setError('');

      if (!file) {
        setError('Debes seleccionar un archivo');
        return;
      }

      if (uploadMode === 'txt' || uploadMode === 'zip-individual') {
        // Validar nombre de alumno
        if (!studentName.trim()) {
          setError('El nombre del alumno es requerido');
          return;
        }

        // Crear submission individual
        await submissionService.createSubmission({
          rubric_id: rubricId,
          commission_id: commissionId,
          student_name: studentName.trim(),
          file: file,
          mode: uploadMode === 'zip-individual' ? consolidationMode : undefined,
          customExtensions: uploadMode === 'zip-individual' && customExtensions ? customExtensions : undefined,
          includeTests: uploadMode === 'zip-individual' ? includeTests : undefined,
          forceOverwrite: forceOverwrite,
        });

        // Resetear y cerrar
        resetForm();
        onSuccess();
      } else if (uploadMode === 'zip-batch') {
        // Crear submissions batch
        const result = await submissionService.createBatchSubmissions({
          rubric_id: rubricId,
          commission_id: commissionId,
          file: file,
          mode: consolidationMode,
          customExtensions: customExtensions || undefined,
          includeTests: includeTests,
          forceOverwrite: forceOverwrite,
          runSimilarityAnalysis: runSimilarityAnalysis,
        });

        setBatchResults(result);
        setFile(null);

        // Si todos fueron exitosos, cerrar automáticamente
        if (result.errorCount === 0) {
          setTimeout(() => {
            resetForm();
            onSuccess();
          }, 2000);
        }
      }
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al subir entrega');
    } finally {
      setSubmitting(false);
      setProcessing(false);
    }
  };

  const resetForm = () => {
    setStudentName('');
    setFile(null);
    setFilePreview('');
    setError('');
    setBatchResults(null);
    setConsolidationMode('1');
    setCustomExtensions('');
    setIncludeTests(false);
    setForceOverwrite(false);
    setRunSimilarityAnalysis(false);
  };

  const handleClose = () => {
    if (!submitting) {
      resetForm();
      onClose();
    }
  };

  const getAcceptedFiles = () => {
    if (uploadMode === 'txt') return '.txt';
    return '.zip';
  };

  const getMaxSizeText = () => {
    if (uploadMode === 'txt') return '10MB';
    if (uploadMode === 'zip-individual') return '50MB';
    return '500MB';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="📤 Subir Entrega de Alumno"
      showFooter={!batchResults || batchResults.errorCount === 0}
      confirmText={submitting ? 'Procesando...' : uploadMode === 'zip-batch' ? 'Procesar Batch' : 'Subir Entrega'}
      onConfirm={handleSubmit}
      confirmLoading={submitting}
    >
      <div className="space-y-4">
        {/* Selector de Modo */}
        <div>
          <label className="block text-sm font-medium text-text-tertiary mb-2">
            Modo de Subida
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setUploadMode('txt');
                setFile(null);
                setFilePreview('');
                setError('');
                setBatchResults(null);
              }}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                uploadMode === 'txt'
                  ? 'bg-accent-1 text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/70'
              }`}
            >
              📄 TXT Directo
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadMode('zip-individual');
                setFile(null);
                setFilePreview('');
                setError('');
                setBatchResults(null);
              }}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                uploadMode === 'zip-individual'
                  ? 'bg-accent-1 text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/70'
              }`}
            >
              📦 ZIP Individual
            </button>
            <button
              type="button"
              onClick={() => {
                setUploadMode('zip-batch');
                setFile(null);
                setFilePreview('');
                setError('');
                setBatchResults(null);
              }}
              className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                uploadMode === 'zip-batch'
                  ? 'bg-accent-1 text-white'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-tertiary/70'
              }`}
            >
              📦 Batch (Múltiples)
            </button>
          </div>
          <p className="mt-1.5 text-xs text-text-disabled">
            {uploadMode === 'txt' && 'Sube un archivo .txt ya consolidado'}
            {uploadMode === 'zip-individual' && 'Sube un ZIP de código que se consolidará automáticamente'}
            {uploadMode === 'zip-batch' && 'Sube un ZIP con estructura entregas/{alumno}/proyecto.zip'}
          </p>
        </div>

        {/* Campo Nombre de Alumno (solo para TXT y ZIP Individual) */}
        {(uploadMode === 'txt' || uploadMode === 'zip-individual') && (
          <Input
            label="Nombre del Alumno"
            placeholder="ej: juan-perez"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            helperText="El nombre se usará para nombrar el archivo en Drive (ej: alumno-juan-perez.txt)"
            tooltip="Nombre del alumno en formato kebab-case (todo minúsculas, palabras separadas por guiones)"
          />
        )}

        {/* Configuración de Consolidación (solo para ZIP Individual y Batch) */}
        {(uploadMode === 'zip-individual' || uploadMode === 'zip-batch') && (
          <div className="bg-bg-tertiary/50 border border-border-secondary rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-text-primary">⚙️ Configuración de Consolidación</p>

            <div>
              <label className="block text-sm font-medium text-text-tertiary mb-1">
                Modo de Consolidación
              </label>
              <select
                value={consolidationMode}
                onChange={(e) => setConsolidationMode(e.target.value)}
                className="w-full px-3 py-2 bg-bg-primary border border-border-primary rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent-1"
              >
                <option value="1">1 - Solo Java (.java)</option>
                <option value="2">2 - JavaScript/TypeScript (.js, .ts, .jsx, .tsx)</option>
                <option value="3">3 - Python (.py)</option>
                <option value="4">4 - Proyecto Web (HTML, CSS, JS)</option>
                <option value="5">5 - Proyecto Completo (todos los lenguajes)</option>
              </select>
            </div>

            <Input
              label="Extensiones Personalizadas (opcional)"
              placeholder="ej: .java, .xml, .properties"
              value={customExtensions}
              onChange={(e) => setCustomExtensions(e.target.value)}
              helperText="Separadas por comas. Deja vacío para usar el modo seleccionado."
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeTests"
                checked={includeTests}
                onChange={(e) => setIncludeTests(e.target.checked)}
                className="w-4 h-4 rounded border-border-primary bg-bg-primary text-accent-1 focus:ring-2 focus:ring-accent-1"
              />
              <label htmlFor="includeTests" className="text-sm text-text-secondary cursor-pointer">
                Incluir archivos de test
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="forceOverwrite"
                checked={forceOverwrite}
                onChange={(e) => setForceOverwrite(e.target.checked)}
                className="w-4 h-4 rounded border-border-primary bg-bg-primary text-accent-1 focus:ring-2 focus:ring-accent-1"
              />
              <label htmlFor="forceOverwrite" className="text-sm text-text-secondary cursor-pointer">
                Forzar sobrescritura (si ya existe una entrega)
              </label>
            </div>

            {uploadMode === 'zip-batch' && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="runSimilarityAnalysis"
                  checked={runSimilarityAnalysis}
                  onChange={(e) => setRunSimilarityAnalysis(e.target.checked)}
                  className="w-4 h-4 rounded border-border-primary bg-bg-primary text-accent-1 focus:ring-2 focus:ring-accent-1"
                />
                <label htmlFor="runSimilarityAnalysis" className="text-sm text-text-secondary cursor-pointer">
                  Ejecutar análisis de similitud
                </label>
              </div>
            )}
          </div>
        )}

        {/* Upload de Archivo */}
        <div>
          <label className="block text-sm font-medium text-text-tertiary mb-2">
            Archivo {uploadMode === 'txt' ? '(.txt)' : '(.zip)'}
          </label>
          <input
            type="file"
            accept={getAcceptedFiles()}
            onChange={handleFileChange}
            disabled={processing}
            className="w-full px-4 py-2 bg-bg-tertiary border border-border-primary rounded-xl text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent-1 file:text-white hover:file:bg-accent-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-1.5 text-sm text-text-tertiary">
            {uploadMode === 'txt' && `Archivo .txt generado por el consolidador (máximo ${getMaxSizeText()})`}
            {uploadMode === 'zip-individual' && `Archivo .zip con tu código (máximo ${getMaxSizeText()})`}
            {uploadMode === 'zip-batch' && `Archivo .zip con estructura entregas/{alumno}/proyecto.zip (máximo ${getMaxSizeText()})`}
          </p>
        </div>

        {/* Preview del archivo TXT */}
        {uploadMode === 'txt' && file && filePreview && (
          <div className="bg-bg-tertiary border border-border-secondary rounded-xl p-3">
            <p className="text-xs font-medium text-text-tertiary mb-2">
              Vista previa: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
            <div className="bg-bg-primary rounded-lg p-3 max-h-40 overflow-y-auto">
              <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono">
                {filePreview}
                {filePreview.length >= 500 && '\n\n... (contenido truncado)'}
              </pre>
            </div>
          </div>
        )}

        {/* Info del archivo ZIP */}
        {(uploadMode === 'zip-individual' || uploadMode === 'zip-batch') && file && (
          <div className="bg-bg-tertiary border border-border-secondary rounded-xl p-3">
            <p className="text-xs font-medium text-text-tertiary mb-2">
              📦 Archivo seleccionado: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
            </p>
            <p className="text-xs text-text-disabled">
              {uploadMode === 'zip-individual' && 'El código se consolidará automáticamente al subirlo'}
              {uploadMode === 'zip-batch' && 'Cada proyecto se consolidará y subirá automáticamente'}
            </p>
          </div>
        )}

        {/* Progress bar para batch */}
        {processing && uploadMode === 'zip-batch' && (
          <div className="bg-accent-1/10 border border-accent-1/50 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent-1"></div>
              <p className="text-sm font-medium text-accent-1">Procesando batch de entregas...</p>
            </div>
            <div className="w-full bg-bg-tertiary rounded-full h-2">
              <div className="bg-accent-1 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
            </div>
          </div>
        )}

        {/* Resultados del batch */}
        {batchResults && uploadMode === 'zip-batch' && (
          <div className="space-y-3">
            <div className="bg-bg-tertiary/50 border border-border-secondary rounded-xl p-4">
              <p className="text-sm font-medium text-text-primary mb-2">📊 Resultados del Batch</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-2xl font-bold text-green-500">{batchResults.successCount}</p>
                  <p className="text-xs text-text-secondary">Exitosos</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-2xl font-bold text-red-500">{batchResults.errorCount}</p>
                  <p className="text-xs text-text-secondary">Errores</p>
                </div>
              </div>
            </div>

            {/* Lista de errores */}
            {batchResults.errors.length > 0 && (
              <div className="bg-danger-1/10 border border-danger-1/50 rounded-xl p-3 max-h-60 overflow-y-auto">
                <p className="text-sm font-medium text-danger-1 mb-2">❌ Entregas con errores:</p>
                <ul className="space-y-2">
                  {batchResults.errors.map((err, idx) => (
                    <li key={idx} className="text-xs text-text-secondary">
                      <strong>{err.studentName}:</strong> {err.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Análisis de similitud */}
            {batchResults.similarity && (
              <div className="bg-bg-tertiary/50 border border-border-secondary rounded-xl p-4">
                <p className="text-sm font-medium text-text-primary mb-2">🔍 Análisis de Similitud</p>
                <div className="space-y-2 text-xs">
                  <p className="text-text-secondary">
                    <strong>Proyectos idénticos:</strong> {batchResults.similarity.identicalGroups} grupos
                  </p>
                  <p className="text-text-secondary">
                    <strong>Copias parciales:</strong> {batchResults.similarity.partialCopies}
                  </p>
                  <p className="text-text-secondary">
                    <strong>Archivos repetidos:</strong> {batchResults.similarity.mostCopiedFiles}
                  </p>
                  <p className="text-xs text-text-disabled mt-2">
                    Ver detalles completos en el reporte de similitud de la comisión
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-danger-1/10 border border-danger-1/50 rounded-xl p-3">
            <p className="text-danger-1 text-sm">{error}</p>
          </div>
        )}

        {/* Info según modo */}
        {!batchResults && (
          <div className="bg-accent-1/10 border border-accent-1/50 rounded-xl p-3">
            <p className="text-accent-1 text-sm">
              {uploadMode === 'txt' && (
                <>
                  ℹ️ El archivo se subirá a Google Drive con el nombre{' '}
                  <strong>alumno-{studentName || 'nombre'}.txt</strong>
                </>
              )}
              {uploadMode === 'zip-individual' && (
                <>
                  ℹ️ El ZIP se consolidará automáticamente y se subirá como{' '}
                  <strong>alumno-{studentName || 'nombre'}.txt</strong>
                </>
              )}
              {uploadMode === 'zip-batch' && (
                <>
                  ℹ️ Cada proyecto se consolidará y subirá automáticamente a Drive. Se crearán múltiples submissions.
                </>
              )}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default UploadSubmissionModal;
