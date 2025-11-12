import { useState, useEffect } from "react";
import { Download, Check, Zap, Star, HardDrive } from "lucide-react";
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

interface ModelGridProps {
  onModelSelect?: (modelId: string) => void;
  selectedModelId?: string;
}

const ModelGrid = ({ onModelSelect, selectedModelId }: ModelGridProps) => {
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
      setError("Failed to load models");
      console.error("Error loading models:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number | null): string => {
    if (!bytes) return "N/A";
    const gb = bytes / 1024 ** 3;
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / 1024 ** 2;
    return `${mb.toFixed(0)} MB`;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={`w-3 h-3 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-sm p-4 bg-red-50 rounded-lg text-center">{error}</div>;
  }

  const cachedModels = models.filter((m) => m.is_cached);
  const notCachedModels = models.filter((m) => !m.is_cached);

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-600 font-medium mb-1">Total Models</div>
          <div className="text-2xl font-bold text-blue-700">{models.length}</div>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-600 font-medium mb-1">Downloaded</div>
          <div className="text-2xl font-bold text-green-700">{cachedModels.length}</div>
        </div>
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="text-sm text-orange-600 font-medium mb-1">Not Downloaded</div>
          <div className="text-2xl font-bold text-orange-700">{notCachedModels.length}</div>
        </div>
      </div>

      {/* Downloaded Models Section */}
      {cachedModels.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-600" />
            Downloaded Models ({cachedModels.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cachedModels.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                isSelected={selectedModelId === model.id}
                onSelect={onModelSelect}
                renderStars={renderStars}
                formatBytes={formatBytes}
              />
            ))}
          </div>
        </div>
      )}

      {/* Not Downloaded Models Section */}
      {notCachedModels.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Download className="w-5 h-5 text-red-600" />
            Available to Download ({notCachedModels.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notCachedModels.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                isSelected={selectedModelId === model.id}
                onSelect={onModelSelect}
                renderStars={renderStars}
                formatBytes={formatBytes}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface ModelCardProps {
  model: ModelOption;
  isSelected: boolean;
  onSelect?: (modelId: string) => void;
  renderStars: (rating: number) => JSX.Element;
  formatBytes: (bytes: number | null) => string;
}

const ModelCard = ({ model, isSelected, onSelect, renderStars, formatBytes }: ModelCardProps) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(model.id);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!onSelect}
      className={`
        relative text-left p-4 rounded-lg border-2 transition-all
        ${onSelect ? "cursor-pointer hover:shadow-lg" : "cursor-default"}
        ${isSelected ? "border-blue-500 bg-blue-50 shadow-md" : "border-gray-200 bg-white"}
        ${model.is_cached ? "ring-2 ring-green-200" : "ring-2 ring-red-200"}
      `}
    >
      {/* Cache Status Badge */}
      <div
        className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${
          model.is_cached ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}
      >
        {model.is_cached ? (
          <span className="flex items-center gap-1">
            <Check className="w-3 h-3" />
            Cached
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <Download className="w-3 h-3" />
            Not Cached
          </span>
        )}
      </div>

      {/* Model Name */}
      <div className="mb-3 pr-20">
        <h4 className="font-bold text-gray-900 mb-1">{model.name}</h4>
        <p className="text-xs text-gray-600 line-clamp-2">{model.description}</p>
      </div>

      {/* Stats Grid */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            VRAM
          </span>
          <span className="font-semibold text-gray-700">{model.vram_required_gb} GB</span>
        </div>

        {model.is_cached && model.cache_size_bytes && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Cache Size</span>
            <span className="font-semibold text-green-600">{formatBytes(model.cache_size_bytes)}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 flex items-center gap-1">
            <Star className="w-3 h-3" />
            Quality
          </span>
          {renderStars(model.quality_rating)}
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Speed
          </span>
          {renderStars(model.speed_rating)}
        </div>
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute bottom-2 right-2">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </button>
  );
};

export default ModelGrid;
