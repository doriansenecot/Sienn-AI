/**
 * Modern Landing Page / Home
 * Hero Section + Features + Stats + CTA
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Zap,
  Brain,
  Rocket,
  Shield,
  TrendingUp,
  ArrowRight,
  Upload,
  Activity,
  Check,
  Star,
  Github,
  Code2,
  Database,
  Layers,
} from "lucide-react";
import { api } from "../../services/api";

interface Stat {
  value: string;
  label: string;
  icon: React.ReactNode;
}

export function HomePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stat[]>([
    { value: "0", label: "Total Jobs", icon: <Activity className="w-5 h-5" /> },
    { value: "0", label: "Active Jobs", icon: <Zap className="w-5 h-5" /> },
    { value: "0", label: "Datasets", icon: <Database className="w-5 h-5" /> },
    { value: "0", label: "Models", icon: <Layers className="w-5 h-5" /> },
  ]);

  useEffect(() => {
    // Fetch real-time metrics
    api.health
      .getMetrics()
      .then((metrics) => {
        setStats([
          { value: metrics.total_jobs.toString(), label: "Total Jobs", icon: <Activity className="w-5 h-5" /> },
          { value: metrics.active_jobs.toString(), label: "Active Jobs", icon: <Zap className="w-5 h-5" /> },
          { value: metrics.total_datasets.toString(), label: "Datasets", icon: <Database className="w-5 h-5" /> },
          { value: metrics.total_models.toString(), label: "Models", icon: <Layers className="w-5 h-5" /> },
        ]);
      })
      .catch(console.error);
  }, []);

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "LoRA trains only 3-5% of parameters for incredible speed and efficiency",
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "Smart Training",
      description: "Automated model selection and hyperparameter tuning for optimal results",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: "Production Ready",
      description: "Export to multiple formats: PyTorch, Ollama, GGUF with quantization",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Reliable & Stable",
      description: "Built with battle-tested technologies: FastAPI, React, Celery",
      gradient: "from-green-500 to-emerald-500",
    },
  ];

  const supportedModels = [
    { name: "GPT-2", size: "124M", badge: "Fast" },
    { name: "GPT-2 Medium", size: "355M", badge: "Balanced" },
    { name: "Microsoft Phi-2", size: "2.7B", badge: "Advanced" },
    { name: "More Coming", size: "...", badge: "Soon" },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Grain Overlay */}
      <div className="grain-overlay" />

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-8 animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary-500/30 text-sm text-primary-300 animate-glow-pulse">
              <Star className="w-4 h-4 fill-current" />
              <span>Open Source AI Fine-Tuning Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="block text-white mb-2">Fine-Tune AI Models</span>
              <span className="block text-gradient animate-gradient-x bg-[length:200%_auto]">
                In Minutes, Not Hours
              </span>
            </h1>

            {/* Subheadline */}
            <p className="max-w-3xl mx-auto text-xl text-dark-300 leading-relaxed">
              Train custom language models with <span className="text-primary-400 font-semibold">LoRA/PEFT</span>{" "}
              technology. Beautiful UI, powerful API, production-ready exports. All in one platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <button onClick={() => navigate("/upload")} className="btn btn-primary btn-lg group">
                <Upload className="w-5 h-5" />
                <span>Start Training</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => navigate("/models")} className="btn btn-ghost btn-lg">
                <Database className="w-5 h-5" />
                <span>Browse Models</span>
              </button>
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center gap-6 pt-8 text-sm text-dark-400">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Free & Open Source</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>Docker Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <span>GPU Accelerated</span>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent z-10" />
            <div className="glass-strong rounded-3xl p-8 shadow-2xl border-2 border-primary-500/20 animate-fade-in-up backdrop-blur-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Step 1 */}
                <div className="glass rounded-2xl p-6 space-y-4 hover-lift">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/50">
                    <Upload className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">1. Upload Dataset</h3>
                    <p className="text-sm text-dark-300">Drop your CSV, JSON, or JSONL file with training examples</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="glass rounded-2xl p-6 space-y-4 hover-lift">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center shadow-lg shadow-secondary-500/50">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">2. Configure & Train</h3>
                    <p className="text-sm text-dark-300">
                      Select model, adjust parameters, and start training with one click
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="glass rounded-2xl p-6 space-y-4 hover-lift">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-lg shadow-accent-500/50">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">3. Export & Deploy</h3>
                    <p className="text-sm text-dark-300">
                      Download your model in multiple formats ready for production
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div
          className="absolute bottom-20 right-10 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl animate-pulse-slow"
          style={{ animationDelay: "1s" }}
        />
      </section>

      {/* Stats Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="glass-strong rounded-2xl p-6 text-center space-y-3 hover-lift animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 text-primary-400">
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-dark-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Why Choose <span className="text-gradient-primary">Sienn AI</span>?
            </h2>
            <p className="text-xl text-dark-300 max-w-2xl mx-auto">
              Built with modern technologies for the best developer experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-strong rounded-2xl p-8 space-y-4 hover-lift card-glow animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white">{feature.title}</h3>
                <p className="text-dark-300 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Models Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Supported <span className="text-gradient-secondary">Models</span>
            </h2>
            <p className="text-xl text-dark-300">Fine-tune popular open-source language models</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportedModels.map((model, index) => (
              <div
                key={index}
                className="glass-strong rounded-2xl p-6 text-center space-y-4 hover-lift animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{model.name}</h3>
                  <p className="text-sm text-dark-400 mt-1">{model.size} parameters</p>
                </div>
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary-500/20 text-primary-400 border border-primary-500/30">
                  {model.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="glass-strong rounded-3xl p-12 space-y-8 animate-fade-in-up border-2 border-primary-500/30">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center shadow-2xl shadow-primary-500/50 animate-glow-pulse">
              <Rocket className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-white">Ready to Build Amazing AI?</h2>
              <p className="text-xl text-dark-300">
                Start fine-tuning your first model in minutes. No credit card required.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate("/upload")} className="btn btn-primary btn-lg group">
                <Sparkles className="w-5 h-5" />
                <span>Get Started Free</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="https://github.com/doriansenecot/Sienn-AI"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-lg"
              >
                <Github className="w-5 h-5" />
                <span>View on GitHub</span>
              </a>
            </div>

            <div className="flex items-center justify-center gap-4 pt-4 text-sm text-dark-400">
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4" />
                <span>Open Source</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Always Free</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>MIT License</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
