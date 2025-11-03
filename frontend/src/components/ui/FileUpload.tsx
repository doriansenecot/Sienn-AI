/**
 * File Upload Component with Drag & Drop
 */
import { useCallback, useState, DragEvent, ChangeEvent } from 'react';
import { clsx } from 'clsx';
import { Upload, File as FileIcon, X } from 'lucide-react';
import { Button } from './Button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
  className?: string;
}

export function FileUpload({
  onFileSelect,
  accept = '.csv,.json,.jsonl,.txt',
  maxSize = 100,
  disabled = false,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');

  const validateFile = useCallback(
    (file: File): boolean => {
      // Check file size
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSize) {
        setError(`File size must be less than ${maxSize}MB`);
        return false;
      }

      // Check file type
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      const acceptedExtensions = accept.split(',').map((ext) => ext.trim());
      
      if (!acceptedExtensions.includes(extension)) {
        setError(`File type must be one of: ${accept}`);
        return false;
      }

      setError('');
      return true;
    },
    [accept, maxSize]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [validateFile, onFileSelect]
  );

  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [disabled, handleFile]
  );

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setError('');
  }, []);

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Drop zone */}
      <div
        className={clsx(
          'relative rounded-2xl border-2 border-dashed transition-all duration-200',
          'backdrop-blur-sm p-8',
          isDragging
            ? 'border-primary-500 bg-primary-500/10'
            : 'border-slate-700/50 bg-slate-800/30',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && !isDragging && 'hover:border-slate-600 hover:bg-slate-800/40'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept={accept}
          onChange={handleFileInput}
          disabled={disabled}
        />

        <label
          htmlFor="file-upload"
          className={clsx(
            'flex flex-col items-center justify-center space-y-4',
            !disabled && 'cursor-pointer'
          )}
        >
          <div
            className={clsx(
              'w-16 h-16 rounded-2xl flex items-center justify-center',
              'bg-gradient-to-br transition-all duration-200',
              isDragging
                ? 'from-primary-500 to-purple-600 scale-110'
                : 'from-primary-500/20 to-purple-600/20'
            )}
          >
            <Upload className={clsx('w-8 h-8', isDragging ? 'text-white' : 'text-primary-400')} />
          </div>

          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-white">
              {isDragging ? 'Drop your file here' : 'Choose a file or drag it here'}
            </p>
            <p className="text-sm text-slate-400">
              Supported formats: {accept.replace(/\./g, '').toUpperCase()}
            </p>
            <p className="text-xs text-slate-500">Max size: {maxSize}MB</p>
          </div>

          {!disabled && !selectedFile && (
            <Button variant="primary" size="sm" type="button">
              Browse Files
            </Button>
          )}
        </label>
      </div>

      {/* Selected file info */}
      {selectedFile && (
        <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl shadow-lg p-4 flex items-center justify-between animate-fade-in-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
              <FileIcon className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{selectedFile.name}</p>
              <p className="text-xs text-slate-400">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
          <button
            onClick={clearFile}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="backdrop-blur-lg p-4 border border-red-500/30 bg-red-500/10 rounded-xl">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
