/**
 * API Types - Mirroring backend responses
 */

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Dataset {
  dataset_id: string;
  filename: string;
  filepath: string;
  row_count?: number;
  created_at: string;
}

export interface Job {
  job_id: string;
  dataset_id: string;
  status: JobStatus;
  progress: number;
  model_name?: string;
  model_path?: string;
  base_model?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error?: string;
  metadata?: {
    training_loss?: number;
    eval_loss?: number;
    learning_rate?: number;
    epochs_completed?: number;
  };
}

export interface TrainingConfig {
  dataset_id: string;
  model_name: string;
  base_model?: string;
  learning_rate?: number;
  num_epochs?: number;
  batch_size?: number;
  lora_r?: number;
  lora_alpha?: number;
  lora_dropout?: number;
}

export interface ModelTestRequest {
  job_id: string;
  prompt: string;
  max_length?: number;
  temperature?: number;
}

export interface ModelTestResponse {
  job_id: string;
  prompt: string;
  generated_text: string;
  model_path: string;
}

export interface ExportFormat {
  format: string;
  description: string;
  available: boolean;
}

export interface ApiError {
  detail: string;
  status?: number;
}
