import { useState, useEffect } from 'react';
import { Film, Sparkles } from 'lucide-react';
import ApiKeyInput from './components/ApiKeyInput';
import PromptInput from './components/PromptInput';
import IterationDisplay from './components/IterationDisplay';
import FinalResult from './components/FinalResult';
import { autoRefineImage } from './core/refinementEngine';
import type { ComponentType } from 'react';

const TypedApiKeyInput = ApiKeyInput as ComponentType<any>;
const TypedPromptInput = PromptInput as ComponentType<any>;
const TypedIterationDisplay = IterationDisplay as ComponentType<any>;
const TypedFinalResult = FinalResult as ComponentType<any>;

interface Iteration {
  iteration: number;
  image: string;
  accuracyScore: number;
  visionScore: number;
  confidence: number;
  qualityScore?: number;
  evaluation: {
    accuracyScore: number;
    visionScore: number;
    confidence: number;
    issues: string[];
    strengths: string[];
  };
  prompt: string;
  correctedPrompt?: string;
}

interface CurrentIteration {
  iteration: number;
  status: string;
  image: string | null;
  accuracyScore: number | null;
  visionScore: number | null;
  confidence: number | null;
  qualityScore?: number | null;
  evaluation: {
    accuracyScore: number;
    visionScore: number;
    confidence: number;
    issues: string[];
    strengths: string[];
  } | null;
  correctedPrompt: string | null;
}

interface FinalResultData {
  success: boolean;
  result: Iteration;
  iterations: number;
  stoppingReason: string;
  stoppingExplanation: string;
  summary?: {
    userMessage: string;
    bestIterationIndex: number;
    qualityPercent: number;
    rejectedHigherScore: boolean;
    rejectionExplanation?: string;
  };
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

  const handleGenerate = async (userPrompt: string, mode: string = 'pro') => {
    setIsGenerating(true);
    setError(null);
    setCurrentIteration(null);
    setIterationHistory([]);
    setFinalResult(null);

    try {
      const result = await autoRefineImage(
        userPrompt,
        apiKey,
        mode as 'simple' | 'pro',
        (update: CurrentIteration) => {
          setCurrentIteration(update);

          if (update.image && update.accuracyScore !== null && update.evaluation) {
            const qualityScore =
              update.qualityScore ??
              (update.accuracyScore !== null &&
              update.visionScore !== null &&
              update.confidence !== null
                ? Math.round(update.accuracyScore * 0.4 + update.visionScore * 0.4 + update.confidence * 20)
                : undefined);

            setIterationHistory((prev) => {
              const existing = prev.find((iter) => iter.iteration === update.iteration);
              if (existing) {
                // Update existing iteration with corrected prompt if available
                if (update.correctedPrompt || qualityScore !== undefined) {
                  return prev.map((iter) =>
                    iter.iteration === update.iteration
                      ? { ...iter, correctedPrompt: update.correctedPrompt || iter.correctedPrompt, qualityScore: qualityScore ?? iter.qualityScore }
                      : iter
                  );
                }
                return prev;
              }
              return [
                ...prev,
                {
                  iteration: update.iteration,
                  image: update.image!,
                  accuracyScore: update.accuracyScore!,
                  visionScore: update.visionScore!,
                  confidence: update.confidence!,
                  qualityScore,
                  evaluation: update.evaluation!,
                  prompt: '',
                  correctedPrompt: update.correctedPrompt || undefined
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
    <div className="h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
      {/* Compact Header */}
      <header className="border-b border-[#333333] bg-[#0a0a0a] flex-shrink-0">
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#00d4ff] to-[#0088ff] flex items-center justify-center">
                <Film className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">
                  Auto-Correcting Frame Generator
                </h1>
                <div className="flex items-center gap-2 text-xs text-[#666666]">
                  <Sparkles className="w-3 h-3 text-[#00d4ff]" />
                  <span>Gemini 2.5 Flash Image</span>
                  <span>•</span>
                  <span>16:9 Cinematic</span>
                </div>
              </div>
            </div>
            <TypedApiKeyInput apiKey={apiKey} onApiKeyChange={setApiKey} />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden min-h-0">
        {apiKey && !finalResult && !currentIteration && (
          <div className="h-full flex items-center justify-center px-6">
            <div className="max-w-3xl w-full">
              <TypedPromptInput
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                apiKey={apiKey}
              />
              {error && (
                <div className="bg-[#ff4444]/10 border border-[#ff4444] rounded-lg p-4 mt-4">
                  <p className="text-[#ff4444] font-medium">Error: {error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentIteration && !finalResult && (
          <TypedIterationDisplay currentIteration={currentIteration} />
        )}

        {finalResult && (
          <TypedFinalResult
            result={finalResult}
            onNewGeneration={handleNewGeneration}
            iterationHistory={iterationHistory}
          />
        )}
      </div>
    </div>
  );
}

export default App;
