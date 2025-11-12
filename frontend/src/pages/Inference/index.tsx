/**
 * Modern Inference Page
 * Advanced model testing with code editor, syntax highlighting, and prompt history
 */
import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  TestTube,
  Send,
  Sparkles,
  History,
  Copy,
  Check,
  ArrowLeft,
  Settings2,
  Zap,
  Clock,
  Hash,
  Thermometer,
  BarChart3,
  Split,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { api } from "../../services/api";
import type { TestModelRequest, TestModelResponse } from "../../types/api";

// ==========================
// Types & Constants
// ==========================

interface PromptHistoryItem {
  id: string;
  timestamp: number;
  prompt: string;
  response: string;
  metadata: {
    maxTokens: number;
    temperature: number;
    topP: number;
    generationTime: number;
    tokensGenerated?: number;
  };
}

interface ComparisonResult {
  id: string;
  response: TestModelResponse;
  timestamp: number;
}

const EXAMPLE_PROMPTS = [
  {
    title: "General Knowledge",
    prompt: "What is the capital of France and what is it famous for?",
  },
  {
    title: "Technical Explanation",
    prompt: "Explain the concept of neural networks in simple terms.",
  },
  {
    title: "Creative Writing",
    prompt: "Write a short story about a robot learning to paint.",
  },
  {
    title: "Code Generation",
    prompt: "Write a Python function to calculate fibonacci numbers.",
  },
  {
    title: "Conversation",
    prompt: "Hello! Can you tell me about yourself?",
  },
];

const STORAGE_KEY = "sienn-ai-prompt-history";

// ==========================
// Utility Functions
// ==========================

function loadHistory(): PromptHistoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveHistory(history: PromptHistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50))); // Keep last 50
  } catch (error) {
    console.error("Failed to save history:", error);
  }
}

// ==========================
// Code Editor Component
// ==========================

function CodeEditor({
  value,
  onChange,
  placeholder = "Enter your prompt here...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [lineCount, setLineCount] = useState(1);

  useEffect(() => {
    const lines = value.split("\n").length;
    setLineCount(lines);
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Tab key
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = value.substring(0, start) + "  " + value.substring(end);
      onChange(newValue);

      // Move cursor
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  return (
    <div className="relative rounded-xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 overflow-hidden group">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          <span className="text-xs text-slate-400 ml-2">prompt.txt</span>
        </div>
        <div className="text-xs text-slate-500">
          {value.length} characters • {lineCount} lines
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex">
        {/* Line Numbers */}
        <div className="flex-shrink-0 py-4 px-3 bg-slate-800/30 border-r border-slate-700/30 select-none">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className="text-xs text-slate-500 text-right leading-6 font-mono">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Text Area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full h-full min-h-[240px] p-4 bg-transparent text-white font-mono text-sm leading-6 resize-none focus:outline-none placeholder:text-slate-600"
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
}

// ==========================
// Main Inference Component
// ==========================

export function InferencePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialJobId = location.state?.jobId as string | undefined;

  // State
  const [jobId, setJobId] = useState<string>(initialJobId || "");
  const [prompt, setPrompt] = useState("");
  const [maxTokens, setMaxTokens] = useState(100);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestModelResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<PromptHistoryItem[]>(loadHistory());
  const [showSettings, setShowSettings] = useState(false);
  const [comparisons, setComparisons] = useState<ComparisonResult[]>([]);

  const handleTest = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!jobId) {
      toast.error("Please enter a Job ID");
      return;
    }

    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      // Try demo endpoint first for TinyLlama jobs
      const response = await fetch("http://localhost:8000/api/demo/test-tinyllama", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          max_new_tokens: maxTokens,
          temperature,
        }),
      });

      if (!response.ok) throw new Error("Inference failed");

      const data = await response.json();
      
      // Convert to TestModelResponse format with actual job ID
      const result: TestModelResponse = {
        job_id: jobId,
        prompt: data.prompt,
        generated_text: data.generated_text,
        generation_time: data.generation_time,
        tokens_generated: data.generated_text.split(/\s+/).length,
      };

      setResult(result);

      // Save to history
      const historyItem: PromptHistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        prompt: prompt.trim(),
        response: data.generated_text,
        metadata: {
          maxTokens,
          temperature,
          topP,
          generationTime: data.generation_time,
          tokensGenerated: result.tokens_generated,
        },
      };

      const newHistory = [historyItem, ...history];
      setHistory(newHistory);
      saveHistory(newHistory);

      toast.success("Your model generated successfully!");
    } catch (error) {
      console.error("Inference failed:", error);
      toast.error("Generation failed");
    } finally {
      setTesting(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClearHistory = () => {
    setHistory([]);
    saveHistory([]);
    toast.success("History cleared");
  };

  const handleLoadFromHistory = (item: PromptHistoryItem) => {
    setPrompt(item.prompt);
    setMaxTokens(item.metadata.maxTokens);
    setTemperature(item.metadata.temperature);
    setTopP(item.metadata.topP);
    setShowHistory(false);
    toast.success("Loaded from history");
  };

  const handleAddToComparison = () => {
    if (!result) return;

    if (comparisons.length >= 3) {
      toast.error("Maximum 3 comparisons allowed");
      return;
    }

    setComparisons([
      ...comparisons,
      {
        id: Date.now().toString(),
        response: result,
        timestamp: Date.now(),
      },
    ]);

    toast.success("Added to comparison");
  };

  const handleRemoveComparison = (id: string) => {
    setComparisons(comparisons.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-500 to-purple-600 animate-glow-pulse">
          <TestTube className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-gradient-primary">Test My Models</h1>
        <div className="flex items-center justify-center gap-3">
          <div className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-2 border-cyan-500/50 backdrop-blur-sm">
            <p className="text-cyan-400 font-bold text-sm flex items-center gap-2">
              🧪 My Custom Model Testing
            </p>
          </div>
        </div>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Test <span className="text-cyan-400 font-semibold">your custom fine-tuned models</span> with an advanced code
          editor
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - History */}
          <div className="lg:col-span-1 space-y-4">
            {/* Job ID Card */}
            <div className="glass-strong rounded-2xl border border-slate-700/50 p-4 animate-fade-in-up">
              <label className="block text-sm font-semibold text-slate-300 mb-3">My Model Job ID</label>
              <input
                type="text"
                value={jobId}
                onChange={(e) => setJobId(e.target.value)}
                placeholder="Enter your Job ID"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
              />
              <div className="mt-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30">
                <p className="text-[10px] text-green-400 font-semibold">✓ Testing your trained model</p>
              </div>
            </div>

            {/* Settings Toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-full glass-strong rounded-xl border border-slate-700/50 p-3 flex items-center justify-between hover-lift transition-all group"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-cyan-400 group-hover:rotate-90 transition-transform duration-300" />
                <span className="text-sm font-medium text-white">Generation Settings</span>
              </div>
            </button>

            {/* Settings Panel */}
            {showSettings && (
              <div className="glass-strong rounded-2xl border border-slate-700/50 p-4 space-y-4 animate-scale-in">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                      <Hash className="w-4 h-4 text-cyan-400" />
                      Max Tokens
                    </label>
                    <span className="text-sm font-bold text-white">{maxTokens}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    step="10"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-cyan"
                  />
                  <p className="text-xs text-slate-500 mt-1">Output length</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                      <Thermometer className="w-4 h-4 text-orange-400" />
                      Temperature
                    </label>
                    <span className="text-sm font-bold text-white">{temperature.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-orange"
                  />
                  <p className="text-xs text-slate-500 mt-1">Randomness</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                      <BarChart3 className="w-4 h-4 text-purple-400" />
                      Top P
                    </label>
                    <span className="text-sm font-bold text-white">{topP.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={topP}
                    onChange={(e) => setTopP(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-purple"
                  />
                  <p className="text-xs text-slate-500 mt-1">Sampling diversity</p>
                </div>
              </div>
            )}

            {/* History Toggle */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full glass-strong rounded-xl border border-slate-700/50 p-3 flex items-center justify-between hover-lift transition-all group"
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">History</span>
              </div>
              <span className="text-xs text-slate-400">{history.length} items</span>
            </button>

            {/* History Panel */}
            {showHistory && (
              <div className="glass-strong rounded-2xl border border-slate-700/50 p-4 max-h-[500px] overflow-y-auto animate-scale-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white">Prompt History</h3>
                  {history.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {history.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-8">No history yet</p>
                ) : (
                  <div className="space-y-2">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleLoadFromHistory(item)}
                        className="w-full text-left p-3 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:bg-slate-700/30 hover:border-slate-600/50 transition-all group"
                      >
                        <p className="text-xs text-slate-400 mb-1">{new Date(item.timestamp).toLocaleTimeString()}</p>
                        <p className="text-sm text-white line-clamp-2">{item.prompt}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          {item.metadata.generationTime.toFixed(2)}s
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Example Prompts */}
            <div
              className="glass-strong rounded-2xl border border-slate-700/50 p-4 animate-fade-in-up"
              style={{ animationDelay: "100ms" }}
            >
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Quick Examples
              </h3>
              <div className="space-y-2">
                {EXAMPLE_PROMPTS.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPrompt(example.prompt)}
                    className="w-full text-left p-2 rounded-lg bg-slate-800/30 border border-slate-700/30 hover:bg-slate-700/30 hover:border-slate-600/50 transition-all text-xs text-slate-300 hover:text-white"
                  >
                    <span className="font-semibold text-cyan-400">{example.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

            {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Code Editor */}
            <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <form onSubmit={handleTest} className="space-y-4">
                <CodeEditor
                  value={prompt}
                  onChange={setPrompt}
                  placeholder="Enter your prompt here... (Press Tab for indentation)"
                />

                <button
                  type="submit"
                  disabled={testing || !prompt.trim() || !jobId}
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 text-white font-semibold hover:shadow-glow transition-all duration-300 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {testing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      My Model is Generating...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      🚀 Test My Fine-Tuned Model
                      <Zap className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>            {/* Result Display */}
            {result && (
              <div className="glass-strong rounded-2xl border-2 border-cyan-500/30 p-6 animate-scale-in">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center animate-glow-pulse">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">My Model's Response</h3>
                        <div className="px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/40">
                          <span className="text-[10px] font-bold text-green-400">✓ MY MODEL</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-400">
                        {result.generation_time.toFixed(2)}s
                        {result.tokens_generated && ` • ${result.tokens_generated} tokens`}
                        {result.tokens_generated &&
                          ` • ${(result.tokens_generated / result.generation_time).toFixed(1)} tokens/s`}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(result.generated_text)}
                      className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-all hover-lift"
                      title="Copy"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                    <button
                      onClick={handleAddToComparison}
                      className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:bg-slate-700/50 transition-all hover-lift"
                      title="Add to comparison"
                    >
                      <Split className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-xl p-4">
                    <p className="text-xs text-slate-500 mb-2 font-semibold">PROMPT</p>
                    <p className="text-white text-sm">{result.prompt}</p>
                  </div>

                  <div className="bg-gradient-to-br from-cyan-500/5 to-blue-500/5 border border-cyan-500/20 rounded-xl p-4 max-h-[600px] overflow-y-auto">
                    <p className="text-xs text-cyan-400 mb-2 font-semibold">RESPONSE</p>
                    <p className="text-white whitespace-pre-wrap leading-relaxed">{result.generated_text}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Comparison View */}
            {comparisons.length > 0 && (
              <div className="glass-strong rounded-2xl border border-slate-700/50 p-6 animate-fade-in-up">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Split className="w-5 h-5 text-purple-400" />
                    Response Comparison
                  </h3>
                  <button
                    onClick={() => setComparisons([])}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {comparisons.map((comparison, idx) => (
                    <div
                      key={comparison.id}
                      className="relative bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 group"
                    >
                      <button
                        onClick={() => handleRemoveComparison(comparison.id)}
                        className="absolute top-2 right-2 p-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      <div className="mb-3">
                        <span className="text-xs font-semibold text-purple-400">Result {idx + 1}</span>
                        <p className="text-xs text-slate-500 mt-1">
                          {comparison.response.generation_time.toFixed(2)}s •{" "}
                          {comparison.response.tokens_generated || 0} tokens
                        </p>
                      </div>

                      <div className="text-sm text-slate-300 line-clamp-6">{comparison.response.generated_text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips Card */}
            <div
              className="glass rounded-xl border border-slate-700/50 p-6 animate-fade-in-up"
              style={{ animationDelay: "300ms" }}
            >
              <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">💡 Generation Tips</h4>
              <ul className="text-sm text-slate-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>
                    <strong className="text-slate-300">Temperature:</strong> Lower (0.3-0.7) = focused & deterministic,
                    Higher (0.8-1.5) = creative & varied
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>
                    <strong className="text-slate-300">Max Tokens:</strong> Controls output length (~1 token ≈ 4
                    characters in English)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>
                    <strong className="text-slate-300">Top P:</strong> Sampling diversity (0.9 is recommended for most
                    use cases)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>
                    <strong className="text-slate-300">Best Practice:</strong> Clear, specific prompts with context
                    yield better results
                  </span>
                </li>
              </ul>
            </div>

            {/* Back Button */}
            <div className="flex justify-center">
              <button
                onClick={() => navigate("/dashboard", { state: { jobId } })}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-all hover-lift"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
