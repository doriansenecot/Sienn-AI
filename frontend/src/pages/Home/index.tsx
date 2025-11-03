/**
 * Home Page - Landing/Welcome Page
 */
import { useNavigate } from 'react-router-dom';
import { Upload, Activity, TestTube, Zap } from 'lucide-react';
import { Card, Button } from '../../components/ui';

export function HomePage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Upload className="w-8 h-8" />,
      title: 'Upload Dataset',
      description: 'Upload your training data in CSV, JSON, JSONL, or TXT format',
      action: () => navigate('/upload'),
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Configure Training',
      description: 'Set hyperparameters and start fine-tuning your model',
      action: () => navigate('/training'),
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: <Activity className="w-8 h-8" />,
      title: 'Monitor Progress',
      description: 'Track training jobs in real-time with live updates',
      action: () => navigate('/dashboard'),
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: <TestTube className="w-8 h-8" />,
      title: 'Test Model',
      description: 'Generate text with your fine-tuned model',
      action: () => navigate('/inference'),
      color: 'from-orange-500 to-red-500',
    },
  ];

  return (
    <div className="min-h-screen p-8 space-y-12 animate-fade-in-up">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-12">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-purple-600 animate-glow mb-6">
          <svg
            className="w-14 h-14 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        <h1 className="text-6xl font-bold bg-gradient-to-r from-primary-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Sienn AI
        </h1>
        
        <p className="text-2xl text-slate-300 max-w-3xl mx-auto">
          Fine-Tune Language Models with Ease
        </p>
        
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          A powerful, user-friendly platform for fine-tuning large language models 
          using PEFT and LoRA techniques. Train custom models on your data in minutes.
        </p>

        <div className="flex gap-4 justify-center pt-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/upload')}
            icon={<Upload className="w-5 h-5" />}
          >
            Get Started
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/dashboard')}
          >
            View Dashboard
          </Button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-8">
          How It Works
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <Card
              key={idx}
              hoverable
              onClick={feature.action}
              className="cursor-pointer group"
            >
              <div className="text-center space-y-4">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} opacity-20 group-hover:opacity-30 transition-opacity flex items-center justify-center mx-auto mb-4`}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white group-hover:text-primary-400 transition-colors">
                  {feature.title}
                </h3>
                
                <p className="text-sm text-slate-400">
                  {feature.description}
                </p>

                <div className="pt-2">
                  <span className="text-sm text-primary-400 group-hover:text-primary-300 transition-colors">
                    Learn more →
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Tech Stack */}
      <div className="max-w-4xl mx-auto">
        <Card variant="frosted">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold text-white">Powered By</h3>
            <div className="flex gap-4 justify-center flex-wrap">
              <span className="glass-badge">🤗 HuggingFace Transformers</span>
              <span className="glass-badge">🔥 PyTorch</span>
              <span className="glass-badge">⚡ FastAPI</span>
              <span className="glass-badge">🌿 Celery</span>
              <span className="glass-badge">⚛️ React</span>
              <span className="glass-badge">🎨 Tailwind CSS</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="frosted" className="text-center">
            <div className="text-4xl font-bold text-primary-400 mb-2">
              🚀
            </div>
            <div className="text-2xl font-bold text-white mb-1">Fast</div>
            <p className="text-sm text-slate-400">
              Fine-tune models in minutes with efficient LoRA adapters
            </p>
          </Card>

          <Card variant="frosted" className="text-center">
            <div className="text-4xl font-bold text-purple-400 mb-2">
              💎
            </div>
            <div className="text-2xl font-bold text-white mb-1">Flexible</div>
            <p className="text-sm text-slate-400">
              Support for multiple model architectures and data formats
            </p>
          </Card>

          <Card variant="frosted" className="text-center">
            <div className="text-4xl font-bold text-pink-400 mb-2">
              🎯
            </div>
            <div className="text-2xl font-bold text-white mb-1">Simple</div>
            <p className="text-sm text-slate-400">
              Intuitive UI with real-time monitoring and testing
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
