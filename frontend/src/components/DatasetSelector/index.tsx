import { useState, useEffect, useCallback } from "react";
import { FileText, Database, Calendar, HardDrive } from "lucide-react";
import { api } from "../../services/api";

interface Dataset {
  id: string;
  filename: string;
  size_bytes: number;
  status: string;
  created_at: string;
}

interface DatasetSelectorProps {
  selectedDatasetId: string | null;
  onDatasetChange: (datasetId: string) => void;
}

const DatasetSelector = ({ selectedDatasetId, onDatasetChange }: DatasetSelectorProps) => {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDatasets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.dataset.listDatasets();
      setDatasets(response.datasets);

      // Auto-select first dataset if none selected
      if (!selectedDatasetId && response.datasets.length > 0) {
        onDatasetChange(response.datasets[0].id);
      }
      setError(null);
    } catch (err) {
      setError("Failed to load datasets");
      console.error("Error loading datasets:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDatasetId, onDatasetChange]);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-slate-800/50 rounded-xl"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-400 text-sm p-3 bg-red-500/10 border border-red-500/30 rounded-xl">{error}</div>;
  }

  if (datasets.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-800/30 rounded-xl border-2 border-dashed border-slate-700/50">
        <Database className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <p className="text-white font-medium mb-1">No datasets found</p>
        <p className="text-sm text-slate-400">Upload a dataset first to get started</p>
      </div>
    );
  }

  const selectedDataset = datasets.find((d) => d.id === selectedDatasetId);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-white">Select Dataset</label>

      <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
        {datasets.map((dataset) => (
          <button
            key={dataset.id}
            onClick={() => onDatasetChange(dataset.id)}
            className={`
              text-left p-4 rounded-xl border-2 transition-all duration-300
              hover:shadow-lg hover:scale-[1.01]
              ${
                selectedDatasetId === dataset.id
                  ? "border-primary-500/50 bg-primary-500/10 shadow-md shadow-primary-500/20"
                  : "border-slate-700/50 bg-slate-800/30 hover:border-primary-500/30 hover:bg-slate-800/50 hover:shadow-primary-500/10"
              }
            `}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className={`
                    w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors
                    ${selectedDatasetId === dataset.id ? "bg-primary-500/20" : "bg-slate-700/50"}
                  `}
                >
                  <FileText
                    className={`w-5 h-5 ${selectedDatasetId === dataset.id ? "text-primary-400" : "text-slate-400"}`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{dataset.filename}</p>

                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      <span>{formatBytes(dataset.size_bytes)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(dataset.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedDatasetId === dataset.id && (
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {selectedDataset && (
        <div className="p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <p className="text-xs font-medium text-slate-300 mb-1">Selected Dataset</p>
          <p className="text-sm font-mono text-slate-400 truncate">{selectedDataset.id}</p>
        </div>
      )}
    </div>
  );
};

export default DatasetSelector;
