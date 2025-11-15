import { useState, useEffect } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import ExamplePrompts from './ExamplePrompts';

export default function PromptInput({ onGenerate, isGenerating, apiKey }) {
  const [prompt, setPrompt] = useState('');
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const words = prompt.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [prompt]);

  const handleSubmit = () => {
    if (wordCount >= 75 && wordCount <= 150) {
      onGenerate(prompt);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };

  const isValidLength = wordCount >= 75 && wordCount <= 150;
  const showWarning = wordCount > 0 && !isValidLength;

  return (
    <div>
      <div className="bg-[#1a1a1a] border border-[#00d4ff]/20 rounded-lg p-2 mb-6">
        <div className="flex items-center gap-2 px-4 py-3 text-[#00d4ff] text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p>
            All images generated at 16:9 cinematic widescreen (1344x768). Fully automatic refinement until 95%+ accuracy (max 10 iterations)
          </p>
        </div>
      </div>

      <ExamplePrompts onSelectExample={setPrompt} />

      <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-[#00d4ff]" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">Image Specification</h3>
            <p className="text-[#999999] text-sm">75-150 words</p>
          </div>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isGenerating}
          placeholder="Describe your cinematic frame in detail...&#10;&#10;Include:&#10;• Subject and action&#10;• Environment/setting&#10;• Lighting (direction, color temp in Kelvin, quality)&#10;• Color palette (specific colors)&#10;• Camera specs (focal length, angle, f-stop)&#10;• Mood/atmosphere&#10;&#10;Example: Two ethereal blue hands reach upward toward brilliant white-blue sphere of light in deep black cosmic void. Hands translucent with visible blue energy veins. Light sphere radiates intense white-blue luminescence (9000K) with corona halo. Shot 50mm focal length, low angle, f/4 depth of field. High contrast: deep blacks (RGB 0,0,0), brilliant highlights. Mood: cosmic awakening, grasping consciousness."
          className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-[#00d4ff] transition-colors resize-none min-h-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            <span
              className={`text-sm font-medium ${
                wordCount === 0
                  ? 'text-[#666666]'
                  : isValidLength
                  ? 'text-[#00ff88]'
                  : wordCount < 75
                  ? 'text-[#ffaa00]'
                  : 'text-[#ff4444]'
              }`}
            >
              {wordCount} / 75-150 words
            </span>
            {showWarning && (
              <span className="text-[#999999] text-sm">
                {wordCount < 75 ? `Need ${75 - wordCount} more words` : `${wordCount - 150} words over limit`}
              </span>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!isValidLength || isGenerating || !apiKey}
            className="px-6 py-3 bg-[#00d4ff] text-[#0a0a0a] font-semibold rounded-lg hover:bg-[#00bbdd] disabled:bg-[#333333] disabled:text-[#666666] disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            {isGenerating ? 'Generating...' : 'Generate & Auto-Refine'}
          </button>
        </div>

        <p className="text-[#666666] text-xs mt-3">
          Tip: Press Ctrl/Cmd + Enter to start generation
        </p>
      </div>
    </div>
  );
}
