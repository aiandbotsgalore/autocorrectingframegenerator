import { useState, memo } from 'react';
import { X } from 'lucide-react';
import { getScoreColor, getScoreTier } from '../utils/imageDownload';

const IterationHistory = memo(function IterationHistory({ iterations }) {
  const [selectedIteration, setSelectedIteration] = useState(null);

  if (iterations.length === 0) return null;

  return (
    <>
      <div className="mb-6">
        <h3 className="text-white font-bold text-xl mb-4">Iteration History</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {iterations.map((iter) => {
            const scoreColor = getScoreColor(iter.score);
            return (
              <button
                key={iter.iteration}
                onClick={() => setSelectedIteration(iter)}
                className="bg-[#1a1a1a] border border-[#333333] rounded-lg overflow-hidden hover:border-[#00d4ff] transition-all hover:scale-105 text-left group"
              >
                <div className="relative aspect-video bg-black">
                  {/* Lazy load images to improve performance when history list grows */}
                  <img
                    src={iter.image}
                    alt={`Iteration ${iter.iteration}`}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-2 left-2 bg-black/80 text-white text-xs font-bold px-2 py-1 rounded">
                    #{iter.iteration}
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium text-sm">
                      Iteration {iter.iteration}
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: scoreColor }}
                    >
                      {iter.score}%
                    </span>
                  </div>
                  <p className="text-[#666666] text-xs mt-1">
                    {getScoreTier(iter.score)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selectedIteration && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedIteration(null)}
        >
          <div
            className="bg-[#1a1a1a] border border-[#333333] rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#333333] p-4 flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-xl">
                  Iteration {selectedIteration.iteration}
                </h3>
                <p
                  className="text-sm font-bold mt-1"
                  style={{ color: getScoreColor(selectedIteration.score) }}
                >
                  {selectedIteration.score}% - {getScoreTier(selectedIteration.score)}
                </p>
              </div>
              <button
                onClick={() => setSelectedIteration(null)}
                className="text-[#999999] hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="relative rounded-lg overflow-hidden bg-black mb-6">
                <img
                  src={selectedIteration.image}
                  alt={`Iteration ${selectedIteration.iteration}`}
                  className="w-full h-auto object-contain"
                  style={{ aspectRatio: '16/9' }}
                  decoding="async"
                />
              </div>

              <div className="space-y-4">
                <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-2">Prompt Used:</h4>
                  <p className="text-[#999999] text-sm leading-relaxed">
                    {selectedIteration.prompt}
                  </p>
                </div>

                {selectedIteration.evaluation && (
                  <>
                    <div className="bg-[#0a0a0a] border border-[#00ff88]/20 rounded-lg p-4">
                      <h4 className="text-[#00ff88] font-semibold mb-3">
                        STRENGTHS:
                      </h4>
                      <ul className="space-y-2">
                        {selectedIteration.evaluation.strengths.map((strength, index) => (
                          <li key={index} className="text-[#999999] text-sm flex items-start gap-2">
                            <span className="text-[#00ff88] mt-0.5">•</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {selectedIteration.evaluation.issues.length > 0 && (
                      <div className="bg-[#0a0a0a] border border-[#ffaa00]/20 rounded-lg p-4">
                        <h4 className="text-[#ffaa00] font-semibold mb-3">
                          ISSUES IDENTIFIED:
                        </h4>
                        <ul className="space-y-2">
                          {selectedIteration.evaluation.issues.map((issue, index) => (
                            <li key={index} className="text-[#999999] text-sm flex items-start gap-2">
                              <span className="text-[#ffaa00] mt-0.5">•</span>
                              <span>{issue}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default IterationHistory;
