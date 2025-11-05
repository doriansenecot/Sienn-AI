/**
 * Modern Models Browser Page
 * Advanced model browsing with grid/list toggle, filters, and sophisticated animations
 */
import { useState, useEffect, useMemo } from "react";
import {
  Database,
  Grid3x3,
  List,
  Download,
  Check,
  Zap,
  Star,
  HardDrive,
  Search,
  Filter,
  X,
  TrendingUp,
  Clock,
  ChevronDown,
  Sparkles,
  Package,
} from "lucide-react";
import { api } from "../../services/api";

// ==========================
// Types & Interfaces
// ==========================

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

type ViewMode = "grid" | "list";
type SortOption = "name" | "vram" | "quality" | "speed" | "size";
type FilterStatus = "all" | "cached" | "not-cached";

// ==========================
// Utility Functions
// ==========================

function formatBytes(bytes: number | null): string {
  if (!bytes) return "N/A";
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / 1024 ** 2;
  return `${mb.toFixed(0)} MB`;
}

function renderStars(rating: number) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${
            i < rating ? "fill-yellow-400 text-yellow-400" : "text-slate-600"
          }`}
        />
      ))}
    </div>
  );
}

// ==========================
// Model Card Components
// ==========================

interface ModelCardProps {
  model: ModelOption;
  viewMode: ViewMode;
}

function ModelCard({ model, viewMode }: ModelCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (viewMode === "list") {
    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="group glass-strong rounded-xl border border-slate-700/50 p-5 hover-lift transition-all duration-300 hover:border-primary-500/50"
      >
        <div className="flex items-start gap-6">
          {/* Icon */}
          <div
            className={`w-16 h-16 rounded-xl bg-gradient-to-br ${
              model.is_cached
                ? "from-green-500 to-emerald-600"
                : "from-orange-500 to-red-600"
            } flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
              isHovered ? "scale-110 rotate-3" : ""
            }`}
          >
            {model.is_cached ? (
              <Check className="w-8 h-8 text-white" />
            ) : (
              <Download className="w-8 h-8 text-white" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary-400 transition-colors">
                  {model.name}
                </h3>
                <p className="text-sm text-slate-400 line-clamp-2">{model.description}</p>
              </div>

              {/* Status Badge */}
              <div
                className={`ml-4 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                  model.is_cached
                    ? "bg-green-500/10 text-green-400 border border-green-500/30"
                    : "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                }`}
              >
                {model.is_cached ? (
                  <>
                    <Check className="w-3 h-3" />
                    Downloaded
                  </>
                ) : (
                  <>
                    <Download className="w-3 h-3" />
                    Available
                  </>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-purple-400" />
                <div>
                  <p className="text-xs text-slate-500">VRAM</p>
                  <p className="text-sm font-semibold text-white">{model.vram_required_gb} GB</p>
                </div>
              </div>

              {model.is_cached && model.cache_size_bytes && (
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="text-xs text-slate-500">Size</p>
                    <p className="text-sm font-semibold text-green-400">{formatBytes(model.cache_size_bytes)}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <div>
                  <p className="text-xs text-slate-500">Quality</p>
                  {renderStars(model.quality_rating)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <div>
                  <p className="text-xs text-slate-500">Speed</p>
                  {renderStars(model.speed_rating)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shimmer Effect on Hover */}
        {isHovered && <div className="absolute inset-0 shimmer rounded-xl pointer-events-none" />}
      </div>
    );
  }

  // Grid View
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative glass-strong rounded-2xl border border-slate-700/50 p-6 hover-lift transition-all duration-300 overflow-hidden card-glow"
    >
      {/* Status Badge */}
      <div
        className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
          model.is_cached
            ? "bg-green-500/10 text-green-400 border border-green-500/30"
            : "bg-orange-500/10 text-orange-400 border border-orange-500/30"
        }`}
      >
        {model.is_cached ? (
          <>
            <Check className="w-3 h-3" />
            Ready
          </>
        ) : (
          <>
            <Download className="w-3 h-3" />
            Download
          </>
        )}
      </div>

      {/* Icon */}
      <div
        className={`w-16 h-16 rounded-xl bg-gradient-to-br ${
          model.is_cached
            ? "from-green-500 to-emerald-600 shadow-glow-green"
            : "from-orange-500 to-red-600 shadow-glow-red"
        } flex items-center justify-center mb-4 transition-all duration-300 ${
          isHovered ? "scale-110 rotate-6" : ""
        }`}
      >
        {model.is_cached ? (
          <Check className="w-8 h-8 text-white" />
        ) : (
          <Download className="w-8 h-8 text-white" />
        )}
      </div>

      {/* Content */}
      <div className="mb-4 pr-20">
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gradient-primary transition-all">
          {model.name}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-3">{model.description}</p>
      </div>

      {/* Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            VRAM Required
          </span>
          <span className="text-sm font-semibold text-white">{model.vram_required_gb} GB</span>
        </div>

        {model.is_cached && model.cache_size_bytes && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-green-400" />
              Cache Size
            </span>
            <span className="text-sm font-semibold text-green-400">{formatBytes(model.cache_size_bytes)}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-yellow-400" />
            Quality
          </span>
          {renderStars(model.quality_rating)}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            Speed
          </span>
          {renderStars(model.speed_rating)}
        </div>
      </div>

      {/* Shimmer Effect on Hover */}
      {isHovered && <div className="absolute inset-0 shimmer rounded-2xl pointer-events-none" />}
    </div>
  );
}

// ==========================
// Main Component
// ==========================

export function ModelsBrowserPage() {
  const [models, setModels] = useState<ModelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [showFilters, setShowFilters] = useState(false);

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

  // Filtered and sorted models
  const filteredModels = useMemo(() => {
    let filtered = [...models];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (model) =>
          model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          model.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus === "cached") {
      filtered = filtered.filter((model) => model.is_cached);
    } else if (filterStatus === "not-cached") {
      filtered = filtered.filter((model) => !model.is_cached);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "vram":
          return a.vram_required_gb - b.vram_required_gb;
        case "quality":
          return b.quality_rating - a.quality_rating;
        case "speed":
          return b.speed_rating - a.speed_rating;
        case "size":
          return (b.cache_size_bytes || 0) - (a.cache_size_bytes || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [models, searchQuery, filterStatus, sortBy]);

  const cachedCount = models.filter((m) => m.is_cached).length;
  const notCachedCount = models.filter((m) => !m.is_cached).length;

  return (
    <div className="min-h-screen p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-rose-600 animate-glow-pulse">
          <Database className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-gradient-primary">Model Browser</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Explore available models, check cache status, and find the perfect model for your fine-tuning needs
        </p>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
          <div className="glass-strong rounded-2xl border border-slate-700/50 p-6 hover-lift transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Total Models</p>
                <p className="text-3xl font-bold text-white">{models.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center animate-glow-pulse">
                <Database className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-strong rounded-2xl border border-green-500/30 p-6 hover-lift transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Downloaded</p>
                <p className="text-3xl font-bold text-green-400">{cachedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-glow-green">
                <Check className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="glass-strong rounded-2xl border border-orange-500/30 p-6 hover-lift transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Available</p>
                <p className="text-3xl font-bold text-orange-400">{notCachedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-glow-red">
                <Download className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="glass-strong rounded-2xl border border-slate-700/50 p-4 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search models by name or description..."
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl p-1 border border-slate-700/50">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === "grid"
                    ? "bg-primary-500 text-white shadow-glow"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === "list"
                    ? "bg-primary-500 text-white shadow-glow"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Filters Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white hover:bg-slate-700/50 transition-all"
            >
              <Filter className="w-5 h-5" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-700/50 animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sort By */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  >
                    <option value="name">Name (A-Z)</option>
                    <option value="vram">VRAM (Low to High)</option>
                    <option value="quality">Quality (High to Low)</option>
                    <option value="speed">Speed (High to Low)</option>
                    <option value="size">Size (Large to Small)</option>
                  </select>
                </div>

                {/* Filter Status */}
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Status</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilterStatus("all")}
                      className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
                        filterStatus === "all"
                          ? "bg-primary-500 text-white shadow-glow"
                          : "bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilterStatus("cached")}
                      className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
                        filterStatus === "cached"
                          ? "bg-green-500 text-white shadow-glow-green"
                          : "bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white"
                      }`}
                    >
                      Downloaded
                    </button>
                    <button
                      onClick={() => setFilterStatus("not-cached")}
                      className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
                        filterStatus === "not-cached"
                          ? "bg-orange-500 text-white shadow-glow-red"
                          : "bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white"
                      }`}
                    >
                      Available
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between text-sm text-slate-400 px-2">
          <p>
            Showing <span className="text-white font-semibold">{filteredModels.length}</span> of{" "}
            <span className="text-white font-semibold">{models.length}</span> models
          </p>
          {searchQuery && (
            <p>
              Search results for: <span className="text-primary-400 font-semibold">"{searchQuery}"</span>
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="glass-strong rounded-2xl border border-slate-700/50 p-12">
            <div className="text-center space-y-4">
              <div className="animate-spin w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full mx-auto" />
              <p className="text-slate-400 text-lg">Loading models...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="glass-strong rounded-2xl border-2 border-red-500/30 p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Failed to Load Models</h3>
            <p className="text-slate-400 mb-4">{error}</p>
            <button
              onClick={loadModels}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 text-white font-semibold hover:shadow-glow transition-all hover:scale-105"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Models Grid/List */}
        {!loading && !error && (
          <>
            {filteredModels.length === 0 ? (
              <div className="glass-strong rounded-2xl border border-slate-700/50 p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">No Models Found</h3>
                <p className="text-slate-400 mb-4">Try adjusting your search or filters</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterStatus("all");
                  }}
                  className="px-6 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white hover:bg-slate-700/50 transition-all"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up"
                    : "space-y-4 animate-fade-in-up"
                }
                style={{ animationDelay: "200ms" }}
              >
                {filteredModels.map((model, index) => (
                  <div
                    key={model.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ModelCard model={model} viewMode={viewMode} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Info Section */}
        <div className="glass-strong rounded-2xl border border-slate-700/50 p-6 animate-fade-in-up" style={{ animationDelay: "300ms" }}>
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-400" />
            About Model Caching
          </h3>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <p>
                <strong className="text-green-400">Downloaded Models:</strong> These models are already cached in your
                HuggingFace directory (~/.cache/huggingface) and will start training immediately without any download
                wait time.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Download className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <p>
                <strong className="text-orange-400">Available Models:</strong> These models will be automatically
                downloaded when you start your first training job. Download time depends on model size and internet
                speed.
              </p>
            </div>
            <div className="flex items-start gap-3 bg-primary-500/5 border border-primary-500/20 rounded-lg p-3">
              <TrendingUp className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
              <p className="text-slate-400">
                <strong className="text-primary-400">💡 Pro Tip:</strong> Downloaded models are shared across all
                training jobs, so you only need to download them once. Choose models based on your GPU VRAM capacity for
                optimal performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
