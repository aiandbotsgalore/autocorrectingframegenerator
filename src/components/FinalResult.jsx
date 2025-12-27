import { useState } from 'react';
import { CheckCircle, Download, RefreshCw, FileText, History, AlertCircle, Code } from 'lucide-react';
import { downloadImage, getScoreColor, getScoreTier } from '../utils/imageDownload';

export default function FinalResult({ result, onNewGeneration, iterationHistory = [] }) {
  const [activeTab, setActiveTab] = useState('details');

  if (!result) return null;

  const { success, result: finalIteration, iterations, stoppingReason, stoppingExplanation, summary } = result;
  const qualityPercent = summary?.qualityPercent ?? finalIteration.qualityScore ?? Math.round(finalIteration.accuracyScore * 0.4 + finalIteration.visionScore * 0.4 + finalIteration.confidence * 20);
  const bestIterationIndex = summary?.bestIterationIndex ?? finalIteration.iteration;
  const scoreColor = getScoreColor(qualityPercent);
  const visionColor = getScoreColor(finalIteration.visionScore);
  const accuracyColor = getScoreColor(finalIteration.accuracyScore);
  const userMessage = summary?.userMessage ?? stoppingExplanation;

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left Column: Image + Actions */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden min-h-0 gap-4">
        {/* Image Container */}
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div
            className="relative rounded-lg overflow-hidden bg-black shadow-2xl w-full h-full max-h-full"
            style={{ maxHeight: 'calc(100vh - 220px)' }}
          >
            <img
              src={finalIteration.image}
              alt="Final result"
              className="w-full h-full object-contain"
              style={{ aspectRatio: '16/9' }}
              decoding="async"
            />
            <div className="absolute top-4 right-4 bg-black/80 backdrop-blur px-3 py-1.5 rounded-lg">
              <p className="text-[#00d4ff] text-xs font-semibold">16:9 CINEMATIC</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={() => downloadImage(finalIteration.image, finalIteration.accuracyScore, finalIteration.iteration)}
            className="flex-1 bg-[#00d4ff] text-[#0a0a0a] font-semibold py-3 rounded-lg hover:bg-[#00bbdd] transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Image
          </button>
          <button
            onClick={onNewGeneration}
            className="flex-1 bg-[#333333] text-white font-semibold py-3 rounded-lg hover:bg-[#444444] transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Generate New Frame
          </button>
        </div>
      </div>

      {/* Right Column: Scores + Tabs */}
      <div className="w-[420px] border-l border-[#333333] flex flex-col overflow-hidden min-h-0">
        {/* Status Header */}
        <div
          className="p-4 border-b flex-shrink-0"
          style={{
            borderColor: scoreColor + '40',
            backgroundColor: scoreColor + '10'
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5" style={{ color: scoreColor }} />
            <h2 className="text-white font-bold text-sm">
              Quality Score: {qualityPercent}%
            </h2>
          </div>
          <p className="text-[#999999] text-xs leading-relaxed mb-1">
            {userMessage}
          </p>
          <p className="text-[#666666] text-xs">
            Best result from iteration #{bestIterationIndex} of {iterations}. Reason: {stoppingReason}
          </p>
        </div>

        {/* Scores Grid */}
        <div className="grid grid-cols-2 gap-2 p-4 border-b border-[#333333] flex-shrink-0">
          <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-3 text-center">
            <div className="text-[#999999] text-xs mb-1">Quality</div>
            <div
              className="text-2xl font-bold"
              style={{ color: scoreColor }}
            >
              {qualityPercent}%
            </div>
            <div className="text-[#666666] text-xs mt-1">
              {getScoreTier(qualityPercent)}
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-3 text-center">
            <div className="text-[#999999] text-xs mb-1">Accuracy</div>
            <div
              className="text-2xl font-bold"
              style={{ color: accuracyColor }}
            >
              {finalIteration.accuracyScore}%
            </div>
            <div className="text-[#666666] text-xs mt-1">
              {getScoreTier(finalIteration.accuracyScore)}
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-3 text-center">
            <div className="text-[#999999] text-xs mb-1">Vision</div>
            <div
              className="text-2xl font-bold"
              style={{ color: visionColor }}
            >
              {finalIteration.visionScore}%
            </div>
            <div className="text-[#666666] text-xs mt-1">
              Preserved
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-3 text-center">
            <div className="text-[#999999] text-xs mb-1">Confidence</div>
            <div className="text-2xl font-bold text-white">
              {Math.round(finalIteration.confidence * 100)}%
            </div>
            <div className="text-[#666666] text-xs mt-1">
              Evaluator
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#333333] flex-shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 px-4 py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'details'
                ? 'bg-[#1a1a1a] text-[#00d4ff] border-b-2 border-[#00d4ff]'
                : 'text-[#666666] hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            DETAILS
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-4 py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'history'
                ? 'bg-[#1a1a1a] text-[#00d4ff] border-b-2 border-[#00d4ff]'
                : 'text-[#666666] hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            HISTORY
          </button>
          <button
            onClick={() => setActiveTab('prompt')}
            className={`flex-1 px-4 py-2.5 text-xs font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'prompt'
                ? 'bg-[#1a1a1a] text-[#00d4ff] border-b-2 border-[#00d4ff]'
                : 'text-[#666666] hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            PROMPT
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#0a0a0a] min-h-0">
          {activeTab === 'details' && (
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
                </div>
              </div>

              {/* Strengths */}
              {finalIteration.evaluation && finalIteration.evaluation.strengths && (
                <div className="bg-[#1a1a1a] border border-[#00ff88]/20 rounded-lg p-3">
                  <h4 className="text-[#00ff88] font-semibold text-xs mb-2 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    STRENGTHS
                  </h4>
                  <ul className="space-y-1.5">
                    {finalIteration.evaluation.strengths.map((strength, index) => (
                      <li key={index} className="text-[#999999] text-xs flex items-start gap-1.5">
                        <span className="text-[#00ff88] mt-0.5">•</span>
                        <span className="flex-1">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Issues */}
              {finalIteration.evaluation && finalIteration.evaluation.issues && finalIteration.evaluation.issues.length > 0 && (
                <div className="bg-[#1a1a1a] border border-[#ffaa00]/20 rounded-lg p-3">
                  <h4 className="text-[#ffaa00] font-semibold text-xs mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    REMAINING ISSUES
                  </h4>
                  <ul className="space-y-1.5">
                    {finalIteration.evaluation.issues.map((issue, index) => (
                      <li key={index} className="text-[#999999] text-xs flex items-start gap-1.5">
                        <span className="text-[#ffaa00] mt-0.5">•</span>
                        <span className="flex-1">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-2">
              {iterationHistory.length > 0 ? (
                iterationHistory.map((iter) => (
                  <div
                    key={iter.iteration}
                    className={`bg-[#1a1a1a] border rounded-lg p-3 transition-colors ${
                      iter.iteration === bestIterationIndex
                        ? 'border-[#00d4ff] bg-[#00d4ff]/5'
                        : 'border-[#333333] hover:border-[#444444]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={iter.image}
                        alt={`Iteration ${iter.iteration}`}
                        className="w-20 h-auto rounded object-contain"
                        style={{ aspectRatio: '16/9' }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-semibold text-xs">
                            Iteration #{iter.iteration}
                          </span>
                          {iter.iteration === bestIterationIndex && (
                            <span className="text-[#00d4ff] text-xs font-semibold">BEST</span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-[#666666]">Acc:</span>
                            <span className="text-white font-semibold ml-1">
                              {iter.accuracyScore}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[#666666]">Vis:</span>
                            <span className="text-white font-semibold ml-1">
                              {iter.visionScore}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[#666666]">Conf:</span>
                            <span className="text-white font-semibold ml-1">
                              {Math.round(iter.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[#666666] text-xs text-center py-8">
                  No iteration history available
                </p>
              )}
            </div>
          )}

          {activeTab === 'prompt' && (
            <div className="space-y-3">
              <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-3">
                <h4 className="text-white font-semibold text-xs mb-2">Final Prompt Used</h4>
                <p className="text-[#999999] text-xs leading-relaxed font-mono bg-black/50 p-3 rounded">
                  {finalIteration.prompt}
                </p>
              </div>
              {finalIteration.correctedPrompt && (
                <div className="bg-[#1a1a1a] border border-[#00d4ff]/20 rounded-lg p-3">
                  <h4 className="text-[#00d4ff] font-semibold text-xs mb-2">Last Correction Applied</h4>
                  <p className="text-[#999999] text-xs leading-relaxed font-mono bg-black/50 p-3 rounded">
                    {finalIteration.correctedPrompt}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
