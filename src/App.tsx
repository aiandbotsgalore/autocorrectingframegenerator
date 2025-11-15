import { useState, useEffect } from 'react';
import { Film, Sparkles } from 'lucide-react';
import ApiKeyInput from './components/ApiKeyInput';
import PromptInput from './components/PromptInput';
import IterationDisplay from './components/IterationDisplay';
import IterationHistory from './components/IterationHistory';
import FinalResult from './components/FinalResult';
import { autoRefineImage } from './utils/geminiApi';

interface Iteration {
  iteration: number;
  image: string;
  score: number;
  evaluation: {
    score: number;
    issues: string[];
    strengths: string[];
  };
  prompt: string;
}

interface CurrentIteration {
  iteration: number;
  status: string;
  image: string | null;
  score: number | null;
  evaluation: {
    score: number;
    issues: string[];
    strengths: string[];
  } | null;
  correctedPrompt: string | null;
}

interface FinalResultData {
  success: boolean;
  result: Iteration;
  iterations: number;
}

function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentIteration, setCurrentIteration] = useState<CurrentIteration | null>(null);
  const [iterationHistory, setIterationHistory] = useState<Iteration[]>([]);
  const [finalResult, setFinalResult] = useState<FinalResultData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedKey = localStorage.getItem('geminiApiKey');
    if (savedKey) {
      setApiKey(savedKey);
    }

    document.title = 'Auto-Correcting Music Video Frame Generator';
  }, []);

  const handleGenerate = async (userPrompt: string) => {
    setIsGenerating(true);
    setError(null);
    setCurrentIteration(null);
    setIterationHistory([]);
    setFinalResult(null);

    try {
      const result = await autoRefineImage(
        userPrompt,
        apiKey,
        (update: CurrentIteration) => {
          setCurrentIteration(update);

          if (update.image && update.score !== null && update.evaluation) {
            setIterationHistory((prev) => {
              const existing = prev.find((iter) => iter.iteration === update.iteration);
              if (existing) {
                return prev;
              }
              return [
                ...prev,
                {
                  iteration: update.iteration,
                  image: update.image!,
                  score: update.score!,
                  evaluation: update.evaluation!,
                  prompt: ''
                }
              ];
            });
          }
        }
      );

      setFinalResult(result);
      setIterationHistory((prev) =>
        prev.map((iter) =>
          iter.iteration === result.result.iteration
            ? result.result
            : iter
        )
      );
    } catch (err) {
      console.error('Generation error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred during generation. Please check your API key and try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewGeneration = () => {
    setCurrentIteration(null);
    setIterationHistory([]);
    setFinalResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00d4ff] to-[#0088ff] flex items-center justify-center">
              <Film className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[#00d4ff] to-white bg-clip-text text-transparent">
              Auto-Correcting Music Video Frame Generator
            </h1>
          </div>
          <div className="flex items-center justify-center gap-3 text-[#999999]">
            <span className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-[#00d4ff]" />
              Gemini 2.5 Flash Image
            </span>
            <span>•</span>
            <span>16:9 Cinematic</span>
            <span>•</span>
            <span>Powered by Google AI</span>
          </div>
        </header>

        <ApiKeyInput apiKey={apiKey} onApiKeyChange={setApiKey} />

        {apiKey && !finalResult && (
          <PromptInput
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            apiKey={apiKey}
          />
        )}

        {error && (
          <div className="bg-[#ff4444]/10 border border-[#ff4444] rounded-lg p-4 mb-6">
            <p className="text-[#ff4444] font-medium">Error: {error}</p>
          </div>
        )}

        {currentIteration && !finalResult && (
          <IterationDisplay currentIteration={currentIteration} />
        )}

        {finalResult && (
          <FinalResult result={finalResult} onNewGeneration={handleNewGeneration} />
        )}

        {iterationHistory.length > 0 && (
          <IterationHistory iterations={iterationHistory} />
        )}

        <footer className="text-center mt-12 pt-8 border-t border-[#333333]">
          <p className="text-[#666666] text-sm">
            Built with React, Vite, Tailwind CSS, and Google Generative AI
          </p>
          <p className="text-[#666666] text-sm mt-2">
            All images are generated at 16:9 cinematic aspect ratio (1344x768)
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
