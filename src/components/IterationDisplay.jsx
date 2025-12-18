import { memo } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { getScoreColor } from '../utils/imageDownload';

const IterationDisplay = memo(function IterationDisplay({ currentIteration }) {
  if (!currentIteration) return null;

  const { iteration, status, image, score, evaluation, correctedPrompt } = currentIteration;

  const scoreColor = score ? getScoreColor(score) : '#666666';
  const isGenerating = status === 'Generating image...';
  const isAnalyzing = status === 'Analyzing quality...';
  const isCorrecting = status === 'Creating correction...';
  const isNextIteration = status === 'Generating next iteration...';
  const isComplete = status === 'Target achieved!' || status === 'Evaluation complete';

  return (
    <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-6 mb-6 animate-fade-in">
      <div className="border-b border-[#333333] pb-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-xl flex items-center gap-3">
            <span className="text-[#00d4ff]">ITERATION {iteration}/10</span>
          </h3>
          {score !== null && (
            <div
              className="px-4 py-2 rounded-lg font-bold text-lg"
              style={{
                backgroundColor: `${scoreColor}20`,
                color: scoreColor
              }}
            >
              ACCURACY: {score}%
            </div>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          {(isGenerating || isAnalyzing || isCorrecting || isNextIteration) && (
            <Loader2 className="w-5 h-5 text-[#00d4ff] animate-spin" />
          )}
          {isComplete && score >= 95 && (
            <CheckCircle className="w-5 h-5 text-[#00ff88]" />
          )}
          {isComplete && score < 95 && (
            <AlertCircle className="w-5 h-5 text-[#ffaa00]" />
          )}
          <span className="text-white font-medium">Status: {status}</span>
        </div>

        {image && (
          <div className="relative rounded-lg overflow-hidden bg-black mb-6">
            <img
              src={image}
              alt={`Iteration ${iteration}`}
              className="w-full h-auto object-contain"
              style={{ aspectRatio: '16/9' }}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-[#999999] text-sm">16:9 Cinematic (1344x768)</p>
            </div>
          </div>
        )}
      </div>

      {evaluation && (
        <div className="space-y-4">
          <div className="bg-[#0a0a0a] border border-[#00ff88]/20 rounded-lg p-4">
            <h4 className="text-[#00ff88] font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              STRENGTHS:
            </h4>
            <ul className="space-y-2">
              {evaluation.strengths.map((strength, index) => (
                <li key={index} className="text-[#999999] text-sm flex items-start gap-2">
                  <span className="text-[#00ff88] mt-0.5">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {evaluation.issues.length > 0 && (
            <div className="bg-[#0a0a0a] border border-[#ffaa00]/20 rounded-lg p-4">
              <h4 className="text-[#ffaa00] font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                ISSUES IDENTIFIED:
              </h4>
              <ul className="space-y-2">
                {evaluation.issues.map((issue, index) => (
                  <li key={index} className="text-[#999999] text-sm flex items-start gap-2">
                    <span className="text-[#ffaa00] mt-0.5">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {correctedPrompt && (
        <div className="mt-6 bg-[#0a0a0a] border border-[#00d4ff]/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Loader2 className="w-4 h-4 text-[#00d4ff] animate-spin" />
            <h4 className="text-[#00d4ff] font-semibold">CORRECTION IN PROGRESS</h4>
          </div>
          <p className="text-[#999999] text-sm mb-3">
            CORRECTED PROMPT FOR ITERATION {iteration + 1}:
          </p>
          <p className="text-white text-sm font-mono bg-black/50 p-3 rounded leading-relaxed">
            {correctedPrompt}
          </p>
          <p className="text-[#666666] text-xs mt-3 flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Generating next iteration automatically in 2 seconds...
          </p>
        </div>
      )}
    </div>
  );
});

export default IterationDisplay;
