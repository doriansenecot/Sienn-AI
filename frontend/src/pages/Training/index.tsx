/**
 * Training Configuration Page
 * Configure hyperparameters for fine-tuning
 */
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Settings, Zap } from "lucide-react";
import toast from "react-hot-toast";

import { Card, CardHeader, CardTitle, CardContent, Input, Button } from "../../components/ui";
import { api } from "../../services/api";
import type { StartFinetuningRequest } from "../../types/api";

export function TrainingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const datasetId = location.state?.datasetId as string | undefined;

  const [config, setConfig] = useState<StartFinetuningRequest>({
    dataset_id: datasetId || "",
    model_name: "gpt2",
    learning_rate: 2e-4,
    num_epochs: 3,
    batch_size: 4,
    max_length: 512,
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!datasetId) {
      toast.error("No dataset selected. Please upload a dataset first.");
      setTimeout(() => navigate("/upload"), 2000);
    }
  }, [datasetId, navigate]);

  const handleChange = (field: keyof StartFinetuningRequest, value: string | number) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!config.dataset_id) {
      toast.error("Dataset ID is required");
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.job.startFinetuning(config);
      toast.success("Training job started successfully!");

      // Navigate to dashboard with job_id
      navigate("/dashboard", {
        state: {
          jobId: result.job_id,
          newJob: true,
        },
      });
    } catch (error) {
      console.error("Failed to start training:", error);
      // Error already handled by axios interceptor
    } finally {
      setSubmitting(false);
    }
  };

  if (!datasetId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-xl shadow-lg p-8 text-center">
          <p className="text-slate-400">Redirecting to upload page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 animate-glow">
          <Settings className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent">
          Configure Training
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Set up your fine-tuning parameters. These settings control how your model will be trained.
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dataset Info */}
          <Card variant="frosted">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Dataset ID</p>
                <p className="text-white font-mono text-sm">{config.dataset_id}</p>
              </div>
            </div>
          </Card>

          {/* Configuration Form */}
          <Card>
            <CardHeader>
              <CardTitle>Model & Hyperparameters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {/* Model Name */}
                <Input
                  label="Base Model"
                  value={config.model_name}
                  onChange={(e) => handleChange("model_name", e.target.value)}
                  placeholder="e.g., gpt2, gpt2-medium, distilgpt2"
                  helperText="The base model to fine-tune. Must be available on HuggingFace."
                  required
                  fullWidth
                />

                {/* Learning Rate */}
                <Input
                  label="Learning Rate"
                  type="number"
                  step="0.00001"
                  value={config.learning_rate}
                  onChange={(e) => handleChange("learning_rate", parseFloat(e.target.value))}
                  helperText="Controls how quickly the model adapts. Typical: 1e-4 to 5e-4"
                  required
                  fullWidth
                />

                {/* Number of Epochs */}
                <Input
                  label="Number of Epochs"
                  type="number"
                  min="1"
                  max="20"
                  value={config.num_epochs}
                  onChange={(e) => handleChange("num_epochs", parseInt(e.target.value))}
                  helperText="How many times to iterate over the dataset. Typical: 1-5"
                  required
                  fullWidth
                />

                {/* Batch Size */}
                <Input
                  label="Batch Size"
                  type="number"
                  min="1"
                  max="64"
                  value={config.batch_size}
                  onChange={(e) => handleChange("batch_size", parseInt(e.target.value))}
                  helperText="Number of samples processed together. Larger = faster but more memory"
                  required
                  fullWidth
                />

                {/* Max Length */}
                <Input
                  label="Max Token Length"
                  type="number"
                  min="128"
                  max="2048"
                  step="128"
                  value={config.max_length}
                  onChange={(e) => handleChange("max_length", parseInt(e.target.value))}
                  helperText="Maximum sequence length. Longer = more context but slower"
                  required
                  fullWidth
                />
              </div>
            </CardContent>
          </Card>

          {/* Advanced Tips */}
          <Card variant="frosted">
            <h4 className="text-sm font-bold text-white mb-3">💡 Training Tips</h4>
            <ul className="text-sm text-slate-400 space-y-2">
              <li>
                <strong className="text-slate-300">For small datasets (&lt;100 samples):</strong> Use 3-5 epochs, lower
                learning rate (1e-5)
              </li>
              <li>
                <strong className="text-slate-300">For large datasets (&gt;1000 samples):</strong> Use 1-2 epochs,
                higher batch size
              </li>
              <li>
                <strong className="text-slate-300">Memory constraints:</strong> Reduce batch_size or max_length if you
                encounter OOM errors
              </li>
              <li>
                <strong className="text-slate-300">Training time:</strong> Depends on dataset size, epochs, and
                hardware. Typical: 5-30 minutes
              </li>
            </ul>
          </Card>

          {/* Actions */}
          <div className="flex justify-between gap-4">
            <Button type="button" variant="secondary" onClick={() => navigate("/upload")} disabled={submitting}>
              ← Back to Upload
            </Button>
            <Button type="submit" variant="primary" loading={submitting} icon={<Zap className="w-4 h-4" />}>
              Start Training
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
