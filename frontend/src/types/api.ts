/**
 * API Types - Mirroring backend responses
 */

export type JobStatus = "pending" | "running" | "completed" | "failed";

// Dataset Types
export interface Dataset {
  id: string;
  original_filename: string;
  stored_filename: string;
  size_bytes: number;
  status: "uploaded" | "processing" | "ready" | "error";
  format?: string;
  num_samples?: number;
  created_at: string;
}

export interface DatasetUploadResponse {
  dataset_id: string;
  filename: string;
  size_bytes: number;
  status: string;
  preview: string[];
  created_at: string;
}

// Job Types
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

export interface StartFinetuningRequest {
  dataset_id: string;
  model_name: string;
  learning_rate?: number;
  num_epochs?: number;
  batch_size?: number;
  max_length?: number;
}

export interface StartFinetuningResponse {
  job_id: string;
  status: string;
  dataset_id: string;
  message: string;
  created_at: string;
}

export interface TrainingStatusResponse {
  job_id: string;
  dataset_id: string;
  status: JobStatus;
  progress: number;
  message: string;
  created_at: string;
  updated_at: string;
  meta?: {
    model_name?: string;
    learning_rate?: number;
    num_epochs?: number;
    batch_size?: number;
    current_epoch?: number;
    train_loss?: number;
    eval_loss?: number;
  };
}

// Inference Types
export interface TestModelRequest {
  job_id: string;
  prompt: string;
  max_new_tokens?: number;
  temperature?: number;
  top_p?: number;
}

export interface TestModelResponse {
  job_id: string;
  prompt: string;
  generated_text: string;
  generation_time: number;
  tokens_generated: number;
}

// Export Types
export interface ExportFormat {
  id: string;
  name: string;
  description: string;
  file_extension: string;
}

export interface ExportModelRequest {
  job_id: string;
  format: "ollama" | "huggingface" | "gguf";
}

export interface ExportModelResponse {
  export_id: string;
  job_id: string;
  format: string;
  status: string;
  download_url?: string;
  created_at: string;
}

// Error Types
export interface APIError {
  detail: string;
  status_code?: number;
}

// Legacy aliases for backward compatibility
export type ApiError = APIError;
export type ModelTestRequest = TestModelRequest;
export type ModelTestResponse = TestModelResponse;
export interface TrainingConfig extends StartFinetuningRequest {
  base_model?: string;
  lora_r?: number;
  lora_alpha?: number;
  lora_dropout?: number;
}
