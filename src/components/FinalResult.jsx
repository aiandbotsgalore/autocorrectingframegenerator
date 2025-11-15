import { CheckCircle, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import { downloadImage, getScoreColor, getScoreTier } from '../utils/imageDownload';

export default function FinalResult({ result, onNewGeneration }) {
  if (!result) return null;

  const { success, result: finalIteration, iterations } = result;
  const scoreColor = getScoreColor(finalIteration.score);

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
              <h2 className="text-white font-bold text-2xl">TARGET ACHIEVED!</h2>
            </>
          ) : (
            <>
              <AlertTriangle className="w-8 h-8" style={{ color: scoreColor }} />
              <h2 className="text-white font-bold text-2xl">BEST RESULT</h2>
            </>
          )}
        </div>
        {!success && (
          <p className="text-[#999999] text-sm">
            Maximum iterations reached. This is the highest quality achieved.
          </p>
        )}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-4 text-center">
            <div className="text-[#999999] text-sm mb-1">Final Accuracy</div>
            <div
              className="text-3xl font-bold"
              style={{ color: scoreColor }}
            >
              {finalIteration.score}%
            </div>
            <div className="text-[#666666] text-xs mt-1">
              {getScoreTier(finalIteration.score)}
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-4 text-center">
            <div className="text-[#999999] text-sm mb-1">Total Iterations</div>
            <div className="text-3xl font-bold text-[#00d4ff]">
              {iterations}
            </div>
            <div className="text-[#666666] text-xs mt-1">
              {iterations < 10 ? 'Completed early' : 'Max reached'}
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-4 text-center">
            <div className="text-[#999999] text-sm mb-1">Resolution</div>
            <div className="text-3xl font-bold text-white">
              16:9
            </div>
            <div className="text-[#666666] text-xs mt-1">
              1344x768 Cinematic
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => downloadImage(finalIteration.image, finalIteration.score, finalIteration.iteration)}
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
