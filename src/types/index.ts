/**
 * Tipos TypeScript para el frontend
 */

// ========== ENTIDADES ==========

export interface University {
  _id: string;
  university_id: string;
  name: string;
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Faculty {
  _id: string;
  faculty_id: string;
  name: string;
  university_id: string;
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Career {
  _id: string;
  career_id: string;
  name: string;
  faculty_id: string;
  university_id: string;
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Course {
  _id: string;
  course_id: string;
  name: string;
  year: number;
  career_id: string;
  faculty_id: string;
  university_id: string;
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Commission {
  _id: string;
  commission_id: string;
  name: string;
  course_id: string;
  career_id: string;
  faculty_id: string;
  university_id: string;
  professor_name?: string;
  professor_email?: string;
  professors?: User[]; // Array de profesores asignados
  year: number;
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type RubricType = 'tp' | 'parcial-1' | 'parcial-2' | 'recuperatorio-1' | 'recuperatorio-2' | 'final' | 'global';

export const RUBRIC_TYPES = {
  TP: 'tp' as const,
  PARCIAL_1: 'parcial-1' as const,
  PARCIAL_2: 'parcial-2' as const,
  RECUPERATORIO_1: 'recuperatorio-1' as const,
  RECUPERATORIO_2: 'recuperatorio-2' as const,
  FINAL: 'final' as const,
  GLOBAL: 'global' as const,
};

export interface Rubric {
  _id: string;
  rubric_id: string;
  name: string;
  commission_id: string;
  course_id: string;
  career_id: string;
  faculty_id: string;
  university_id: string;
  rubric_type: RubricType;
  rubric_number: number;
  year: number;
  rubric_json: RubricJSON; // El esquema completo de la rúbrica
  source: 'pdf' | 'json' | 'manual';
  original_file_url?: string;
  drive_folder_id?: string; // ID de la carpeta en Google Drive
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Esquema de la rúbrica (el JSON interno)
export interface RubricJSON {
  rubric_id: string;
  title: string;
  version?: string;
  assessment_type?: string;
  course?: string;
  language_or_stack?: string[];
  submission?: {
    single_file?: boolean;
    accepted_extensions?: string[];
    delivery_channel?: string;
    constraints?: string[];
  };
  grading?: {
    policy?: string;
    rounding?: string;
    total_points?: number;
  };
  criteria?: Criterion[];
  penalties?: Penalty[];
  mandatory_fail_conditions?: string[];
  tasks?: Task[];
  [key: string]: unknown; // Para propiedades adicionales
}

export interface Criterion {
  id: string;
  name: string;
  weight: number;
  description: string;
  subcriteria?: SubCriterion[];
}

export interface SubCriterion {
  name: string;
  weight: number;
  evidence?: string[];
}

export interface Penalty {
  description: string;
  penalty_percent: number;
}

export interface Task {
  label: string;
  prompt_excerpt: string;
  points: number;
  links_to_criteria: string[];
}

export interface User {
  _id: string;
  username: string;
  name: string;
  role: 'super-admin' | 'university-admin' | 'professor' | 'user' | 'admin';
  university_id?: string;
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  _id: string;
  username: string;
  name: string;
  role: 'super-admin' | 'university-admin' | 'professor' | 'user' | 'admin';
  university_id?: string;
  hasGeminiApiKey: boolean;
  gemini_api_key?: string | null; // API key desencriptada
  gemini_api_key_last_4?: string;
  gemini_api_key_configured_at?: string;
  gemini_api_key_last_validated?: string;
  gemini_api_key_is_valid?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ========== API RESPONSES ==========

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  errors?: string[];
  error?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  name: string;
  password: string;
  role?: 'admin' | 'user';
}

// ========== ERRORES ==========

export interface ApiError {
  success: false;
  message: string;
  error?: string;
  errors?: string[];
}

// ========== FORMULARIOS ==========

export interface CreateUniversityForm {
  university_id: string;
  name: string;
}

export interface UpdateUniversityForm {
  name: string;
}

export interface CreateFacultyForm {
  faculty_id: string;
  name: string;
  university_id: string;
}

export interface UpdateFacultyForm {
  name?: string;
  university_id?: string;
}

export interface CreateCareerForm {
  career_id: string;
  name: string;
  faculty_id: string;
  university_id: string;
}

export interface UpdateCareerForm {
  name?: string;
  faculty_id?: string;
  university_id?: string;
}

export interface CreateCourseForm {
  course_id: string;
  name: string;
  year: number;
  career_id: string;
  faculty_id: string;
  university_id: string;
}

export interface UpdateCourseForm {
  name?: string;
  year?: number;
  career_id?: string;
  faculty_id?: string;
  university_id?: string;
}

export interface CreateCommissionForm {
  commission_id: string;
  name: string;
  course_id: string;
  career_id: string;
  faculty_id: string;
  university_id: string;
  professor_name?: string;
  professor_email?: string;
  year: number;
}

export interface UpdateCommissionForm {
  name?: string;
  course_id?: string;
  career_id?: string;
  faculty_id?: string;
  university_id?: string;
  professor_name?: string;
  professor_email?: string;
  year?: number;
}

export interface CreateRubricForm {
  name: string;
  commission_id: string;
  course_id: string;
  career_id: string;
  faculty_id: string;
  university_id: string;
  rubric_type: RubricType;
  rubric_number: number;
  year: number;
  rubric_json: RubricJSON;
}

export interface CreateRubricFromPDFForm {
  name: string;
  commission_id: string;
  course_id: string;
  career_id: string;
  faculty_id: string;
  university_id: string;
  rubric_type: RubricType;
  rubric_number: number;
  year: number;
  pdf: File;
}

export interface UpdateRubricForm {
  name?: string;
  rubric_json?: RubricJSON;
  course_id?: string;
  career_id?: string;
  faculty_id?: string;
  university_id?: string;
  year?: number;
}

// ========== ESTADO DE LA APLICACIÓN ==========

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

// ========== PERFIL DE USUARIO ==========

export interface UpdateProfileRequest {
  username?: string;
}

export interface SetGeminiApiKeyRequest {
  api_key: string;
}

// ========== UTILIDADES ==========

export type Role = 'admin' | 'user';

export interface SelectOption {
  value: string;
  label: string;
}
