/**
 * Modern Training Configuration Page
 * Wizard-style interface with visual parameter tuning
 */
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Settings, 
  Play, 
  AlertCircle, 
  Upload, 
  Sparkles,
  Brain,
  Zap,
  Clock,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Database,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';

import ModelSelector from '../../components/ModelSelector';
import DatasetSelector from '../../components/DatasetSelector';
import { api } from '../../services/api';
import type { StartFinetuningRequest } from '../../types/api';

type Step = 1 | 2 | 3;

export function TrainingConfigPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialDatasetId = location.state?.datasetId;

  const [currentStep, setCurrentStep] = useState<Step>(initialDatasetId ? 2 : 1);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(initialDatasetId || null);
  const [selectedModel, setSelectedModel] = useState('gpt2');
  const [numEpochs, setNumEpochs] = useState(3);
  const [learningRate, setLearningRate] = useState(0.00002);
  const [batchSize, setBatchSize] = useState(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate estimated time based on parameters
  const estimatedMinutes = Math.ceil((numEpochs * 5) + (batchSize * 2));
  const estimatedCost = 'Free'; // For display purposes

  const steps = [
    { number: 1, title: 'Select Dataset', icon: Database },
    { number: 2, title: 'Choose Model', icon: Brain },
    { number: 3, title: 'Configure', icon: Settings },
  ];

  const handleStartTraining = async () => {
    if (!selectedDatasetId) {
      toast.error('Please select a dataset');
      return;
    }

    setIsSubmitting(true);
    try {
      const request: StartFinetuningRequest = {
        dataset_id: selectedDatasetId,
        model_name: selectedModel,
        num_epochs: numEpochs,
        learning_rate: learningRate,
        batch_size: batchSize,
        max_length: undefined,
      };

      const result = await api.job.startFinetuning(request);
      toast.success('Training job started successfully!');
      navigate('/dashboard', { state: { jobId: result.job_id, newJob: true } });
    } catch (error) {
      console.error('Failed to start training:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = (step: Step): boolean => {
    if (step === 1) return !!selectedDatasetId;
    if (step === 2) return !!selectedModel;
    return true;
  };

  const nextStep = () => {
    if (currentStep < 3 && canProceed(currentStep)) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  return (
    <div className="relative min-h-screen p-4 sm:p-8 space-y-8">
      {/* Grain Overlay */}
      <div className="grain-overlay" />

      {/* Header */}
      <div className="text-center space-y-4 relative z-10 animate-fade-in-up">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 via-secondary-500 to-accent-500 shadow-2xl shadow-primary-500/50 animate-glow-pulse">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gradient bg-[length:200%_auto] animate-gradient-x">
          Configure Training
        </h1>
        <p className="text-dark-300 max-w-2xl mx-auto text-lg">
          Follow the wizard to set up your model training with optimal parameters
        </p>
      </div>

      {/* Progress Steps */}
      <div className="max-w-3xl mx-auto relative z-10">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = currentStep > step.number;
            const isCurrent = currentStep === step.number;
            
            return (
              <div key={step.number} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  {/* Step circle */}
                  <button
                    onClick={() => {
                      if (step.number < currentStep || canProceed(step.number as Step)) {
                        setCurrentStep(step.number as Step);
                      }
                    }}
                    disabled={step.number > currentStep && !canProceed((step.number - 1) as Step)}
                    className={`
                      relative w-14 h-14 rounded-xl flex items-center justify-center
                      transition-all duration-300 transform
                      ${isCompleted 
                        ? 'bg-gradient-to-br from-success-600 to-success-500 shadow-lg shadow-success-500/50 scale-100' 
                        : isCurrent
                        ? 'bg-gradient-to-br from-primary-600 to-primary-500 shadow-xl shadow-primary-500/50 scale-110 animate-glow-pulse'
                        : 'bg-dark-800/50 border-2 border-white/10 scale-95'
                      }
                      ${step.number <= currentStep ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-50'}
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    ) : (
                      <Icon className={`w-6 h-6 ${isCurrent ? 'text-white' : 'text-dark-400'}`} />
                    )}
                  </button>
                  
                  {/* Step label */}
                  <span className={`
                    mt-3 text-sm font-medium transition-colors hidden sm:block
                    ${isCurrent ? 'text-white' : 'text-dark-400'}
                  `}>
                    {step.title}
                  </span>
                </div>
                
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className={`
                    h-1 flex-1 mx-2 rounded-full transition-all duration-500
                    ${isCompleted 
                      ? 'bg-gradient-to-r from-success-500 to-success-400' 
                      : 'bg-dark-800/50'
                    }
                  `} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="glass-strong rounded-3xl p-8 border border-white/10 min-h-[500px] animate-fade-in-up">
          {/* Step 1: Dataset Selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Select Your Dataset</h2>
                <p className="text-dark-400">Choose the dataset you want to use for training</p>
              </div>

              <DatasetSelector
                selectedDatasetId={selectedDatasetId}
                onDatasetChange={setSelectedDatasetId}
              />

              <div className="pt-4 text-center">
                <p className="text-sm text-dark-400 mb-4">or</p>
                <button
                  onClick={() => navigate('/upload')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/5 text-dark-200 hover:bg-white/10 hover:text-white font-medium transition-all duration-200 border border-white/10 hover:border-white/20"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload New Dataset</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Model Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Choose Your Model</h2>
                <p className="text-dark-400">Select a base model to fine-tune</p>
              </div>

              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
              />

              <div className="glass rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-dark-300">
                  <strong className="text-white">Auto-Configuration:</strong> Model-specific parameters 
                  (learning rate, batch size) will be automatically optimized. You can customize them in the next step.
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Parameters Configuration */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Fine-Tune Parameters</h2>
                <p className="text-dark-400">Customize training parameters for optimal results</p>
              </div>

              {/* Epochs Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary-400" />
                    Training Epochs
                  </label>
                  <span className="px-3 py-1 rounded-lg bg-primary-500/20 text-primary-400 text-sm font-bold border border-primary-500/30">
                    {numEpochs}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={numEpochs}
                  onChange={(e) => setNumEpochs(parseInt(e.target.value))}
                  className="w-full h-3 bg-dark-800 rounded-full appearance-none cursor-pointer slider-primary"
                  style={{
                    background: `linear-gradient(to right, rgb(99, 102, 241) 0%, rgb(99, 102, 241) ${(numEpochs / 20) * 100}%, rgb(30, 41, 59) ${(numEpochs / 20) * 100}%, rgb(30, 41, 59) 100%)`
                  }}
                />
                <p className="text-xs text-dark-400">
                  Recommended: 3-5 epochs. More epochs = better accuracy but longer training time.
                </p>
              </div>

              {/* Learning Rate Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-secondary-400" />
                    Learning Rate
                  </label>
                  <span className="px-3 py-1 rounded-lg bg-secondary-500/20 text-secondary-400 text-sm font-bold border border-secondary-500/30 font-mono">
                    {learningRate.toFixed(5)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0.00001"
                  max="0.0001"
                  step="0.000001"
                  value={learningRate}
                  onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                  className="w-full h-3 bg-dark-800 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgb(217, 70, 239) 0%, rgb(217, 70, 239) ${((learningRate - 0.00001) / (0.0001 - 0.00001)) * 100}%, rgb(30, 41, 59) ${((learningRate - 0.00001) / (0.0001 - 0.00001)) * 100}%, rgb(30, 41, 59) 100%)`
                  }}
                />
                <p className="text-xs text-dark-400">
                  Controls how fast the model learns. Lower = more stable, Higher = faster convergence.
                </p>
              </div>

              {/* Batch Size Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-white flex items-center gap-2">
                    <Brain className="w-4 h-4 text-accent-400" />
                    Batch Size
                  </label>
                  <span className="px-3 py-1 rounded-lg bg-accent-500/20 text-accent-400 text-sm font-bold border border-accent-500/30">
                    {batchSize}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="16"
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value))}
                  className="w-full h-3 bg-dark-800 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgb(6, 182, 212) 0%, rgb(6, 182, 212) ${(batchSize / 16) * 100}%, rgb(30, 41, 59) ${(batchSize / 16) * 100}%, rgb(30, 41, 59) 100%)`
                  }}
                />
                <p className="text-xs text-dark-400">
                  Number of samples processed together. Higher = faster but needs more memory.
                </p>
              </div>

              {/* Estimation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                <div className="glass-strong rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                      <p className="text-xs text-dark-400 uppercase tracking-wide">Estimated Time</p>
                      <p className="text-2xl font-bold text-white">{estimatedMinutes} min</p>
                    </div>
                  </div>
                  <p className="text-xs text-dark-400">Approximate training duration</p>
                </div>

                <div className="glass-strong rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-success-500/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-success-400" />
                    </div>
                    <div>
                      <p className="text-xs text-dark-400 uppercase tracking-wide">Estimated Cost</p>
                      <p className="text-2xl font-bold text-white">{estimatedCost}</p>
                    </div>
                  </div>
                  <p className="text-xs text-dark-400">No charges for this platform</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6 gap-4">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`
              inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200
              ${currentStep === 1
                ? 'bg-dark-800/50 text-dark-500 cursor-not-allowed'
                : 'bg-white/5 text-dark-200 hover:bg-white/10 hover:text-white border border-white/10 hover:border-white/20'
              }
            `}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <div className="text-center text-sm text-dark-400">
            Step {currentStep} of 3
          </div>

          {currentStep < 3 ? (
            <button
              onClick={nextStep}
              disabled={!canProceed(currentStep)}
              className={`
                inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200
                ${canProceed(currentStep)
                  ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:from-primary-500 hover:to-primary-400 active:scale-95'
                  : 'bg-dark-800/50 text-dark-500 cursor-not-allowed'
                }
              `}
            >
              <span className="hidden sm:inline">Next</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleStartTraining}
              disabled={isSubmitting || !selectedDatasetId}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-success-600 to-success-500 text-white font-semibold shadow-lg shadow-success-500/30 hover:shadow-xl hover:shadow-success-500/40 hover:from-success-500 hover:to-success-400 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Starting...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Start Training</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
