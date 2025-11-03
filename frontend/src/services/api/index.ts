/**
 * API Service Methods
 * Wraps all backend API calls
 */
import apiClient from './client';
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
} from '../../types/api';

/**
 * Dataset API
 */
export const datasetAPI = {
  /**
   * Upload a dataset file
   */
  uploadDataset: async (file: File): Promise<DatasetUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post<DatasetUploadResponse>(
      '/api/upload-dataset',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  },
};

/**
 * Job / Fine-tuning API
 */
export const jobAPI = {
  /**
   * Start a fine-tuning job
   */
  startFinetuning: async (
    request: StartFinetuningRequest
  ): Promise<StartFinetuningResponse> => {
    const response = await apiClient.post<StartFinetuningResponse>(
      '/api/start-finetuning',
      request
    );
    return response.data;
  },

  /**
   * Get training status for a job
   */
  getTrainingStatus: async (jobId: string): Promise<TrainingStatusResponse> => {
    const response = await apiClient.get<TrainingStatusResponse>(
      `/api/training-status/${jobId}`
    );
    return response.data;
  },

  /**
   * Download trained model
   */
  downloadModel: async (jobId: string): Promise<Blob> => {
    const response = await apiClient.get(`/api/download-model/${jobId}`, {
      responseType: 'blob',
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
    const response = await apiClient.post<TestModelResponse>(
      '/api/test-model',
      request
    );
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
    const response = await apiClient.get<ExportFormat[]>('/api/export-formats');
    return response.data;
  },

  /**
   * Export a model in specific format
   */
  exportModel: async (
    request: ExportModelRequest
  ): Promise<ExportModelResponse> => {
    const response = await apiClient.post<ExportModelResponse>(
      `/api/export-model/${request.job_id}`,
      { format: request.format }
    );
    return response.data;
  },
};

/**
 * Health check
 */
export const healthAPI = {
  check: async (): Promise<{ status: string; env: string }> => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

// Export all as single object
export const api = {
  dataset: datasetAPI,
  job: jobAPI,
  inference: inferenceAPI,
  export: exportAPI,
  health: healthAPI,
};

export default api;
