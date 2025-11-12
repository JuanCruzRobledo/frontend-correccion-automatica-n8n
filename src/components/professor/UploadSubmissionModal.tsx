/**
 * UploadSubmissionModal - Modal para subir entregas de alumnos
 * Permite seleccionar archivo .txt y nombre del alumno
 */
import { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Input } from '../shared/Input';
import submissionService from '../../services/submissionService';

interface UploadSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  rubricId: string;
  commissionId: string;
  onSuccess: () => void;
}

export const UploadSubmissionModal = ({
  isOpen,
  onClose,
  rubricId,
  commissionId,
  onSuccess,
}: UploadSubmissionModalProps) => {
  const [studentName, setStudentName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filePreview, setFilePreview] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError('');

    if (!selectedFile) {
      setFile(null);
      setFilePreview('');
      return;
    }

    // Validar que sea .txt
    if (!selectedFile.name.endsWith('.txt')) {
      setError('Solo se permiten archivos .txt');
      setFile(null);
      setFilePreview('');
      return;
    }

    // Validar tamaño (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('El archivo no puede superar 10MB');
      setFile(null);
      setFilePreview('');
      return;
    }

    setFile(selectedFile);

    // Leer preview del archivo
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      // Mostrar primeras 500 caracteres
      setFilePreview(content.substring(0, 500));
    };
    reader.readAsText(selectedFile);
  };

  const handleSubmit = async () => {
    // Validar
    if (!studentName.trim()) {
      setError('El nombre del alumno es requerido');
      return;
    }

    if (!file) {
      setError('Debes seleccionar un archivo .txt');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      await submissionService.createSubmission({
        rubric_id: rubricId,
        commission_id: commissionId,
        student_name: studentName.trim(),
        file: file,
      });

      // Resetear formulario
      setStudentName('');
      setFile(null);
      setFilePreview('');
      onSuccess();
    } catch (err: unknown) {
      setError(err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Error al subir entrega');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setStudentName('');
      setFile(null);
      setFilePreview('');
      setError('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="📤 Subir Entrega de Alumno"
      showFooter
      confirmText="Subir Entrega"
      onConfirm={handleSubmit}
      confirmLoading={submitting}
    >
      <div className="space-y-4">
        <Input
          label="Nombre del Alumno"
          placeholder="ej: juan-perez"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
          helperText="El nombre se usará para nombrar el archivo en Drive (ej: alumno-juan-perez.txt)"
          tooltip="Nombre del alumno en formato kebab-case (todo minúsculas, palabras separadas por guiones)"
        />

        <div>
          <label className="block text-sm font-medium text-text-tertiary mb-2">
            Archivo de Entrega (.txt)
          </label>
          <input
            type="file"
            accept=".txt"
            onChange={handleFileChange}
            className="w-full px-4 py-2 bg-bg-tertiary border border-border-primary rounded-xl text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent-1 file:text-white hover:file:bg-accent-2 cursor-pointer"
          />
          <p className="mt-1.5 text-sm text-text-tertiary">
            Archivo .txt generado por el consolidador (máximo 10MB)
          </p>
        </div>

        {/* Preview del archivo */}
        {file && filePreview && (
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

        {/* Error */}
        {error && (
          <div className="bg-danger-1/10 border border-danger-1/50 rounded-xl p-3">
            <p className="text-danger-1 text-sm">{error}</p>
          </div>
        )}

        {/* Info */}
        <div className="bg-accent-1/10 border border-accent-1/50 rounded-xl p-3">
          <p className="text-accent-1 text-sm">
            ℹ️ El archivo se subirá a Google Drive en la carpeta de esta rúbrica con el nombre{' '}
            <strong>alumno-{studentName || 'nombre'}.txt</strong>
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default UploadSubmissionModal;
