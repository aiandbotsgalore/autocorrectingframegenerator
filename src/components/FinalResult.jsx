import { CheckCircle, Download, RefreshCw } from 'lucide-react';
import { downloadImage, getScoreColor, getScoreTier } from '../utils/imageDownload';

export default function FinalResult({ result, onNewGeneration }) {
  if (!result) return null;

  const { success, result: finalIteration, iterations, stoppingReason, stoppingExplanation } = result;
  const scoreColor = getScoreColor(finalIteration.accuracyScore);
  const visionColor = getScoreColor(finalIteration.visionScore);

  return (
    <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg overflow-hidden mb-6 animate-fade-in">
      <div
        className="border-b p-6 text-center"
        style={{
          borderColor: scoreColor + '40',
          backgroundColor: scoreColor + '10'
        }}
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          {success ? (
            <>
              <CheckCircle className="w-8 h-8" style={{ color: scoreColor }} />
              <h2 className="text-white font-bold text-2xl">PROFESSIONAL QUALITY ACHIEVED!</h2>
            </>
          ) : (
            <>
              <CheckCircle className="w-8 h-8" style={{ color: scoreColor }} />
              <h2 className="text-white font-bold text-2xl">INTELLIGENT REFINEMENT COMPLETE</h2>
            </>
          )}
        </div>
        <p className="text-[#999999] text-sm mt-3">
          {stoppingExplanation}
        </p>
      </div>

      <div className="p-6">
        <div className="relative rounded-lg overflow-hidden bg-black mb-6">
          <img
            src={finalIteration.image}
            alt="Final result"
            className="w-full h-auto object-contain"
            style={{ aspectRatio: '16/9' }}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-4 text-center">
            <div className="text-[#999999] text-sm mb-1">Accuracy Score</div>
            <div
              className="text-3xl font-bold"
              style={{ color: scoreColor }}
            >
              {finalIteration.accuracyScore}%
            </div>
            <div className="text-[#666666] text-xs mt-1">
              {getScoreTier(finalIteration.accuracyScore)}
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-4 text-center">
            <div className="text-[#999999] text-sm mb-1">Vision Score</div>
            <div
              className="text-3xl font-bold"
              style={{ color: visionColor }}
            >
              {finalIteration.visionScore}%
            </div>
            <div className="text-[#666666] text-xs mt-1">
              Intent Preserved
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-4 text-center">
            <div className="text-[#999999] text-sm mb-1">Best Iteration</div>
            <div className="text-3xl font-bold text-[#00d4ff]">
              #{finalIteration.iteration}
            </div>
            <div className="text-[#666666] text-xs mt-1">
              of {iterations} total
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-4 text-center">
            <div className="text-[#999999] text-sm mb-1">Confidence</div>
            <div className="text-3xl font-bold text-white">
              {Math.round(finalIteration.confidence * 100)}%
            </div>
            <div className="text-[#666666] text-xs mt-1">
              Evaluator certainty
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => downloadImage(finalIteration.image, finalIteration.accuracyScore, finalIteration.iteration)}
            className="flex-1 bg-[#00d4ff] text-[#0a0a0a] font-semibold py-3 rounded-lg hover:bg-[#00bbdd] transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download Image
          </button>
          <button
            onClick={onNewGeneration}
            className="flex-1 bg-[#333333] text-white font-semibold py-3 rounded-lg hover:bg-[#444444] transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Generate New Frame
          </button>
        </div>

        <div className="mt-6 bg-[#0a0a0a] border border-[#333333] rounded-lg p-4">
          <h4 className="text-white font-semibold mb-2">Final Prompt:</h4>
          <p className="text-[#999999] text-sm leading-relaxed">
            {finalIteration.prompt}
          </p>
        </div>

        {finalIteration.evaluation && (
          <div className="mt-4 space-y-4">
            <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Evaluation Breakdown</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#999999]">Subject Accuracy</span>
                  <span className="text-[#666666]">0-20 pts</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#999999]">Composition & Framing</span>
                  <span className="text-[#666666]">0-20 pts</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#999999]">Lighting Quality</span>
                  <span className="text-[#666666]">0-20 pts</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#999999]">Color Palette</span>
                  <span className="text-[#666666]">0-20 pts</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#999999]">Style & Mood</span>
                  <span className="text-[#666666]">0-10 pts</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#999999]">Specific Details</span>
                  <span className="text-[#666666]">0-10 pts</span>
                </div>
                <div className="border-t border-[#333333] pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold">Accuracy Score</span>
                    <span
                      className="text-lg font-bold"
                      style={{ color: scoreColor }}
                    >
                      {finalIteration.accuracyScore}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-[#00ff88]/20 rounded-lg p-4">
              <h4 className="text-[#00ff88] font-semibold mb-3">
                STRENGTHS:
              </h4>
              <ul className="space-y-2">
                {finalIteration.evaluation.strengths.map((strength, index) => (
                  <li key={index} className="text-[#999999] text-sm flex items-start gap-2">
                    <span className="text-[#00ff88] mt-0.5">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {finalIteration.evaluation.issues.length > 0 && (
              <div className="bg-[#0a0a0a] border border-[#ffaa00]/20 rounded-lg p-4">
                <h4 className="text-[#ffaa00] font-semibold mb-3">
                  REMAINING ISSUES:
                </h4>
                <ul className="space-y-2">
                  {finalIteration.evaluation.issues.map((issue, index) => (
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
      </div>
    </div>
  );
}
