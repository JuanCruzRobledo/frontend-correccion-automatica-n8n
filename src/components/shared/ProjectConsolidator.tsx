/**
 * ProjectConsolidator Component
 * Componente público para consolidar proyectos en un único archivo de texto
 * Accesible para todos los usuarios
 */
import { useState, useRef } from 'react';
import axios from 'axios';
import { Card } from './Card';
import { Button } from './Button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ConsolidationStats {
  totalFiles: number;
  projectName: string;
  mode: string;
  extensions: string[];
}

interface ConsolidationResponse {
  success: boolean;
  content: string;
  stats: ConsolidationStats;
  message: string;
}

const CONVERSION_MODES = [
  { id: '1', name: 'Solo código fuente (Java)', desc: 'Archivos .java únicamente', icon: '☕' },
  { id: '2', name: 'Solo código fuente (JavaScript/TypeScript)', desc: 'Archivos .js, .jsx, .ts, .tsx', icon: '⚡' },
  { id: '3', name: 'Solo código fuente (Python)', desc: 'Archivos .py únicamente', icon: '🐍' },
  { id: '4', name: 'Proyecto web completo', desc: 'HTML, CSS, JS, TS, JSON, etc.', icon: '🌐' },
  { id: '5', name: 'Proyecto completo (Universal)', desc: 'Todos los lenguajes + configuración', icon: '🚀' },
  { id: 'custom', name: 'Personalizado', desc: 'Selecciona extensiones específicas', icon: '⚙️' }
];

export const ProjectConsolidator = () => {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<string>('5');
  const [customExtensions, setCustomExtensions] = useState<string>('');
  const [includeTests, setIncludeTests] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<ConsolidationResponse | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manejar drag & drop
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

    // Validar tamaño (100MB máximo)
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('El archivo debe ser menor a 100MB');
      return;
    }

    setFile(selectedFile);
    setError('');
    setResult(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Debes seleccionar un archivo ZIP');
      return;
    }

    // Validar extensiones personalizadas si se seleccionó modo custom
    if (mode === 'custom' && !customExtensions.trim()) {
      setError('Debes ingresar extensiones personalizadas');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

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

      setResult(response.data);
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

  const handleDownload = () => {
    if (!result?.content) return;

    const blob = new Blob([result.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${result.stats.projectName}_consolidated.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    if (!result?.content) return;

    try {
      await navigator.clipboard.writeText(result.content);
      alert('✅ Contenido copiado al portapapeles');
    } catch (err) {
      console.error('Error al copiar:', err);
      alert('❌ Error al copiar al portapapeles');
    }
  };

  const handleReset = () => {
    setFile(null);
    setMode('5');
    setCustomExtensions('');
    setIncludeTests(true);
    setError('');
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
            Convierte tu proyecto en un único archivo de texto para análisis por IA
          </p>
          <p className="text-sm text-text-tertiary">
            Soporta Java, JavaScript, Python, C++, y muchos más lenguajes
          </p>
        </div>

        {!result ? (
          // Formulario de carga
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Zona de Drop */}
            <Card hover hoverColor="sky">
              <div
                className={`border-2 border-dashed rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center transition-all ${
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
                      className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-text-tertiary mb-4"
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
                    <p className="text-text-primary text-base sm:text-lg font-medium mb-2">
                      Arrastra tu archivo ZIP aquí
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
                      Máximo 100MB
                    </p>
                  </div>
                ) : (
                  <div>
                    <svg
                      className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-accent-1 mb-4"
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
                    <p className="text-text-primary font-medium text-base sm:text-lg">{file.name}</p>
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
            <Card title="Modo de conversión" stepNumber="1" hover hoverColor="indigo">
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
                        <span className="text-sm sm:text-base">{m.name}</span>
                      </div>
                      <div className="text-text-tertiary text-xs sm:text-sm">{m.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </Card>

            {/* Extensiones personalizadas */}
            {mode === 'custom' && (
              <Card hover hoverColor="purple">
                <div>
                  <label className="block text-text-primary font-medium mb-3 text-sm sm:text-base">
                    Extensiones personalizadas
                  </label>
                  <input
                    type="text"
                    value={customExtensions}
                    onChange={(e) => setCustomExtensions(e.target.value)}
                    placeholder=".java,.xml,.properties"
                    className="w-full px-4 py-3 bg-bg-tertiary text-text-primary rounded-xl border border-border-primary focus:outline-none focus:border-accent-1 focus:ring-2 focus:ring-accent-1/20 transition-all"
                  />
                  <p className="text-text-tertiary text-xs sm:text-sm mt-2">
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
                <span className="text-text-primary text-sm sm:text-base">Incluir archivos de pruebas/tests</span>
              </label>
            </Card>

            {/* Error */}
            {error && (
              <Card hover hoverColor="rose">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-danger-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-danger-1 text-sm sm:text-base">{error}</p>
                </div>
              </Card>
            )}

            {/* Botón de envío */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading || !file}
              className="w-full"
            >
              {loading ? 'Procesando...' : 'Consolidar Proyecto'}
            </Button>
          </form>
        ) : (
          // Resultado
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
                <p className="text-text-secondary">{result.message}</p>
              </div>
            </Card>

            {/* Estadísticas */}
            <Card title="Estadísticas" stepNumber="📊" hover hoverColor="sky">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-bg-tertiary/50 rounded-xl p-4">
                  <p className="text-text-tertiary text-sm mb-1">Proyecto</p>
                  <p className="text-text-primary font-medium text-lg">{result.stats.projectName}</p>
                </div>
                <div className="bg-bg-tertiary/50 rounded-xl p-4">
                  <p className="text-text-tertiary text-sm mb-1">Archivos procesados</p>
                  <p className="text-text-primary font-medium text-lg">{result.stats.totalFiles}</p>
                </div>
                <div className="bg-bg-tertiary/50 rounded-xl p-4 sm:col-span-2">
                  <p className="text-text-tertiary text-sm mb-1">Modo</p>
                  <p className="text-text-primary font-medium">{result.stats.mode}</p>
                </div>
              </div>
            </Card>

            {/* Botones de acción */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                onClick={handleDownload}
                variant="primary"
                size="lg"
                className="w-full"
              >
                📥 Descargar .txt
              </Button>
              <Button
                onClick={handleCopyToClipboard}
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
        )}
      </div>
    </div>
  );
};
