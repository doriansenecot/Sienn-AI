/**
 * Model Inference/Testing Page
 * Test trained models with custom prompts
 */
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TestTube, Send, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button, 
  Input 
} from '../../components/ui';
import { api } from '../../services/api';
import type { TestModelRequest, TestModelResponse } from '../../types/api';

export function InferencePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialJobId = location.state?.jobId as string | undefined;

  const [jobId, setJobId] = useState<string>(initialJobId || '');
  const [prompt, setPrompt] = useState('');
  const [maxTokens, setMaxTokens] = useState(100);
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestModelResponse | null>(null);

  useEffect(() => {
    if (!initialJobId) {
      toast('Please enter a Job ID of a completed training job', { icon: 'ℹ️' });
    }
  }, [initialJobId]);

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobId) {
      toast.error('Please enter a Job ID');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    const request: TestModelRequest = {
      job_id: jobId,
      prompt: prompt.trim(),
      max_new_tokens: maxTokens,
      temperature,
      top_p: topP,
    };

    setTesting(true);
    setResult(null);

    try {
      const response = await api.inference.testModel(request);
      setResult(response);
      toast.success('Generation completed!');
    } catch (error) {
      console.error('Inference failed:', error);
    } finally {
      setTesting(false);
    }
  };

  const examplePrompts = [
    "What is the capital of France?",
    "Explain quantum computing in simple terms.",
    "Write a short poem about AI.",
    "How do I make a good cup of coffee?",
  ];

  const useExample = (example: string) => {
    setPrompt(example);
  };

  return (
    <div className="min-h-screen p-8 space-y-8 animate-fade-in-up">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 animate-glow">
          <TestTube className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 to-purple-500 bg-clip-text text-transparent">
          Test Your Model
        </h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Generate text using your fine-tuned model
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent>
            <Input
              label="Job ID"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              placeholder="Enter the Job ID of your trained model"
              helperText="Must be a completed training job"
              required
              fullWidth
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enter Your Prompt</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your prompt here..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all duration-200 resize-none"
                  required
                />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-400">Quick examples:</p>
                <div className="flex flex-wrap gap-2">
                  {examplePrompts.map((example, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => useExample(example)}
                      className="glass-badge hover:bg-primary-500/20 transition-colors cursor-pointer"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Max Tokens"
                  type="number"
                  min="10"
                  max="500"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  helperText="Output length"
                />
                <Input
                  label="Temperature"
                  type="number"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  helperText="Randomness"
                />
                <Input
                  label="Top P"
                  type="number"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={topP}
                  onChange={(e) => setTopP(parseFloat(e.target.value))}
                  helperText="Sampling"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={testing}
                icon={<Send className="w-4 h-4" />}
              >
                Generate
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <Card className="border-2 border-green-500/30 animate-scale-in">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Generated Text</h3>
                  <p className="text-sm text-slate-400">
                    Generated in {result.generation_time.toFixed(2)}s 
                    {result.tokens_generated && ` • ${result.tokens_generated} tokens`}
                  </p>
                </div>

                <div className="bg-slate-800/70 backdrop-blur-lg border border-slate-700 rounded-xl p-4">
                  <p className="text-xs text-slate-400 mb-2">Prompt:</p>
                  <p className="text-white text-sm">{result.prompt}</p>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-2xl border border-slate-700/50 rounded-lg p-4 rounded-xl">
                  <p className="text-xs text-slate-400 mb-2">Response:</p>
                  <p className="text-white whitespace-pre-wrap">{result.generated_text}</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(result.generated_text);
                      toast.success('Copied to clipboard!');
                    }}
                  >
                    Copy Text
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setResult(null)}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        <Card variant="frosted">
          <h4 className="text-sm font-bold text-white mb-3">💡 Generation Tips</h4>
          <ul className="text-sm text-slate-400 space-y-2">
            <li>
              <strong className="text-slate-300">Temperature:</strong> Lower (0.3-0.7) = more focused, Higher (0.8-1.5) = more creative
            </li>
            <li>
              <strong className="text-slate-300">Max Tokens:</strong> Controls output length. ~1 token = ~4 characters
            </li>
            <li>
              <strong className="text-slate-300">Top P:</strong> Sampling diversity. 0.9 is a good default
            </li>
            <li>
              <strong className="text-slate-300">Best results:</strong> Clear, specific prompts work best
            </li>
          </ul>
        </Card>

        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => navigate('/dashboard', { state: { jobId } })}
          >
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
