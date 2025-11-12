import { useState, useEffect } from "react";
import { api } from "../../services/api";

interface ModelOption {
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
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

const ModelSelector = ({ selectedModel, onModelChange }: ModelSelectorProps) => {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const response = await api.model.getAvailableModels();
      setModels(response.models);
      setError(null);
    } catch (err) {
      setError("Failed to load available models");
      console.error("Error loading models:", err);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, maxRating: number = 5) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: maxRating }, (_, i) => (
          <span key={i} className={i < rating ? "text-yellow-400" : "text-gray-300"}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const formatBytes = (bytes: number | null): string => {
    if (!bytes) return "N/A";
    const gb = bytes / 1024 ** 3;
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / 1024 ** 2;
    return `${mb.toFixed(0)} MB`;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-slate-800/50 rounded-xl w-full"></div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-400 text-sm p-3 bg-red-500/10 border border-red-500/30 rounded-xl">{error}</div>;
  }

  const selectedModelData = models.find((m) => m.id === selectedModel);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-white">Model Selection</label>

      <select
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 text-white rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
      >
        {models.map((model) => (
          <option key={model.id} value={model.id} className="bg-slate-800 text-white">
            {model.is_cached ? "✓ " : "⬇ "}
            {model.name} - {model.vram_required_gb}GB VRAM
          </option>
        ))}
      </select>

      {selectedModelData && (
        <div
          className={`p-4 rounded-xl space-y-3 border-2 backdrop-blur-sm ${
            selectedModelData.is_cached
              ? "bg-green-500/10 border-green-500/30"
              : "bg-orange-500/10 border-orange-500/30"
          }`}
        >
          {/* Cache Status Badge */}
          <div className="flex items-center justify-between mb-2">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                selectedModelData.is_cached
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-orange-500/20 text-orange-400 border border-orange-500/30"
              }`}
            >
              {selectedModelData.is_cached ? (
                <>
                  <span className="text-base">✓</span>
                  <span>Already Downloaded</span>
                  {selectedModelData.cache_size_bytes && (
                    <span className="text-green-300">({formatBytes(selectedModelData.cache_size_bytes)})</span>
                  )}
                </>
              ) : (
                <>
                  <span className="text-base">⬇</span>
                  <span>Will Download on First Use</span>
                </>
              )}
            </div>
          </div>

          <p className="text-sm text-slate-300">{selectedModelData.description}</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs font-medium text-slate-400 mb-1">Quality</div>
              {renderStars(selectedModelData.quality_rating)}
            </div>

            <div>
              <div className="text-xs font-medium text-slate-400 mb-1">Speed</div>
              {renderStars(selectedModelData.speed_rating)}
            </div>

            <div>
              <div className="text-xs font-medium text-slate-400 mb-1">VRAM Required</div>
              <div className="text-sm font-semibold text-white">{selectedModelData.vram_required_gb} GB</div>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-400 mb-1">Batch Size</div>
              <div className="text-sm font-semibold text-white">{selectedModelData.batch_size}</div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-700/50">
            <div className="text-xs font-medium text-slate-400 mb-2">Default Configuration</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-500">LR:</span>{" "}
                <span className="font-mono text-white">{selectedModelData.learning_rate}</span>
              </div>
              <div>
                <span className="text-slate-500">Max Length:</span>{" "}
                <span className="font-mono text-white">{selectedModelData.max_length}</span>
              </div>
              <div>
                <span className="text-slate-500">Batch:</span>{" "}
                <span className="font-mono text-white">{selectedModelData.batch_size}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;
