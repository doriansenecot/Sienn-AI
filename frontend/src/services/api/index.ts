/**
 * API Service Methods
 * Wraps all backend API calls
 */
import apiClient from "./client";
import type {
  DatasetUploadResponse,
  StartFinetuningRequest,
  StartFinetuningResponse,
  TrainingStatusResponse,
  TestModelRequest,
  TestModelResponse,
  ExportFormat,
  ExportModelRequest,
  ExportModelResponse,
} from "../../types/api";

/**
 * Dataset API
 */
export const datasetAPI = {
  /**
   * Upload a dataset file
   */
  uploadDataset: async (file: File): Promise<DatasetUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<DatasetUploadResponse>("/api/upload-dataset", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  /**
   * Get all uploaded datasets
   */
  listDatasets: async (): Promise<{
    datasets: Array<{
      id: string;
      filename: string;
      size_bytes: number;
      status: string;
      created_at: string;
    }>;
  }> => {
    const response = await apiClient.get("/api/datasets");
    return response.data;
  },
};

/**
 * Job / Fine-tuning API
 */
export const jobAPI = {
  /**
   * Get all jobs
   */
  getAllJobs: async (): Promise<{ jobs: TrainingStatusResponse[] }> => {
    const response = await apiClient.get<{ jobs: TrainingStatusResponse[] }>("/api/jobs");
    return response.data;
  },

  /**
   * Start a fine-tuning job
   */
  startFinetuning: async (request: StartFinetuningRequest): Promise<StartFinetuningResponse> => {
    const response = await apiClient.post<StartFinetuningResponse>("/api/start-finetuning", request);
    return response.data;
  },

  /**
   * Get training status for a job
   */
  getTrainingStatus: async (jobId: string): Promise<TrainingStatusResponse> => {
    const response = await apiClient.get<TrainingStatusResponse>(`/api/training-status/${jobId}`);
    return response.data;
  },

  /**
   * Download trained model
   */
  downloadModel: async (jobId: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/download-model/${jobId}`, {
      responseType: "blob",
    });
    return response.data;
  },
};

/**
 * Inference / Model Testing API
 */
export const inferenceAPI = {
  /**
   * Test a trained model with a prompt
   */
  testModel: async (request: TestModelRequest): Promise<TestModelResponse> => {
    const response = await apiClient.post<TestModelResponse>("/api/test-model", request);
    return response.data;
  },
};

/**
 * Export API
 */
export const exportAPI = {
  /**
   * Get available export formats
   */
  getExportFormats: async (): Promise<ExportFormat[]> => {
    const response = await apiClient.get<ExportFormat[]>("/api/export-formats");
    return response.data;
  },

  /**
   * Export a model in specific format
   */
  exportModel: async (request: ExportModelRequest): Promise<ExportModelResponse> => {
    const response = await apiClient.post<ExportModelResponse>(`/api/export-model/${request.job_id}`, {
      format: request.format,
    });
    return response.data;
  },
};

/**
 * Model API
 */
export const modelAPI = {
  /**
   * Get available pre-configured models
   */
  getAvailableModels: async (): Promise<{
    models: Array<{
      id: string;
      name: string;
      vram_required_gb: number;
      quality_rating: number;
      speed_rating: number;
      batch_size: number;
      max_length: number;
      learning_rate: number;
      description: string;
      is_cached: boolean;
      cache_size_bytes: number | null;
    }>;
  }> => {
    const response = await apiClient.get("/api/models/available");
    return response.data;
  },
};

/**
 * Health check
 */
export const healthAPI = {
  check: async (): Promise<{ status: string; env: string }> => {
    const response = await apiClient.get("/health");
    return response.data;
  },

  /**
   * Get system metrics
   */
  getMetrics: async (): Promise<{
    total_jobs: number;
    active_jobs: number;
    completed_jobs: number;
    failed_jobs: number;
    total_datasets: number;
    total_models: number;
  }> => {
    const response = await apiClient.get("/api/metrics");
    const data = response.data;

    // Map backend structure to frontend expectations
    return {
      total_jobs: data.application?.jobs?.total || 0,
      active_jobs: (data.application?.jobs?.running || 0) + (data.application?.jobs?.pending || 0),
      completed_jobs: data.application?.jobs?.completed || 0,
      failed_jobs: data.application?.jobs?.failed || 0,
      total_datasets: data.application?.datasets?.total || 0,
      total_models: data.application?.jobs?.completed || 0, // Use completed jobs as model count
    };
  },
};

// Export all as single object
export const api = {
  dataset: datasetAPI,
  job: jobAPI,
  inference: inferenceAPI,
  export: exportAPI,
  model: modelAPI,
  health: healthAPI,
};

export default api;
