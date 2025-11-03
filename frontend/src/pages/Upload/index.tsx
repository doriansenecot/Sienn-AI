/**
 * Dataset Upload Page
 * Allows users to upload training datasets with drag-and-drop
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, CheckCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

import { FileUpload, Card, CardHeader, CardTitle, CardContent, Button } from '../../components/ui';
import { api } from '../../services/api';
import type { DatasetUploadResponse } from '../../types/api';

export function UploadPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<DatasetUploadResponse | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    try {
      const result = await api.dataset.uploadDataset(selectedFile);
      setUploadResult(result);
      toast.success('Dataset uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      // Error already handled by axios interceptor
    } finally {
      setUploading(false);
    }
  };

  const handleStartTraining = () => {
    if (uploadResult) {
      // Navigate to training config with dataset_id
      navigate('/training', { state: { datasetId: uploadResult.dataset_id } });
    }
  };

  return (
    <div className="min-h-screen p-8 space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 animate-glow">
          <UploadIcon className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent">
          Upload Training Dataset
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Upload your training data in CSV, JSON, JSONL, or TXT format. 
          Make sure your data follows the expected format for fine-tuning.
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle>Select Your Dataset</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              onFileSelect={handleFileSelect}
              accept=".csv,.json,.jsonl,.txt"
              maxSize={100}
              disabled={uploading}
            />

            {selectedFile && !uploadResult && (
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedFile(null)}
                  disabled={uploading}
                >
                  Clear
                </Button>
                <Button
                  variant="primary"
                  onClick={handleUpload}
                  loading={uploading}
                  icon={<UploadIcon className="w-4 h-4" />}
                >
                  Upload Dataset
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Success Card */}
        {uploadResult && (
          <Card className="border-2 border-green-500/30 animate-scale-in">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Upload Successful!</h3>
                  <p className="text-sm text-slate-400">
                    Your dataset has been uploaded and is ready for training.
                  </p>
                </div>

                {/* Dataset Info */}
                <div className="bg-slate-800/70 backdrop-blur-lg border border-slate-700 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Dataset ID:</span>
                    <span className="text-white font-mono">{uploadResult.dataset_id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Filename:</span>
                    <span className="text-white">{uploadResult.filename}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Size:</span>
                    <span className="text-white">
                      {(uploadResult.size_bytes / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-green-400 font-medium">{uploadResult.status}</span>
                  </div>
                </div>

                {/* Preview */}
                {uploadResult.preview && uploadResult.preview.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium">Data Preview (first {uploadResult.preview.length} lines)</span>
                    </div>
                    <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 p-4 rounded-xl overflow-x-auto">
                      <pre className="text-xs text-slate-300 font-mono">
                        {uploadResult.preview.join('\n')}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSelectedFile(null);
                      setUploadResult(null);
                    }}
                  >
                    Upload Another
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleStartTraining}
                  >
                    Configure Training →
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Info Card */}
        {!uploadResult && (
          <Card variant="frosted">
            <h4 className="text-sm font-bold text-white mb-2">📋 Dataset Requirements</h4>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• <strong>CSV:</strong> Should contain columns for input prompts and expected outputs</li>
              <li>• <strong>JSON/JSONL:</strong> Each entry should have "prompt" and "completion" fields</li>
              <li>• <strong>TXT:</strong> Plain text format for language modeling tasks</li>
              <li>• Maximum file size: 100MB</li>
              <li>• Recommended: At least 50-100 training examples for best results</li>
            </ul>
          </Card>
        )}
      </div>
    </div>
  );
}
