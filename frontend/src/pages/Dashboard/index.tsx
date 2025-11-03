/**
 * Dashboard Page
 * Monitor training jobs with real-time status updates
 */
import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Zap,
  Download,
  TestTube
} from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  ProgressBar,
  Button 
} from '../../components/ui';
import { api } from '../../services/api';
import type { TrainingStatusResponse, JobStatus } from '../../types/api';

const STATUS_ICONS: Record<JobStatus, React.ReactNode> = {
  pending: <Clock className="w-5 h-5 text-yellow-400" />,
  running: <Zap className="w-5 h-5 text-blue-400 animate-pulse" />,
  completed: <CheckCircle className="w-5 h-5 text-green-400" />,
  failed: <XCircle className="w-5 h-5 text-red-400" />,
};

const STATUS_COLORS: Record<JobStatus, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const PROGRESS_VARIANTS: Record<JobStatus, 'default' | 'success' | 'warning' | 'danger'> = {
  pending: 'warning',
  running: 'default',
  completed: 'success',
  failed: 'danger',
};

export function DashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialJobId = location.state?.jobId as string | undefined;

  const [jobId, setJobId] = useState<string>(initialJobId || '');
  const [jobStatus, setJobStatus] = useState<TrainingStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [polling, setPolling] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Fetch job status
  const fetchStatus = useCallback(async (id: string) => {
    if (!id) return;
    
    try {
      const status = await api.job.getTrainingStatus(id);
      setJobStatus(status);

      // Stop polling if job is completed or failed
      if (status.status === 'completed' || status.status === 'failed') {
        setPolling(false);
        if (status.status === 'completed') {
          toast.success('Training completed successfully!');
        } else {
          toast.error('Training failed: ' + status.message);
        }
      }
    } catch (error) {
      console.error('Failed to fetch status:', error);
      setPolling(false);
    }
  }, []);

  // Initial fetch and auto-polling
  useEffect(() => {
    if (jobId) {
      setLoading(true);
      fetchStatus(jobId).finally(() => setLoading(false));
      
      // Start polling if it's a new job
      if (location.state?.newJob) {
        setPolling(true);
      }
    }
  }, [jobId, fetchStatus, location.state?.newJob]);

  // Polling interval
  useEffect(() => {
    if (!polling || !jobId) return;

    const interval = setInterval(() => {
      fetchStatus(jobId);
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [polling, jobId, fetchStatus]);

  const handleRefresh = () => {
    if (jobId) {
      setLoading(true);
      fetchStatus(jobId).finally(() => setLoading(false));
    }
  };

  const handleDownload = async () => {
    if (!jobStatus || jobStatus.status !== 'completed') return;

    setDownloading(true);
    try {
      const blob = await api.job.downloadModel(jobStatus.job_id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `model_${jobStatus.job_id}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Model downloaded successfully!');
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleTestModel = () => {
    if (jobStatus && jobStatus.status === 'completed') {
      navigate('/inference', { state: { jobId: jobStatus.job_id } });
    }
  };

  const handleManualJobId = (e: React.FormEvent) => {
    e.preventDefault();
    if (jobId) {
      setLoading(true);
      fetchStatus(jobId).finally(() => setLoading(false));
    }
  };

  return (
    <div className="min-h-screen p-8 space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 animate-glow">
          <Activity className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent">
          Training Dashboard
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Monitor your fine-tuning jobs in real-time
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Job ID Input */}
        {!initialJobId && (
          <Card>
            <CardContent>
              <form onSubmit={handleManualJobId} className="flex gap-3">
                <input
                  type="text"
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  placeholder="Enter Job ID"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
                <Button type="submit" variant="primary" disabled={!jobId || loading}>
                  Check Status
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && !jobStatus && (
          <Card>
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full mx-auto" />
                <p className="text-slate-400">Loading job status...</p>
              </div>
            </div>
          </Card>
        )}

        {/* Job Status Card */}
        {jobStatus && (
          <>
            {/* Status Overview */}
            <Card className="border-2 border-slate-700/50">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${STATUS_COLORS[jobStatus.status].split(' ')[0]}`}>
                    {STATUS_ICONS[jobStatus.status]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-2xl font-bold text-white">
                        {jobStatus.status.charAt(0).toUpperCase() + jobStatus.status.slice(1)}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[jobStatus.status]}`}>
                        {jobStatus.status}
                      </span>
                    </div>
                    <p className="text-slate-400 mb-3">{jobStatus.message}</p>
                    
                    {/* Progress Bar */}
                    <ProgressBar
                      value={jobStatus.progress}
                      variant={PROGRESS_VARIANTS[jobStatus.status]}
                      label="Training Progress"
                      showPercentage
                    />
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  Refresh
                </Button>
              </div>
            </Card>

            {/* Job Details */}
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-slate-400">Job ID</p>
                    <p className="text-white font-mono text-sm">{jobStatus.job_id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-400">Dataset ID</p>
                    <p className="text-white font-mono text-sm">{jobStatus.dataset_id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-400">Created At</p>
                    <p className="text-white text-sm">
                      {new Date(jobStatus.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-400">Last Updated</p>
                    <p className="text-white text-sm">
                      {new Date(jobStatus.updated_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Training Metadata */}
            {jobStatus.meta && Object.keys(jobStatus.meta).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Training Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {jobStatus.meta.model_name && (
                      <div className="bg-slate-800/70 backdrop-blur-lg border border-slate-700 rounded-xl p-3 space-y-1">
                        <p className="text-xs text-slate-400">Model Name</p>
                        <p className="text-white font-medium">{jobStatus.meta.model_name}</p>
                      </div>
                    )}
                    {jobStatus.meta.learning_rate !== undefined && (
                      <div className="bg-slate-800/70 backdrop-blur-lg border border-slate-700 rounded-xl p-3 space-y-1">
                        <p className="text-xs text-slate-400">Learning Rate</p>
                        <p className="text-white font-medium">{jobStatus.meta.learning_rate}</p>
                      </div>
                    )}
                    {jobStatus.meta.num_epochs !== undefined && (
                      <div className="bg-slate-800/70 backdrop-blur-lg border border-slate-700 rounded-xl p-3 space-y-1">
                        <p className="text-xs text-slate-400">Epochs</p>
                        <p className="text-white font-medium">
                          {jobStatus.meta.current_epoch || 0} / {jobStatus.meta.num_epochs}
                        </p>
                      </div>
                    )}
                    {jobStatus.meta.batch_size !== undefined && (
                      <div className="bg-slate-800/70 backdrop-blur-lg border border-slate-700 rounded-xl p-3 space-y-1">
                        <p className="text-xs text-slate-400">Batch Size</p>
                        <p className="text-white font-medium">{jobStatus.meta.batch_size}</p>
                      </div>
                    )}
                    {jobStatus.meta.train_loss !== undefined && (
                      <div className="bg-slate-800/70 backdrop-blur-lg border border-slate-700 rounded-xl p-3 space-y-1">
                        <p className="text-xs text-slate-400">Training Loss</p>
                        <p className="text-white font-medium">{jobStatus.meta.train_loss.toFixed(4)}</p>
                      </div>
                    )}
                    {jobStatus.meta.eval_loss !== undefined && (
                      <div className="bg-slate-800/70 backdrop-blur-lg border border-slate-700 rounded-xl p-3 space-y-1">
                        <p className="text-xs text-slate-400">Eval Loss</p>
                        <p className="text-white font-medium">{jobStatus.meta.eval_loss.toFixed(4)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions for completed jobs */}
            {jobStatus.status === 'completed' && (
              <div className="flex gap-4">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleTestModel}
                  icon={<TestTube className="w-4 h-4" />}
                >
                  Test Model
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={handleDownload}
                  loading={downloading}
                  icon={<Download className="w-4 h-4" />}
                >
                  Download Model
                </Button>
              </div>
            )}

            {/* Polling Indicator */}
            {polling && (
              <Card variant="frosted">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  <p className="text-slate-300">
                    Auto-refreshing every 3 seconds...
                  </p>
                </div>
              </Card>
            )}
          </>
        )}

        {/* No Job Selected */}
        {!jobId && !initialJobId && (
          <Card variant="frosted">
            <div className="text-center py-12">
              <p className="text-slate-400 mb-4">No job selected</p>
              <Button variant="primary" onClick={() => navigate('/upload')}>
                Start New Training
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
