/**
 * Modern Dataset Upload Page
 * Advanced drag-and-drop with real-time preview and validation
 */
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload as UploadIcon,
  CheckCircle,
  FileText,
  AlertCircle,
  FileUp,
  Sparkles,
  ArrowRight,
  X,
  Database,
} from "lucide-react";
import toast from "react-hot-toast";

import { api } from "../../services/api";
import type { DatasetUploadResponse } from "../../types/api";

export function UploadPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadResult, setUploadResult] = useState<DatasetUploadResponse | null>(null);
  const [filePreview, setFilePreview] = useState<string[]>([]);

  // File validation
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const validTypes = [".csv", ".json", ".jsonl", ".txt"];
    const maxSize = 100 * 1024 * 1024; // 100MB

    const extension = "." + file.name.split(".").pop()?.toLowerCase();

    if (!validTypes.includes(extension)) {
      return { valid: false, error: `Invalid file type. Accepted: ${validTypes.join(", ")}` };
    }

    if (file.size > maxSize) {
      return { valid: false, error: "File size exceeds 100MB limit" };
    }

    return { valid: true };
  };

  // File preview
  const previewFile = async (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").slice(0, 10); // First 10 lines
      setFilePreview(lines);
    };
    reader.readAsText(file.slice(0, 50000)); // First 50KB
  };

  const handleFileSelect = useCallback((file: File) => {
    const validation = validateFile(file);

    if (!validation.valid) {
      toast.error(validation.error || "Invalid file");
      return;
    }

    setSelectedFile(file);
    setUploadResult(null);
    previewFile(file);
    toast.success(`File selected: ${file.name}`);
  }, []);

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await api.dataset.uploadDataset(selectedFile);

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadResult(result);
      toast.success("Dataset uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFilePreview([]);
    setUploadProgress(0);
  };

  const handleStartTraining = () => {
    if (uploadResult) {
      navigate("/training", { state: { datasetId: uploadResult.dataset_id } });
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="relative min-h-screen p-4 sm:p-8 space-y-8 animate-fade-in-up">
      {/* Grain Overlay */}
      <div className="grain-overlay" />

      {/* Header */}
      <div className="text-center space-y-4 relative z-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 shadow-2xl shadow-primary-500/50 animate-glow-pulse">
          <UploadIcon className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gradient bg-[length:200%_auto] animate-gradient-x">
          Upload Training Dataset
        </h1>
        <p className="text-dark-300 max-w-2xl mx-auto text-lg">
          Upload your training data with our advanced drag-and-drop interface. Real-time validation and instant preview
          included.
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* Upload Area */}
        {!uploadResult && (
          <div
            className={`
              relative glass-strong rounded-3xl p-8 border-2 transition-all duration-300
              ${
                isDragging
                  ? "border-primary-500 bg-primary-500/10 scale-[1.02]"
                  : "border-white/10 hover:border-white/20"
              }
            `}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="text-center space-y-6">
              {/* Icon */}
              <div className="relative">
                <div
                  className={`
                  inline-flex items-center justify-center w-24 h-24 rounded-2xl 
                  bg-gradient-to-br from-primary-500/20 to-secondary-500/20 
                  border-2 border-dashed transition-all duration-300
                  ${isDragging ? "border-primary-500 scale-110" : "border-white/30"}
                `}
                >
                  <FileUp
                    className={`w-12 h-12 text-primary-400 transition-transform duration-300 ${isDragging ? "scale-110" : ""}`}
                  />
                </div>
                {isDragging && <div className="absolute inset-0 rounded-2xl bg-primary-500/20 animate-ping" />}
              </div>

              {/* Instructions */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">
                  {isDragging ? "Drop your file here" : "Drag & drop your dataset"}
                </h3>
                <p className="text-dark-400 text-sm">or click to browse from your computer</p>
              </div>

              {/* File input */}
              <div>
                <input
                  type="file"
                  id="file-input"
                  accept=".csv,.json,.jsonl,.txt"
                  onChange={handleFileInput}
                  disabled={uploading}
                  className="hidden"
                />
                <label htmlFor="file-input">
                  <span className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:from-primary-500 hover:to-primary-400 active:scale-95 transition-all duration-200 cursor-pointer">
                    <Database className="w-5 h-5" />
                    <span>Select File</span>
                  </span>
                </label>
              </div>

              {/* Accepted formats */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
                {["CSV", "JSON", "JSONL", "TXT"].map((format) => (
                  <span
                    key={format}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-white/5 text-dark-300 border border-white/10"
                  >
                    .{format.toLowerCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Selected File Preview */}
        {selectedFile && !uploadResult && !uploading && (
          <div className="glass-strong rounded-2xl p-6 border border-white/10 animate-scale-in">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-primary-400" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedFile.name}</h3>
                    <p className="text-sm text-dark-400 mt-1">{formatFileSize(selectedFile.size)} • Ready to upload</p>
                  </div>
                  <button
                    onClick={handleClearFile}
                    className="p-2 rounded-lg hover:bg-white/10 text-dark-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* File preview */}
                {filePreview.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-dark-300">File Preview:</p>
                    <div className="bg-dark-900/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 overflow-x-auto max-h-48 overflow-y-auto">
                      <pre className="text-xs text-dark-300 font-mono">{filePreview.join("\n")}</pre>
                    </div>
                  </div>
                )}

                {/* Upload button */}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleClearFile}
                    className="px-4 py-2 rounded-xl bg-white/5 text-dark-300 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:from-primary-500 hover:to-primary-400 active:scale-95 transition-all duration-200"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Upload Dataset</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Uploading Progress */}
        {uploading && (
          <div className="glass-strong rounded-2xl p-8 border border-white/10 animate-pulse">
            <div className="space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-500/20">
                <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Uploading Dataset...</h3>
                <p className="text-dark-400">Please wait while we process your file</p>
              </div>

              {/* Progress bar */}
              <div className="max-w-md mx-auto space-y-2">
                <div className="w-full h-2 bg-dark-800/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-dark-400 tabular-nums">{uploadProgress}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Success */}
        {uploadResult && (
          <div className="glass-strong rounded-2xl p-8 border-2 border-success-500/30 animate-bounce-in">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-success-500/50 animate-glow-pulse">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Upload Successful!</h3>
                  <p className="text-dark-300">
                    Your dataset has been uploaded and validated. Ready to start training.
                  </p>
                </div>

                {/* Dataset Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass rounded-xl p-4 space-y-1">
                    <p className="text-xs text-dark-400 uppercase tracking-wide">Dataset ID</p>
                    <p className="text-sm text-white font-mono">{uploadResult.dataset_id.slice(0, 12)}...</p>
                  </div>
                  <div className="glass rounded-xl p-4 space-y-1">
                    <p className="text-xs text-dark-400 uppercase tracking-wide">Filename</p>
                    <p className="text-sm text-white truncate">{uploadResult.filename}</p>
                  </div>
                  <div className="glass rounded-xl p-4 space-y-1">
                    <p className="text-xs text-dark-400 uppercase tracking-wide">File Size</p>
                    <p className="text-sm text-white">{formatFileSize(uploadResult.size_bytes)}</p>
                  </div>
                  <div className="glass rounded-xl p-4 space-y-1">
                    <p className="text-xs text-dark-400 uppercase tracking-wide">Status</p>
                    <p className="text-sm text-success-400 font-medium">{uploadResult.status}</p>
                  </div>
                </div>

                {/* Preview */}
                {uploadResult.preview && uploadResult.preview.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary-400" />
                      <span className="text-sm font-semibold text-white">
                        Data Preview (first {uploadResult.preview.length} lines)
                      </span>
                    </div>
                    <div className="bg-dark-900/80 backdrop-blur-xl border border-white/10 rounded-xl p-4 overflow-x-auto max-h-64 overflow-y-auto">
                      <pre className="text-xs text-dark-300 font-mono leading-relaxed">
                        {uploadResult.preview.join("\n")}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setUploadResult(null);
                      setFilePreview([]);
                    }}
                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 text-dark-200 hover:bg-white/10 hover:text-white font-medium transition-all duration-200"
                  >
                    Upload Another
                  </button>
                  <button
                    onClick={handleStartTraining}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:from-primary-500 hover:to-primary-400 active:scale-95 transition-all duration-200"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Configure Training</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Panel */}
        {!uploadResult && (
          <div className="glass-strong rounded-2xl p-6 border border-white/10">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-info-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-info-400" />
              </div>
              <div className="flex-1 space-y-3">
                <h4 className="text-lg font-bold text-white">Dataset Requirements</h4>
                <ul className="space-y-2 text-sm text-dark-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success-400 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">CSV:</strong> Columns for input prompts and expected outputs
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success-400 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">JSON/JSONL:</strong> Objects with "prompt" and "completion" fields
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success-400 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">TXT:</strong> Plain text for language modeling
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success-400 flex-shrink-0 mt-0.5" />
                    <span>
                      Maximum file size: <strong className="text-white">100MB</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-success-400 flex-shrink-0 mt-0.5" />
                    <span>
                      Recommended: <strong className="text-white">50-100+ training examples</strong>
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
