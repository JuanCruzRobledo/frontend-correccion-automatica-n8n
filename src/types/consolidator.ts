/**
 * Types for Consolidator (Individual and Batch)
 */

// Individual consolidation
export interface ConsolidationStats {
  totalFiles: number;
  projectName: string;
  mode: string;
  extensions: string[];
}

export interface ConsolidationResponse {
  success: boolean;
  content: string;
  stats: ConsolidationStats;
  message: string;
}

// Batch consolidation
export interface BatchConsolidationResult {
  student_name: string;
  status: 'success' | 'error' | 'warning';
  error?: string;
  warning?: string;
  stats?: ConsolidationStats;
}

export interface IdenticalGroup {
  project_hash: string;
  students: string[];
  files_count: number;
  lines_count: number;
  percentage: 100;
}

export interface PartialCopy {
  students: [string, string];
  copied_files: {
    name: string;
    hash: string;
  }[];
  percentage: number;
  total_common_files: number;
}

export interface CopiedFile {
  file_name: string;
  hash: string;
  occurrences: number;
  students: string[];
}

export interface SimilarityAnalysis {
  identical_groups: number;
  partial_copies: number;
  most_copied_files: number;
  details: {
    identicalGroups: IdenticalGroup[];
    partialCopies: PartialCopy[];
    mostCopiedFiles: CopiedFile[];
  };
}

export interface BatchConsolidationResponse {
  success: boolean;
  message: string;
  total_processed: number;
  successful: number;
  failed: number;
  results: BatchConsolidationResult[];
  similarity: SimilarityAnalysis;
  download_url: string;
}

// Commission and Rubric types
export interface Commission {
  _id: string;
  commission_id: string;
  commission_name: string;
  course_id: string;
  career_id: string;
  faculty_id: string;
  university_id: string;
}

export interface Rubric {
  _id: string;
  rubric_id: string;
  rubric_name: string;
  course_id: string;
  career_id: string;
  faculty_id: string;
  university_id: string;
}
