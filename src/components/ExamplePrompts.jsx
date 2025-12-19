import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

const EXAMPLES = [
  {
    title: "Martian Astronaut at Golden Hour",
    prompt: "Weathered astronaut in reflective helmet stands on massive Martian crater edge at golden hour. Setting sun casts long shadows across red rocky terrain. In helmet reflection, Earth appears as small blue dot in pink sky. Shot 35mm focal length eye level, f/2.8 shallow depth of field. Cinematic color grade warm 2800K foreground, cool 8000K highlights. Mood: isolation meets wonder. 16:9 widescreen."
  },
  {
    title: "Reality Tear with Cosmic Hands",
    prompt: "Vertical tear in reality 4 feet tall, bright white light shining through with irregular jagged edges like ripped fabric. Blue void space fragments breaking apart at tear edges, chunks drifting away. Faint translucent blue hands at frame edges pulling tear open. Deep black cosmic void background with subtle blue atmospheric haze. Shot 50mm centered composition, f/5.6 depth of field. White-blue glow from tear, orange rim light on edges. Cinematic 16:9."
  },
  {
    title: "Plasma Core Formation",
    prompt: "Dense circular mass of churning orange-blue plasma occupying 60% of frame, centered. Orange dominates outer edges, blue mid-layer, purple and white dominate bright core. Core glows intense white (8500K) with visible internal turbulence. Outer edge irregular with tendrils. Five bright white points shine within core like stars forming. Shot 85mm portrait, f/2.8 shallow depth with soft bokeh glow. Background absolute black. 16:9 cinematic."
  }
];

export default function ExamplePrompts({ onSelectExample }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (prompt, index) => {
    navigator.clipboard.writeText(prompt);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg overflow-hidden mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between text-white hover:bg-[#222222] transition-colors"
      >
        <span className="font-medium">Example Prompts</span>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-[#00d4ff]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#00d4ff]" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
          {EXAMPLES.map((example, index) => (
            <div
              key={index}
              className="bg-[#0a0a0a] border border-[#333333] rounded-lg p-4 hover:border-[#00d4ff] transition-colors group"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h4 className="text-white font-medium">{example.title}</h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopy(example.prompt, index)}
                    className="text-[#999999] hover:text-white transition-colors"
                    title="Copy prompt"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-4 h-4 text-[#00ff88]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <p className="text-[#999999] text-sm mb-3 leading-relaxed">
                {example.prompt}
              </p>
              <button
                onClick={() => onSelectExample(example.prompt)}
                className="text-[#00d4ff] text-sm font-medium hover:underline"
              >
                Use this prompt
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
