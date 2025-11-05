/**
 * Modern Dashboard Page
 * Real-time training monitoring with animated metrics and visual timeline
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Download,
  TestTube,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  Play,
  Pause,
  AlertCircle,
  Calendar,
  Timer,
  Target,
} from "lucide-react";
import toast from "react-hot-toast";

import { api } from "../../services/api";
import type { TrainingStatusResponse, JobStatus } from "../../types/api";

// ==========================
// Types & Constants
// ==========================

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
  trend?: "up" | "down" | "neutral";
}

interface TimelineEvent {
  time: string;
  title: string;
  description: string;
  type: "info" | "success" | "warning" | "error";
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: "yellow",
    gradient: "from-yellow-500 to-amber-500",
    bgClass: "bg-yellow-500/10",
    borderClass: "border-yellow-500/30",
    textClass: "text-yellow-400",
    glowClass: "shadow-glow-yellow",
  },
  running: {
    icon: Zap,
    color: "blue",
    gradient: "from-blue-500 to-cyan-500",
    bgClass: "bg-blue-500/10",
    borderClass: "border-blue-500/30",
    textClass: "text-blue-400",
    glowClass: "shadow-glow",
  },
  completed: {
    icon: CheckCircle,
    color: "green",
    gradient: "from-green-500 to-emerald-500",
    bgClass: "bg-green-500/10",
    borderClass: "border-green-500/30",
    textClass: "text-green-400",
    glowClass: "shadow-glow-green",
  },
  failed: {
    icon: XCircle,
    color: "red",
    gradient: "from-red-500 to-rose-500",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/30",
    textClass: "text-red-400",
    glowClass: "shadow-glow-red",
  },
} as const;

// ==========================
// Animated Counter Component
// ==========================

function AnimatedCounter({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(easeOut * value);

      if (current !== countRef.current) {
        countRef.current = current;
        setCount(current);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{count}</span>;
}

// ==========================
// Metric Card Component
// ==========================

function MetricCard({ title, value, change, icon, color, trend = "neutral" }: MetricCardProps) {
  const colorClasses = {
    blue: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
    green: "from-green-500/20 to-emerald-500/20 border-green-500/30",
    purple: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
    orange: "from-orange-500/20 to-yellow-500/20 border-orange-500/30",
    red: "from-red-500/20 to-rose-500/20 border-red-500/30",
  };

  const iconColorClasses = {
    blue: "bg-gradient-to-br from-blue-500 to-cyan-500",
    green: "bg-gradient-to-br from-green-500 to-emerald-500",
    purple: "bg-gradient-to-br from-purple-500 to-pink-500",
    orange: "bg-gradient-to-br from-orange-500 to-yellow-500",
    red: "bg-gradient-to-br from-red-500 to-rose-500",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${
        colorClasses[color as keyof typeof colorClasses]
      } backdrop-blur-xl border p-6 hover-lift transition-all duration-300 group`}
    >
      {/* Shimmer Effect */}
      <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-slate-400 text-sm font-medium mb-2">{title}</p>
          <p className="text-3xl font-bold text-white mb-2">
            {typeof value === "number" ? <AnimatedCounter value={value} /> : value}
          </p>

          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              {trend === "up" && <TrendingUp className="w-4 h-4 text-green-400" />}
              {trend === "down" && <TrendingDown className="w-4 h-4 text-red-400" />}
              <span
                className={`text-sm font-medium ${
                  trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-slate-400"
                }`}
              >
                {change > 0 ? "+" : ""}
                {change}%
              </span>
            </div>
          )}
        </div>

        <div
          className={`w-14 h-14 rounded-xl ${
            iconColorClasses[color as keyof typeof iconColorClasses]
          } flex items-center justify-center animate-glow-pulse`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ==========================
// Mini Line Chart Component
// ==========================

function MiniLineChart({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 40" className="w-full h-16" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={`var(--${color}-500)`}
        strokeWidth="2"
        className="animate-draw-line"
      />
      <polyline points={points} fill={`url(#gradient-${color})`} opacity="0.2" />
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={`var(--${color}-500)`} stopOpacity="0.5" />
          <stop offset="100%" stopColor={`var(--${color}-500)`} stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// ==========================
// Timeline Component
// ==========================

function Timeline({ events }: { events: TimelineEvent[] }) {
  const typeConfig = {
    info: { icon: Activity, color: "blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
    success: { icon: CheckCircle, color: "green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
    warning: { icon: AlertCircle, color: "yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
    error: { icon: XCircle, color: "red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
  };

  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const config = typeConfig[event.type];
        const Icon = config.icon;

        return (
          <div key={index} className="flex gap-4 group animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
            {/* Timeline Line */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full ${config.bg} border ${config.border} flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-200`}
              >
                <Icon className={`w-5 h-5 text-${config.color}`} />
              </div>
              {index < events.length - 1 && (
                <div className={`w-0.5 h-full ${config.bg} flex-1 mt-2`} />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-6">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-slate-400">{event.time}</span>
              </div>
              <h4 className="text-white font-semibold mb-1">{event.title}</h4>
              <p className="text-slate-400 text-sm">{event.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==========================
// Main Dashboard Component
// ==========================

export function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialJobId = location.state?.jobId as string | undefined;

  // State
  const [jobId, setJobId] = useState<string>(initialJobId || "");
  const [jobStatus, setJobStatus] = useState<TrainingStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [lossHistory, setLossHistory] = useState<number[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [recentJobs, setRecentJobs] = useState<TrainingStatusResponse[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [globalStats, setGlobalStats] = useState({
    total_jobs: 0,
    active_jobs: 0,
    completed_jobs: 0,
    total_datasets: 0,
  });

  // Fetch job status
  const fetchStatus = useCallback(async (id: string) => {
    if (!id) return;

    try {
      const status = await api.job.getTrainingStatus(id);
      setJobStatus(status);

      // Update loss history
      if (status.meta?.train_loss !== undefined) {
        setLossHistory((prev) => [...prev.slice(-19), status.meta!.train_loss!]);
      }

      // Add timeline event
      const timestamp = new Date().toLocaleTimeString();
      if (status.status === "completed" && !timelineEvents.some((e) => e.type === "success")) {
        setTimelineEvents((prev) => [
          ...prev,
          {
            time: timestamp,
            title: "Training Completed",
            description: status.message,
            type: "success",
          },
        ]);
      } else if (status.status === "failed" && !timelineEvents.some((e) => e.type === "error")) {
        setTimelineEvents((prev) => [
          ...prev,
          {
            time: timestamp,
            title: "Training Failed",
            description: status.message,
            type: "error",
          },
        ]);
      } else if (status.status === "running" && timelineEvents.length === 0) {
        setTimelineEvents([
          {
            time: timestamp,
            title: "Training Started",
            description: "Model training has begun",
            type: "info",
          },
        ]);
      }

      // Stop polling if job is completed or failed
      if (status.status === "completed" || status.status === "failed") {
        setPolling(false);
        if (status.status === "completed") {
          toast.success("Training completed successfully!");
        } else {
          toast.error("Training failed: " + status.message);
        }
      }
    } catch (error) {
      console.error("Failed to fetch status:", error);
      setPolling(false);
      toast.error("Failed to fetch job status");
    }
  }, [timelineEvents]);

  // Load global statistics
  const loadGlobalStats = useCallback(async () => {
    try {
      const metrics = await api.health.getMetrics();
      setGlobalStats({
        total_jobs: metrics.total_jobs,
        active_jobs: metrics.active_jobs,
        completed_jobs: metrics.completed_jobs,
        total_datasets: metrics.total_datasets,
      });
    } catch (error) {
      console.error("Failed to load global stats:", error);
    }
  }, []);

  // Load recent jobs
  const loadRecentJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const response = await api.job.getAllJobs();
      // Sort by created_at descending and take last 10
      const sorted = response.jobs.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 10);
      setRecentJobs(sorted);
    } catch (error) {
      console.error("Failed to load recent jobs:", error);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  // Initial fetch and auto-polling
  useEffect(() => {
    // Load recent jobs on mount
    loadRecentJobs();
    
    if (jobId) {
      setLoading(true);
      fetchStatus(jobId).finally(() => setLoading(false));

      // Start polling if it's a new job
      if (location.state?.newJob) {
        setPolling(true);
      }
    }
  }, [jobId, fetchStatus, location.state?.newJob, loadRecentJobs]);

  // Polling interval
  useEffect(() => {
    if (!polling || !jobId) return;

    const interval = setInterval(() => {
      fetchStatus(jobId);
    }, 3000);

    return () => clearInterval(interval);
  }, [polling, jobId, fetchStatus]);

  const handleRefresh = () => {
    if (jobId) {
      setLoading(true);
      fetchStatus(jobId).finally(() => setLoading(false));
    }
  };

  const handleTogglePolling = () => {
    setPolling(!polling);
  };

  const handleDownload = async () => {
    if (!jobStatus || jobStatus.status !== "completed") return;

    setDownloading(true);
    try {
      const blob = await api.job.downloadModel(jobStatus.job_id);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `model_${jobStatus.job_id}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Model downloaded successfully!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download model");
    } finally {
      setDownloading(false);
    }
  };

  const handleTestModel = () => {
    if (jobStatus && jobStatus.status === "completed") {
      navigate("/inference", { state: { jobId: jobStatus.job_id } });
    }
  };

  const handleManualJobId = (e: React.FormEvent) => {
    e.preventDefault();
    if (jobId) {
      setLoading(true);
      setLossHistory([]);
      setTimelineEvents([]);
      fetchStatus(jobId).finally(() => setLoading(false));
    }
  };

  const statusConfig = jobStatus ? STATUS_CONFIG[jobStatus.status] : null;
  const StatusIcon = statusConfig?.icon;

  return (
    <div className="min-h-screen p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 animate-glow-pulse">
          <Activity className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-gradient-primary animate-fade-in-up">Training Dashboard</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          Monitor your fine-tuning jobs with real-time metrics and insights
        </p>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Global Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          <MetricCard
            title="Total Jobs"
            value={globalStats.total_jobs}
            icon={<Activity className="w-7 h-7 text-white" />}
            color="blue"
          />
          <MetricCard
            title="Active Jobs"
            value={globalStats.active_jobs}
            icon={<Zap className="w-7 h-7 text-white" />}
            color="orange"
          />
          <MetricCard
            title="Completed Jobs"
            value={globalStats.completed_jobs}
            icon={<CheckCircle className="w-7 h-7 text-white" />}
            color="green"
          />
          <MetricCard
            title="Total Datasets"
            value={globalStats.total_datasets}
            icon={<Target className="w-7 h-7 text-white" />}
            color="purple"
          />
        </div>

        {/* Job ID Input */}
        {!initialJobId && (
          <div
            className="glass-strong rounded-2xl border border-slate-700/50 p-6 animate-fade-in-up"
            style={{ animationDelay: "200ms" }}
          >
            <form onSubmit={handleManualJobId} className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  placeholder="Enter Job ID to monitor"
                  className="w-full px-6 py-4 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={!jobId || loading}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 text-white font-semibold hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:scale-105 active:scale-95"
              >
                {loading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Check Status
                    <ArrowRight className="w-5 h-5" />
                  </span>
                )}
              </button>
            </form>

            {/* Recent Jobs List */}
            {recentJobs.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-400" />
                  Recent Jobs
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recentJobs.map((job) => (
                    <button
                      key={job.job_id}
                      onClick={() => {
                        setJobId(job.job_id);
                        setLoading(true);
                        setLossHistory([]);
                        setTimelineEvents([]);
                        fetchStatus(job.job_id).finally(() => setLoading(false));
                      }}
                      className="group text-left p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:bg-slate-700/50 hover:border-primary-500/50 transition-all hover-lift"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            job.status === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : job.status === "failed"
                              ? "bg-red-500/20 text-red-400"
                              : job.status === "running"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {job.status === "completed" ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : job.status === "failed" ? (
                            <XCircle className="w-4 h-4" />
                          ) : job.status === "running" ? (
                            <Zap className="w-4 h-4 animate-pulse" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            job.status === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : job.status === "failed"
                              ? "bg-red-500/20 text-red-400"
                              : job.status === "running"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                      <p className="text-white font-mono text-xs mb-1 truncate group-hover:text-primary-400 transition-colors">
                        {job.job_id}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(job.created_at).toLocaleString()}
                      </p>
                      {job.progress > 0 && (
                        <div className="mt-2">
                          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                job.status === "completed"
                                  ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                  : job.status === "running"
                                  ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                                  : "bg-gradient-to-r from-red-500 to-rose-500"
                              }`}
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loadingJobs && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-slate-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Loading recent jobs...
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && !jobStatus && (
          <div className="glass-strong rounded-2xl border border-slate-700/50 p-12 animate-fade-in-up">
            <div className="text-center space-y-4">
              <div className="animate-spin w-16 h-16 border-4 border-primary-500/30 border-t-primary-500 rounded-full mx-auto" />
              <p className="text-slate-400 text-lg">Loading job status...</p>
            </div>
          </div>
        )}

        {/* Job Status Content */}
        {jobStatus && statusConfig && (
          <>
            {/* Status Hero Card */}
            <div
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${statusConfig.bgClass} backdrop-blur-xl border ${statusConfig.borderClass} p-8 animate-fade-in-up`}
              style={{ animationDelay: "300ms" }}
            >
              <div className="absolute inset-0 shimmer opacity-30" />

              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-start gap-6 flex-1">
                  {StatusIcon && (
                    <div
                      className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${statusConfig.gradient} flex items-center justify-center ${statusConfig.glowClass} animate-glow-pulse`}
                    >
                      <StatusIcon className="w-10 h-10 text-white" />
                    </div>
                  )}

                  <div className="flex-1 space-y-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-3xl font-bold text-white">
                          {jobStatus.status.charAt(0).toUpperCase() + jobStatus.status.slice(1)}
                        </h2>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.bgClass} ${statusConfig.borderClass} ${statusConfig.textClass}`}
                        >
                          {jobStatus.status}
                        </span>
                      </div>
                      <p className="text-slate-300 text-lg">{jobStatus.message}</p>
                    </div>

                    {/* Progress Bar with Percentage */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400 font-medium">Training Progress</span>
                        <span className="text-white font-bold">{jobStatus.progress}%</span>
                      </div>
                      <div className="h-3 bg-slate-800/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${statusConfig.gradient} rounded-full transition-all duration-500 relative overflow-hidden`}
                          style={{ width: `${jobStatus.progress}%` }}
                        >
                          <div className="absolute inset-0 shimmer" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleRefresh}
                    disabled={loading}
                    className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-all hover-lift disabled:opacity-50"
                    title="Refresh"
                  >
                    <RefreshCw className={`w-5 h-5 text-slate-400 ${loading ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    onClick={handleTogglePolling}
                    className={`p-3 rounded-xl border transition-all hover-lift ${
                      polling
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-slate-800/50 border-slate-700/50 text-slate-400"
                    }`}
                    title={polling ? "Stop Auto-Refresh" : "Start Auto-Refresh"}
                  >
                    {polling ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
              <MetricCard
                title="Current Epoch"
                value={jobStatus.meta?.current_epoch || 0}
                icon={<Target className="w-7 h-7 text-white" />}
                color="blue"
              />
              <MetricCard
                title="Training Loss"
                value={jobStatus.meta?.train_loss?.toFixed(4) || "N/A"}
                icon={<TrendingDown className="w-7 h-7 text-white" />}
                color="green"
                trend="down"
                change={-12}
              />
              <MetricCard
                title="Eval Loss"
                value={jobStatus.meta?.eval_loss?.toFixed(4) || "N/A"}
                icon={<Activity className="w-7 h-7 text-white" />}
                color="purple"
              />
              <MetricCard
                title="Elapsed Time"
                value={
                  jobStatus.created_at
                    ? `${Math.floor((Date.now() - new Date(jobStatus.created_at).getTime()) / 60000)}m`
                    : "N/A"
                }
                icon={<Timer className="w-7 h-7 text-white" />}
                color="orange"
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Training Details & Metrics */}
              <div className="lg:col-span-2 space-y-6">
                {/* Job Details Card */}
                <div
                  className="glass-strong rounded-2xl border border-slate-700/50 p-6 animate-fade-in-up"
                  style={{ animationDelay: "500ms" }}
                >
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary-400" />
                    Job Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                      <p className="text-sm text-slate-400 mb-1">Job ID</p>
                      <p className="text-white font-mono text-sm break-all">{jobStatus.job_id}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                      <p className="text-sm text-slate-400 mb-1">Dataset ID</p>
                      <p className="text-white font-mono text-sm break-all">{jobStatus.dataset_id}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                      <p className="text-sm text-slate-400 mb-1">Created At</p>
                      <p className="text-white text-sm">{new Date(jobStatus.created_at).toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                      <p className="text-sm text-slate-400 mb-1">Last Updated</p>
                      <p className="text-white text-sm">{new Date(jobStatus.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Training Parameters Card */}
                {jobStatus.meta && Object.keys(jobStatus.meta).length > 0 && (
                  <div
                    className="glass-strong rounded-2xl border border-slate-700/50 p-6 animate-fade-in-up"
                    style={{ animationDelay: "600ms" }}
                  >
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary-400" />
                      Training Parameters
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {jobStatus.meta.model_name && (
                        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-4">
                          <p className="text-xs text-slate-400 mb-2">Model</p>
                          <p className="text-white font-semibold">{jobStatus.meta.model_name}</p>
                        </div>
                      )}
                      {jobStatus.meta.learning_rate !== undefined && (
                        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-4">
                          <p className="text-xs text-slate-400 mb-2">Learning Rate</p>
                          <p className="text-white font-semibold">{jobStatus.meta.learning_rate}</p>
                        </div>
                      )}
                      {jobStatus.meta.num_epochs !== undefined && (
                        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-4">
                          <p className="text-xs text-slate-400 mb-2">Total Epochs</p>
                          <p className="text-white font-semibold">{jobStatus.meta.num_epochs}</p>
                        </div>
                      )}
                      {jobStatus.meta.batch_size !== undefined && (
                        <div className="bg-gradient-to-br from-orange-500/10 to-yellow-500/10 border border-orange-500/30 rounded-xl p-4">
                          <p className="text-xs text-slate-400 mb-2">Batch Size</p>
                          <p className="text-white font-semibold">{jobStatus.meta.batch_size}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Loss Chart */}
                {lossHistory.length > 0 && (
                  <div
                    className="glass-strong rounded-2xl border border-slate-700/50 p-6 animate-fade-in-up"
                    style={{ animationDelay: "700ms" }}
                  >
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-primary-400" />
                      Training Loss History
                    </h3>
                    <MiniLineChart data={lossHistory} color="primary" />
                  </div>
                )}
              </div>

              {/* Right Column - Timeline */}
              <div className="space-y-6">
                <div
                  className="glass-strong rounded-2xl border border-slate-700/50 p-6 animate-fade-in-up"
                  style={{ animationDelay: "800ms" }}
                >
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary-400" />
                    Activity Timeline
                  </h3>
                  {timelineEvents.length > 0 ? (
                    <Timeline events={timelineEvents} />
                  ) : (
                    <p className="text-slate-400 text-center py-8">No events yet</p>
                  )}
                </div>

                {/* Auto-Refresh Indicator */}
                {polling && (
                  <div className="glass rounded-xl border border-green-500/30 p-4 animate-fade-in-up">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <p className="text-sm text-slate-300">Auto-refreshing every 3 seconds</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons for Completed Jobs */}
            {jobStatus.status === "completed" && (
              <div className="flex gap-4 animate-fade-in-up" style={{ animationDelay: "900ms" }}>
                <button
                  onClick={handleTestModel}
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 text-white font-semibold hover:shadow-glow transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <TestTube className="w-5 h-5" />
                  Test Model in Inference
                </button>
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex-1 flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-slate-700 to-slate-600 text-white font-semibold hover:shadow-glow-accent transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {downloading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download Model
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* No Job Selected State */}
        {!jobId && !initialJobId && (
          <div className="glass-strong rounded-2xl border border-slate-700/50 p-12 text-center animate-fade-in-up">
            <div className="max-w-md mx-auto space-y-6">
              <div className="w-20 h-20 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mx-auto">
                <Activity className="w-10 h-10 text-slate-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">No Job Selected</h3>
                <p className="text-slate-400">Enter a job ID above or start a new training session</p>
              </div>
              <button
                onClick={() => navigate("/upload")}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 text-white font-semibold hover:shadow-glow transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Start New Training
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
