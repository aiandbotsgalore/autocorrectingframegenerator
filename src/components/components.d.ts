import * as React from 'react';

declare module './components/ApiKeyInput' {
  interface ApiKeyInputProps {
    apiKey: string;
    onApiKeyChange: (value: string) => void;
  }
  const ApiKeyInput: React.FC<ApiKeyInputProps>;
  export default ApiKeyInput;
}

declare module './components/PromptInput' {
  interface PromptInputProps {
    onGenerate: (userPrompt: string, mode?: string) => Promise<void>;
    isGenerating: boolean;
    apiKey: string;
  }
  const PromptInput: React.FC<PromptInputProps>;
  export default PromptInput;
}

declare module './components/IterationDisplay' {
  interface IterationDisplayProps {
    currentIteration: any;
  }
  const IterationDisplay: React.FC<IterationDisplayProps>;
  export default IterationDisplay;
}

declare module './components/FinalResult' {
  interface FinalResultProps {
    result: any;
    onNewGeneration: () => void;
    iterationHistory?: any[];
  }
  const FinalResult: React.FC<FinalResultProps>;
  export default FinalResult;
}

declare module './components/*' {
  const Component: any;
  export default Component;
}
