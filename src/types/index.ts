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

export interface Course {
  _id: string;
  course_id: string;
  name: string;
  university_id: string;
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Rubric {
  _id: string;
  rubric_id: string;
  name: string;
  university_id: string;
  course_id: string;
  rubric_json: RubricJSON; // El esquema completo de la rúbrica
  source: 'pdf' | 'json' | 'manual';
  original_file_url?: string;
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
  role: 'admin' | 'user';
  deleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
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

export interface CreateCourseForm {
  course_id: string;
  name: string;
  university_id: string;
}

export interface UpdateCourseForm {
  name?: string;
  university_id?: string;
}

export interface CreateRubricForm {
  name: string;
  university_id: string;
  course_id: string;
  rubric_json: RubricJSON;
}

export interface CreateRubricFromPDFForm {
  name: string;
  university_id: string;
  course_id: string;
  pdf: File;
}

export interface UpdateRubricForm {
  name?: string;
  rubric_json?: RubricJSON;
}

// ========== ESTADO DE LA APLICACIÓN ==========

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
}

// ========== UTILIDADES ==========

export type Role = 'admin' | 'user';

export interface SelectOption {
  value: string;
  label: string;
}
