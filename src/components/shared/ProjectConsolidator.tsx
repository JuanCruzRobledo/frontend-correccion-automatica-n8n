/**
 * ProjectConsolidator Component (Unificado)
 * Soporta consolidación individual y batch de múltiples entregas
 */
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Card } from './Card';
import { Button } from './Button';
import type {
  ConsolidationResponse,
  BatchConsolidationResponse,
  Commission,
  Rubric,
} from '../../types/consolidator';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CONVERSION_MODES = [
  { id: '1', name: 'Solo código fuente (Java)', desc: 'Archivos .java únicamente', icon: '☕' },
  { id: '2', name: 'Solo código fuente (JavaScript/TypeScript)', desc: 'Archivos .js, .jsx, .ts, .tsx', icon: '⚡' },
  { id: '3', name: 'Solo código fuente (Python)', desc: 'Archivos .py únicamente', icon: '🐍' },
  { id: '4', name: 'Proyecto web completo', desc: 'HTML, CSS, JS, TS, JSON, etc.', icon: '🌐' },
  { id: '5', name: 'Proyecto completo (Universal)', desc: 'Todos los lenguajes + configuración', icon: '🚀' },
  { id: 'custom', name: 'Personalizado', desc: 'Selecciona extensiones específicas', icon: '⚙️' }
];

type ConsolidationType = 'individual' | 'batch';

export const ProjectConsolidator = () => {
  // Tipo de consolidación
  const [consolidationType, setConsolidationType] = useState<ConsolidationType>('individual');

  // Estados comunes
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<string>('5');
  const [customExtensions, setCustomExtensions] = useState<string>('');
  const [includeTests, setIncludeTests] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Estados para modo individual
  const [individualResult, setIndividualResult] = useState<ConsolidationResponse | null>(null);

  // Estados para modo batch
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [selectedCommission, setSelectedCommission] = useState<string>('');
  const [selectedRubric, setSelectedRubric] = useState<string>('');
  const [batchResult, setBatchResult] = useState<BatchConsolidationResponse | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar comisiones al montar (solo si hay usuario autenticado)
  useEffect(() => {
    if (consolidationType === 'batch') {
      loadCommissions();
    }
  }, [consolidationType]);

  // Cargar rúbricas al seleccionar comisión
  useEffect(() => {
    if (selectedCommission) {
      loadRubrics(selectedCommission);
    } else {
      setRubrics([]);
      setSelectedRubric('');
    }
  }, [selectedCommission]);

  const loadCommissions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Debes estar autenticado para usar el modo batch');
        return;
      }

      const response = await axios.get<{ commissions: Commission[] }>(
        `${API_URL}/api/commissions`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setCommissions(response.data.commissions || []);
    } catch (err: any) {
      console.error('Error al cargar comisiones:', err);
      setError('Error al cargar comisiones: ' + (err.response?.data?.message || err.message));
    }
  };

  const loadRubrics = async (commissionId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get<{ rubrics: Rubric[] }>(
        `${API_URL}/api/rubrics?commission_id=${commissionId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setRubrics(response.data.rubrics || []);
    } catch (err: any) {
      console.error('Error al cargar rúbricas:', err);
      setError('Error al cargar rúbricas: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    // Validar que sea ZIP
    if (!selectedFile.name.toLowerCase().endsWith('.zip')) {
      setError('Solo se permiten archivos ZIP');
      return;
    }

    // Validar tamaño según tipo
    const maxSize = consolidationType === 'batch' ? 500 : 100;
    if (selectedFile.size > maxSize * 1024 * 1024) {
      setError(`El archivo debe ser menor a ${maxSize}MB`);
      return;
    }

    setFile(selectedFile);
    setError('');
    setIndividualResult(null);
    setBatchResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmitIndividual = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Debes seleccionar un archivo ZIP');
      return;
    }

    if (mode === 'custom' && !customExtensions.trim()) {
      setError('Debes ingresar extensiones personalizadas');
      return;
    }

    setLoading(true);
    setError('');
    setIndividualResult(null);

    try {
      const formData = new FormData();
      formData.append('projectZip', file);
      formData.append('mode', mode === 'custom' ? '5' : mode);
      formData.append('includeTests', includeTests.toString());

      if (mode === 'custom' && customExtensions.trim()) {
        formData.append('customExtensions', customExtensions.trim());
      }

      const response = await axios.post<ConsolidationResponse>(
        `${API_URL}/api/consolidate`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 120000 // 2 minutos
        }
      );

      setIndividualResult(response.data);
    } catch (err: any) {
      console.error('Error al consolidar proyecto:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Error al consolidar el proyecto'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitBatch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Debes seleccionar un archivo ZIP con las entregas');
      return;
    }

    if (!selectedCommission || !selectedRubric) {
      setError('Debes seleccionar una comisión y rúbrica');
      return;
    }

    setLoading(true);
    setError('');
    setBatchResult(null);
    setProgress(0);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Debes estar autenticado');
      }

      const formData = new FormData();
      formData.append('entregas', file);
      formData.append('commissionId', selectedCommission);
      formData.append('rubricId', selectedRubric);
      formData.append('mode', mode === 'custom' ? '5' : mode);
      formData.append('includeTests', includeTests.toString());

      if (mode === 'custom' && customExtensions.trim()) {
        formData.append('customExtensions', customExtensions.trim());
      }

      // Simular progreso (el backend no devuelve progreso real aún)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 2000);

      const response = await axios.post<BatchConsolidationResponse>(
        `${API_URL}/api/consolidate/batch`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 600000 // 10 minutos
        }
      );

      clearInterval(progressInterval);
      setProgress(100);

      setBatchResult(response.data);
    } catch (err: any) {
      console.error('Error en batch consolidation:', err);
      setError(
        err.response?.data?.message ||
        err.message ||
        'Error al procesar el batch de entregas'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadIndividual = () => {
    if (!individualResult?.content) return;

    const blob = new Blob([individualResult.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${individualResult.stats.projectName}_consolidated.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadBatch = async () => {
    if (!batchResult?.download_url) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(
        `${API_URL}${batchResult.download_url}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'consolidados.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error al descargar ZIP:', err);
      alert('Error al descargar el archivo');
    }
  };

  const handleReset = () => {
    setFile(null);
    setMode('5');
    setCustomExtensions('');
    setIncludeTests(true);
    setError('');
    setIndividualResult(null);
    setBatchResult(null);
    setSelectedCommission('');
    setSelectedRubric('');
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderResults = () => {
    if (consolidationType === 'individual' && individualResult) {
      return (
        <div className="space-y-6">
          <Card hover hoverColor="emerald">
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-accent-1 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
                Proyecto Consolidado Exitosamente
              </h2>
              <p className="text-text-secondary">{individualResult.message}</p>
            </div>
          </Card>

          <Card title="Estadísticas" stepNumber="📊" hover hoverColor="sky">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-bg-tertiary/50 rounded-xl p-4">
                <p className="text-text-tertiary text-sm mb-1">Proyecto</p>
                <p className="text-text-primary font-medium text-lg">{individualResult.stats.projectName}</p>
              </div>
              <div className="bg-bg-tertiary/50 rounded-xl p-4">
                <p className="text-text-tertiary text-sm mb-1">Archivos procesados</p>
                <p className="text-text-primary font-medium text-lg">{individualResult.stats.totalFiles}</p>
              </div>
              <div className="bg-bg-tertiary/50 rounded-xl p-4 sm:col-span-2">
                <p className="text-text-tertiary text-sm mb-1">Modo</p>
                <p className="text-text-primary font-medium">{individualResult.stats.mode}</p>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={handleDownloadIndividual}
              variant="primary"
              size="lg"
              className="w-full"
            >
              📥 Descargar .txt
            </Button>
            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(individualResult.content);
                  alert('✅ Contenido copiado al portapapeles');
                } catch {
                  alert('❌ Error al copiar');
                }
              }}
              variant="secondary"
              size="lg"
              className="w-full"
            >
              📋 Copiar al portapapeles
            </Button>
          </div>

          <Button
            onClick={handleReset}
            variant="secondary"
            size="md"
            className="w-full"
          >
            ← Consolidar otro proyecto
          </Button>
        </div>
      );
    }

    if (consolidationType === 'batch' && batchResult) {
      return (
        <div className="space-y-6">
          {/* Resumen */}
          <Card hover hoverColor="emerald">
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 sm:h-20 sm:w-20 text-accent-1 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
                Batch Procesado Exitosamente
              </h2>
              <p className="text-text-secondary">{batchResult.message}</p>
            </div>
          </Card>

          {/* Estadísticas generales */}
          <Card title="Resumen" stepNumber="📊" hover hoverColor="sky">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-bg-tertiary/50 rounded-xl p-4 text-center">
                <p className="text-text-tertiary text-xs mb-1">Total</p>
                <p className="text-text-primary font-bold text-2xl">{batchResult.total_processed}</p>
              </div>
              <div className="bg-green-500/10 rounded-xl p-4 text-center border border-green-500/20">
                <p className="text-green-600 text-xs mb-1">Exitosos</p>
                <p className="text-green-700 font-bold text-2xl">{batchResult.successful}</p>
              </div>
              <div className="bg-red-500/10 rounded-xl p-4 text-center border border-red-500/20">
                <p className="text-red-600 text-xs mb-1">Fallidos</p>
                <p className="text-red-700 font-bold text-2xl">{batchResult.failed}</p>
              </div>
              <div className="bg-bg-tertiary/50 rounded-xl p-4 text-center">
                <p className="text-text-tertiary text-xs mb-1">Tasa</p>
                <p className="text-text-primary font-bold text-2xl">
                  {Math.round((batchResult.successful / batchResult.total_processed) * 100)}%
                </p>
              </div>
            </div>
          </Card>

          {/* Análisis de similitud */}
          {batchResult.similarity && (
            <Card title="Análisis de Similitud" stepNumber="🔍" hover hoverColor="purple">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                    <p className="text-red-600 text-sm mb-1">Proyectos Idénticos (100%)</p>
                    <p className="text-red-700 font-bold text-3xl">{batchResult.similarity.identical_groups}</p>
                    <p className="text-red-600/70 text-xs mt-1">grupos detectados</p>
                  </div>
                  <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/20">
                    <p className="text-yellow-600 text-sm mb-1">Copias Parciales (≥50%)</p>
                    <p className="text-yellow-700 font-bold text-3xl">{batchResult.similarity.partial_copies}</p>
                    <p className="text-yellow-600/70 text-xs mt-1">casos detectados</p>
                  </div>
                  <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                    <p className="text-blue-600 text-sm mb-1">Archivos Repetidos</p>
                    <p className="text-blue-700 font-bold text-3xl">{batchResult.similarity.most_copied_files}</p>
                    <p className="text-blue-600/70 text-xs mt-1">archivos en 3+ proyectos</p>
                  </div>
                </div>

                {/* Advertencia si hay copias */}
                {(batchResult.similarity.identical_groups > 0 || batchResult.similarity.partial_copies > 5) && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <p className="text-red-700 font-semibold mb-1">Alerta: Similitud Detectada</p>
                        <p className="text-red-600 text-sm">
                          Se detectaron casos significativos de similitud entre proyectos.
                          Revisa el análisis detallado en el reporte PDF.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Tabla de resultados */}
          <Card title="Detalle por Alumno" stepNumber="📋" hover hoverColor="indigo">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-primary">
                    <th className="text-left py-3 px-4 text-text-secondary font-medium">Alumno</th>
                    <th className="text-center py-3 px-4 text-text-secondary font-medium">Estado</th>
                    <th className="text-right py-3 px-4 text-text-secondary font-medium">Archivos</th>
                  </tr>
                </thead>
                <tbody>
                  {batchResult.results.map((result, idx) => (
                    <tr key={idx} className="border-b border-border-primary/50 hover:bg-bg-hover">
                      <td className="py-3 px-4 text-text-primary">{result.student_name}</td>
                      <td className="text-center py-3 px-4">
                        {result.status === 'success' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-700 border border-green-500/20">
                            ✅ Exitoso
                          </span>
                        )}
                        {result.status === 'warning' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-700 border border-yellow-500/20">
                            ⚠️ Advertencia
                          </span>
                        )}
                        {result.status === 'error' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-700 border border-red-500/20">
                            ❌ Error
                          </span>
                        )}
                      </td>
                      <td className="text-right py-3 px-4 text-text-secondary">
                        {result.stats?.totalFiles || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Botones de acción */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button
              onClick={handleDownloadBatch}
              variant="primary"
              size="lg"
              className="w-full"
            >
              📥 Descargar ZIP Consolidados
            </Button>
            <Button
              onClick={handleReset}
              variant="secondary"
              size="lg"
              className="w-full"
            >
              ← Procesar otro batch
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="relative w-full min-h-screen">
      <div className="container mx-auto px-4 py-8 sm:py-12 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-accent-1 via-accent-2 to-accent-3 mb-4 sm:mb-6">
            <span className="text-3xl sm:text-4xl">📦</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary mb-3 sm:mb-4">
            Consolidador de Proyectos
          </h1>
          <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto mb-2">
            Convierte proyectos en archivos de texto para análisis por IA
          </p>
          <p className="text-sm text-text-tertiary">
            Soporta consolidación individual y batch (múltiples entregas)
          </p>
        </div>

        {!individualResult && !batchResult && (
          <form onSubmit={consolidationType === 'individual' ? handleSubmitIndividual : handleSubmitBatch} className="space-y-6">
            {/* Selector de tipo */}
            <Card title="Tipo de Consolidación" stepNumber="1" hover hoverColor="purple">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  className={`flex items-start p-4 rounded-xl cursor-pointer transition-all border ${
                    consolidationType === 'individual'
                      ? 'bg-accent-1/10 border-accent-1'
                      : 'bg-bg-tertiary/50 border-border-primary hover:bg-bg-hover hover:border-border-hover'
                  }`}
                >
                  <input
                    type="radio"
                    name="consolidationType"
                    value="individual"
                    checked={consolidationType === 'individual'}
                    onChange={() => {
                      setConsolidationType('individual');
                      handleReset();
                    }}
                    className="mt-1 mr-3 accent-accent-1"
                  />
                  <div>
                    <div className="flex items-center gap-2 text-text-primary font-medium mb-1">
                      <span>📄</span>
                      <span>Individual</span>
                    </div>
                    <p className="text-text-tertiary text-sm">Un proyecto a la vez</p>
                  </div>
                </label>

                <label
                  className={`flex items-start p-4 rounded-xl cursor-pointer transition-all border ${
                    consolidationType === 'batch'
                      ? 'bg-accent-1/10 border-accent-1'
                      : 'bg-bg-tertiary/50 border-border-primary hover:bg-bg-hover hover:border-border-hover'
                  }`}
                >
                  <input
                    type="radio"
                    name="consolidationType"
                    value="batch"
                    checked={consolidationType === 'batch'}
                    onChange={() => {
                      setConsolidationType('batch');
                      handleReset();
                    }}
                    className="mt-1 mr-3 accent-accent-1"
                  />
                  <div>
                    <div className="flex items-center gap-2 text-text-primary font-medium mb-1">
                      <span>📦</span>
                      <span>Batch (Múltiples Entregas)</span>
                    </div>
                    <p className="text-text-tertiary text-sm">Procesar varias entregas</p>
                  </div>
                </label>
              </div>
            </Card>

            {/* Selección de comisión y rúbrica (solo batch) */}
            {consolidationType === 'batch' && (
              <Card title="Comisión y Rúbrica" stepNumber="2" hover hoverColor="indigo">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-text-primary font-medium mb-2 text-sm">
                      Comisión
                    </label>
                    <select
                      value={selectedCommission}
                      onChange={(e) => setSelectedCommission(e.target.value)}
                      className="w-full px-4 py-3 bg-bg-tertiary text-text-primary rounded-xl border border-border-primary focus:outline-none focus:border-accent-1 focus:ring-2 focus:ring-accent-1/20 transition-all"
                      required
                    >
                      <option value="">Seleccionar comisión...</option>
                      {commissions.map((comm) => (
                        <option key={comm._id} value={comm.commission_id}>
                          {comm.commission_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-text-primary font-medium mb-2 text-sm">
                      Rúbrica
                    </label>
                    <select
                      value={selectedRubric}
                      onChange={(e) => setSelectedRubric(e.target.value)}
                      className="w-full px-4 py-3 bg-bg-tertiary text-text-primary rounded-xl border border-border-primary focus:outline-none focus:border-accent-1 focus:ring-2 focus:ring-accent-1/20 transition-all"
                      required
                      disabled={!selectedCommission}
                    >
                      <option value="">Seleccionar rúbrica...</option>
                      {rubrics.map((rubric) => (
                        <option key={rubric._id} value={rubric.rubric_id}>
                          {rubric.rubric_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>
            )}

            {/* Zona de Drop */}
            <Card title="Archivo" stepNumber={consolidationType === 'batch' ? '3' : '2'} hover hoverColor="sky">
              <div
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                  dragActive
                    ? 'border-accent-1 bg-accent-1/10'
                    : 'border-border-primary hover:border-border-hover'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />

                {!file ? (
                  <div>
                    <svg
                      className="mx-auto h-12 w-12 text-text-tertiary mb-4"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 48 48"
                    >
                      <path
                        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="text-text-primary font-medium mb-2">
                      {consolidationType === 'individual'
                        ? 'Arrastra tu proyecto ZIP aquí'
                        : 'Arrastra el ZIP con entregas aquí'}
                    </p>
                    <p className="text-text-tertiary text-sm mb-4">o</p>
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Seleccionar archivo
                    </Button>
                    <p className="text-text-tertiary text-xs mt-4">
                      Máximo {consolidationType === 'batch' ? '500' : '100'}MB
                    </p>
                    {consolidationType === 'batch' && (
                      <p className="text-text-tertiary text-xs mt-2">
                        Estructura: entregas/alumno1/proyecto.zip, entregas/alumno2/proyecto.zip, ...
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <svg
                      className="mx-auto h-12 w-12 text-accent-1 mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-text-primary font-medium">{file.name}</p>
                    <p className="text-text-tertiary text-sm mt-2">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleReset}
                      className="mt-4"
                    >
                      Cambiar archivo
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Modo de conversión */}
            <Card title="Modo de conversión" stepNumber={consolidationType === 'batch' ? '4' : '3'} hover hoverColor="emerald">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CONVERSION_MODES.map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-start p-4 rounded-xl cursor-pointer transition-all border ${
                      mode === m.id
                        ? 'bg-accent-1/10 border-accent-1'
                        : 'bg-bg-tertiary/50 border-border-primary hover:bg-bg-hover hover:border-border-hover'
                    }`}
                  >
                    <input
                      type="radio"
                      name="mode"
                      value={m.id}
                      checked={mode === m.id}
                      onChange={(e) => setMode(e.target.value)}
                      className="mt-1 mr-3 accent-accent-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-text-primary font-medium mb-1">
                        <span>{m.icon}</span>
                        <span className="text-sm">{m.name}</span>
                      </div>
                      <div className="text-text-tertiary text-xs">{m.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            {/* Extensiones personalizadas */}
            {mode === 'custom' && (
              <Card hover hoverColor="purple">
                <div>
                  <label className="block text-text-primary font-medium mb-3 text-sm">
                    Extensiones personalizadas
                  </label>
                  <input
                    type="text"
                    value={customExtensions}
                    onChange={(e) => setCustomExtensions(e.target.value)}
                    placeholder=".java,.xml,.properties"
                    className="w-full px-4 py-3 bg-bg-tertiary text-text-primary rounded-xl border border-border-primary focus:outline-none focus:border-accent-1 focus:ring-2 focus:ring-accent-1/20 transition-all"
                  />
                  <p className="text-text-tertiary text-xs mt-2">
                    Separa las extensiones con comas. Ejemplo: .java,.xml,.properties
                  </p>
                </div>
              </Card>
            )}

            {/* Incluir tests */}
            <Card hover hoverColor="emerald">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeTests}
                  onChange={(e) => setIncludeTests(e.target.checked)}
                  className="mr-3 w-5 h-5 accent-accent-1"
                />
                <span className="text-text-primary text-sm">Incluir archivos de pruebas/tests</span>
              </label>
            </Card>

            {/* Progress bar (solo batch) */}
            {loading && consolidationType === 'batch' && (
              <Card hover hoverColor="sky">
                <div>
                  <p className="text-text-primary font-medium mb-3 text-center">Procesando entregas...</p>
                  <div className="w-full bg-bg-tertiary rounded-full h-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-accent-1 to-accent-2 h-full transition-all duration-500 flex items-center justify-center text-xs font-medium text-white"
                      style={{ width: `${progress}%` }}
                    >
                      {progress}%
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Error */}
            {error && (
              <Card hover hoverColor="rose">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-danger-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-danger-1 text-sm">{error}</p>
                </div>
              </Card>
            )}

            {/* Botón de envío */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading || !file || (consolidationType === 'batch' && (!selectedCommission || !selectedRubric))}
              className="w-full"
            >
              {loading
                ? (consolidationType === 'batch' ? 'Procesando batch...' : 'Procesando...')
                : (consolidationType === 'batch' ? 'Procesar Batch' : 'Consolidar Proyecto')}
            </Button>
          </form>
        )}

        {/* Resultados */}
        {renderResults()}
      </div>
    </div>
  );
};
