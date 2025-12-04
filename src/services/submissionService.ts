/**
 * Servicio de Submissions (Entregas de Alumnos)
 * Maneja todas las llamadas a la API de submissions
 */
import api from './api';
import type { ApiResponse } from '../types';

export interface Submission {
  _id: string;
  submission_id: string;
  commission_id: string;
  rubric_id: string;
  university_id: string;
  student_name: string;
  file_name: string;
  drive_file_id?: string;
  drive_file_url?: string;
  uploaded_by: string;
  status: 'uploaded' | 'pending-correction' | 'corrected' | 'failed';
  correction?: {
    corrected_at?: Date;
    grade?: number;
    summary?: string;
    details?: any;
  };
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSubmissionForm {
  rubric_id: string;
  commission_id: string;
  student_name: string;
  file: File;
  mode?: string;
  customExtensions?: string;
  includeTests?: boolean;
  forceOverwrite?: boolean;
}

export interface CreateBatchSubmissionsForm {
  rubric_id: string;
  commission_id: string;
  file: File;
  mode: string;
  customExtensions?: string;
  includeTests?: boolean;
  forceOverwrite?: boolean;
  runSimilarityAnalysis?: boolean;
}

export interface BatchSubmissionResult {
  studentName: string;
  submissionId?: string;
  stats?: any;
  error?: string;
}

export interface BatchSubmissionsResponse {
  successCount: number;
  errorCount: number;
  submissions: BatchSubmissionResult[];
  errors: BatchSubmissionResult[];
  similarity?: {
    identicalGroups: number;
    partialCopies: number;
    mostCopiedFiles: number;
    details: any;
  };
}

/**
 * Obtener todas las submissions de una rúbrica
 */
export const getSubmissionsByRubric = async (rubricId: string): Promise<Submission[]> => {
  const response = await api.get<ApiResponse<Submission[]>>(`/api/submissions?rubric_id=${rubricId}`);
  return response.data.data || [];
};

/**
 * Obtener una submission por ID
 */
export const getSubmissionById = async (id: string): Promise<Submission> => {
  const response = await api.get<ApiResponse<Submission>>(`/api/submissions/${id}`);
  if (!response.data.data) {
    throw new Error('Entrega no encontrada');
  }
  return response.data.data;
};

/**
 * Crear nueva submission (subir entrega)
 * Soporta archivos .txt y .zip (con auto-consolidación)
 */
export const createSubmission = async (data: CreateSubmissionForm): Promise<Submission> => {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('rubric_id', data.rubric_id);
  formData.append('commission_id', data.commission_id);
  formData.append('student_name', data.student_name);

  // Campos opcionales para auto-consolidación (si es ZIP)
  if (data.mode) {
    formData.append('mode', data.mode);
  }
  if (data.customExtensions) {
    formData.append('customExtensions', data.customExtensions);
  }
  if (data.includeTests !== undefined) {
    formData.append('includeTests', String(data.includeTests));
  }
  if (data.forceOverwrite !== undefined) {
    formData.append('forceOverwrite', String(data.forceOverwrite));
  }

  const response = await api.post<ApiResponse<Submission>>('/api/submissions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.data.data) {
    throw new Error('Error al subir entrega');
  }
  return response.data.data;
};

/**
 * Crear múltiples submissions en batch (ZIP con entregas/)
 * Auto-consolida cada proyecto y crea submissions
 */
export const createBatchSubmissions = async (
  data: CreateBatchSubmissionsForm
): Promise<BatchSubmissionsResponse> => {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('rubric_id', data.rubric_id);
  formData.append('commission_id', data.commission_id);
  formData.append('mode', data.mode);

  if (data.customExtensions) {
    formData.append('customExtensions', data.customExtensions);
  }
  if (data.includeTests !== undefined) {
    formData.append('includeTests', String(data.includeTests));
  }
  if (data.forceOverwrite !== undefined) {
    formData.append('forceOverwrite', String(data.forceOverwrite));
  }
  if (data.runSimilarityAnalysis !== undefined) {
    formData.append('runSimilarityAnalysis', String(data.runSimilarityAnalysis));
  }

  const response = await api.post<ApiResponse<BatchSubmissionsResponse>>(
    '/api/submissions/batch',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 1800000, // 30 minutos para batch (puede tener muchas entregas)
    }
  );

  if (!response.data.data) {
    throw new Error('Error al procesar batch de entregas');
  }
  return response.data.data;
};

/**
 * Eliminar submission (baja lógica)
 */
export const deleteSubmission = async (id: string): Promise<void> => {
  await api.delete(`/api/submissions/${id}`);
};

/**
 * Obtener mis comisiones (para profesores)
 */
export const getMyCommissions = async (): Promise<any[]> => {
  const response = await api.get<ApiResponse<any[]>>('/api/commissions/my-commissions');
  return response.data.data || [];
};

const submissionService = {
  getSubmissionsByRubric,
  getSubmissionById,
  createSubmission,
  createBatchSubmissions,
  deleteSubmission,
  getMyCommissions,
};

export default submissionService;
