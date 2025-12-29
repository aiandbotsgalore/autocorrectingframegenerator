import { useState, useEffect, memo } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import ExamplePrompts from './ExamplePrompts';

const PromptInput = memo(function PromptInput({ onGenerate, isGenerating, apiKey }) {
  const [prompt, setPrompt] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [mode, setMode] = useState('simple'); // 'simple' or 'pro'

  useEffect(() => {
    const words = prompt.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [prompt]);

  const handleSubmit = () => {
    if (prompt.trim().length > 0) {
      onGenerate(prompt, mode);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };

  const hasContent = prompt.trim().length > 0;

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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#00d4ff]" />
            </div>
            <div>
              <h3 id="prompt-label" className="text-white font-semibold text-lg">Image Specification</h3>
              <p id="prompt-desc" className="text-[#999999] text-sm">Describe your vision in any detail</p>
            </div>
          </div>
          <div className="flex gap-2 bg-[#0a0a0a] rounded-lg p-1">
            <button
              type="button"
              onClick={() => setMode('simple')}
              aria-pressed={mode === 'simple'}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[#00d4ff] focus-visible:outline-none ${
                mode === 'simple'
                  ? 'bg-[#00d4ff] text-[#0a0a0a]'
                  : 'text-[#999999] hover:text-white'
              }`}
            >
              Simple
            </button>
            <button
              type="button"
              onClick={() => setMode('pro')}
              aria-pressed={mode === 'pro'}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[#00d4ff] focus-visible:outline-none ${
                mode === 'pro'
                  ? 'bg-[#00d4ff] text-[#0a0a0a]'
                  : 'text-[#999999] hover:text-white'
              }`}
            >
              Pro
            </button>
          </div>
        </div>

        <textarea
          id="prompt-input"
          aria-labelledby="prompt-label"
          aria-describedby="prompt-desc prompt-feedback"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isGenerating}
          aria-label="Image Description Prompt"
          placeholder={
            mode === 'simple'
              ? "Describe your cinematic frame...&#10;&#10;Focus on:&#10;• What's in the scene (subjects, objects)&#10;• The environment and setting&#10;• The mood and atmosphere&#10;• Any important colors or lighting feel&#10;&#10;Example: An astronaut standing on the edge of a massive crater on Mars during golden hour. The setting sun casts long shadows across the red rocky terrain. In their helmet's reflection, Earth appears as a tiny blue dot against the pink Martian sky. The scene feels both isolating and full of wonder."
              : "Describe your cinematic frame in detail...&#10;&#10;Include:&#10;• Subject and action&#10;• Environment/setting&#10;• Lighting (direction, color temp in Kelvin, quality)&#10;• Color palette (specific colors)&#10;• Camera specs (focal length, angle, f-stop)&#10;• Mood/atmosphere&#10;&#10;Example: Two ethereal blue hands reach upward toward brilliant white-blue sphere of light in deep black cosmic void. Hands translucent with visible blue energy veins. Light sphere radiates intense white-blue luminescence (9000K) with corona halo. Shot 50mm focal length, low angle, f/4 depth of field. High contrast: deep blacks (RGB 0,0,0), brilliant highlights. Mood: cosmic awakening, grasping consciousness."
          }
          className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-[#666666] focus:outline-none focus:border-[#00d4ff] transition-colors resize-none min-h-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
        />

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4" aria-live="polite" id="prompt-feedback">
            <span
              className={`text-sm font-medium ${
                wordCount === 0 ? 'text-[#666666]' : 'text-[#00d4ff]'
              }`}
            >
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!hasContent || isGenerating || !apiKey}
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
});

export default PromptInput;
