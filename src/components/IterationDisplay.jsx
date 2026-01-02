import { memo } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { getScoreColor } from '../utils/imageDownload';

const IterationDisplay = memo(function IterationDisplay({ currentIteration }) {
  if (!currentIteration) return null;

  const { iteration, status, image, accuracyScore, visionScore, confidence, evaluation, correctedPrompt } = currentIteration;

  const scoreColor = accuracyScore ? getScoreColor(accuracyScore) : '#666666';
  const visionColor = visionScore ? getScoreColor(visionScore) : '#666666';
  const isGenerating = status === 'Generating image...';
  const isAnalyzing = status === 'Analyzing quality...';
  const isCorrecting = status === 'Creating correction...';
  const isNextIteration = status === 'Generating next iteration...';
  const isComplete = status === 'Target achieved!' || status === 'Evaluation complete';

  const isActive = status.includes('Generating') || status.includes('Evaluating') || status.includes('Correcting');

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Column: Image */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden min-h-0 gap-4">
        {/* Status Header */}
        <div className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            {isActive && (
              <Loader2 className="w-5 h-5 text-[#00d4ff] animate-spin" />
            )}
            <div aria-live="polite" aria-atomic="true">
              <h3 className="text-white font-bold text-sm">
                <span className="text-[#00d4ff]">ITERATION {iteration}/10</span>
              </h3>
              <p className="text-[#999999] text-xs mt-0.5">{status}</p>
            </div>
          </div>

          {accuracyScore !== null && visionScore !== null && (
            <div className="flex gap-2">
              <div className="px-3 py-1.5 rounded-lg text-center bg-[#1a1a1a] border border-[#333333]">
                <div className="text-xs text-[#666666]">Acc</div>
                <div className="text-sm font-bold" style={{ color: scoreColor }}>
                  {accuracyScore}%
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-lg text-center bg-[#1a1a1a] border border-[#333333]">
                <div className="text-xs text-[#666666]">Vis</div>
                <div className="text-sm font-bold" style={{ color: visionColor }}>
                  {visionScore}%
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-lg text-center bg-[#1a1a1a] border border-[#333333]">
                <div className="text-xs text-[#666666]">Conf</div>
                <div className="text-sm font-bold text-white">
                  {Math.round(confidence * 100)}%
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Image Container */}
        <div className="flex-1 min-h-0 flex items-center justify-center">
          {image ? (
            <div
              className="relative rounded-lg overflow-hidden bg-black shadow-2xl w-full h-full max-h-full"
              style={{ maxHeight: 'calc(100vh - 260px)' }}
            >
              <img
                src={image}
                alt={`Iteration ${iteration}`}
                className="w-full h-full object-contain"
                style={{ aspectRatio: '16/9' }}
                decoding="async"
              />
              <div className="absolute top-4 right-4 bg-black/80 backdrop-blur px-3 py-1.5 rounded-lg">
                <p className="text-[#00d4ff] text-xs font-semibold">16:9 CINEMATIC</p>
              </div>
              {isActive && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="bg-black/80 backdrop-blur px-4 py-3 rounded-lg flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-[#00d4ff] animate-spin" />
                    <span className="text-white text-sm font-semibold">{status}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 w-full bg-[#1a1a1a] rounded-lg border-2 border-dashed border-[#333333]">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-[#00d4ff] animate-spin mx-auto mb-3" />
                <p className="text-[#999999] text-sm">{status}</p>
              </div>
            </div>
          )}
        </div>

        {correctedPrompt && (
          <div className="bg-[#1a1a1a] border border-[#00d4ff]/20 rounded-lg p-3 flex-shrink-0 max-h-32 overflow-y-auto">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="w-3.5 h-3.5 text-[#00d4ff] animate-spin" />
              <h4 className="text-[#00d4ff] font-semibold text-xs">CORRECTION IN PROGRESS</h4>
            </div>
            <p className="text-[#999999] text-xs leading-relaxed font-mono bg-black/50 p-2 rounded">
              {correctedPrompt}
            </p>
          </div>
        )}
      </div>

      {/* Right Column: Evaluation Details */}
      {evaluation && (
        <div className="w-[420px] border-l border-[#333333] flex flex-col overflow-hidden min-h-0">
          <div className="flex-1 overflow-y-auto p-4 bg-[#0a0a0a]">
            <div className="space-y-3">
              {/* Evaluation Breakdown */}
              <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-3">
                <h4 className="text-white font-semibold text-xs mb-3">Evaluation Breakdown</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#999999]">Subject Accuracy</span>
                    <span className="text-[#666666]">0-20 pts</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#999999]">Composition</span>
                    <span className="text-[#666666]">0-20 pts</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#999999]">Lighting</span>
                    <span className="text-[#666666]">0-20 pts</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#999999]">Color Palette</span>
                    <span className="text-[#666666]">0-20 pts</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#999999]">Style & Mood</span>
                    <span className="text-[#666666]">0-10 pts</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#999999]">Details</span>
                    <span className="text-[#666666]">0-10 pts</span>
                  </div>
                  <div className="border-t border-[#333333] pt-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold text-xs">Total</span>
                      <span
                        className="text-sm font-bold"
                        style={{ color: scoreColor }}
                      >
                        {accuracyScore}/100
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strengths */}
              {evaluation.strengths && evaluation.strengths.length > 0 && (
                <div className="bg-[#1a1a1a] border border-[#00ff88]/20 rounded-lg p-3">
                  <h4 className="text-[#00ff88] font-semibold text-xs mb-2 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    STRENGTHS
                  </h4>
                  <ul className="space-y-1.5">
                    {evaluation.strengths.map((strength, index) => (
                      <li key={index} className="text-[#999999] text-xs flex items-start gap-1.5">
                        <span className="text-[#00ff88] mt-0.5">•</span>
                        <span className="flex-1">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Issues */}
              {evaluation.issues && evaluation.issues.length > 0 && (
                <div className="bg-[#1a1a1a] border border-[#ffaa00]/20 rounded-lg p-3">
                  <h4 className="text-[#ffaa00] font-semibold text-xs mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    ISSUES IDENTIFIED
                  </h4>
                  <ul className="space-y-1.5">
                    {evaluation.issues.map((issue, index) => (
                      <li key={index} className="text-[#999999] text-xs flex items-start gap-1.5">
                        <span className="text-[#ffaa00] mt-0.5">•</span>
                        <span className="flex-1">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default IterationDisplay;
