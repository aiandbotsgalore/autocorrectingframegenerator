import { useState, useEffect } from 'react';
import { Eye, EyeOff, Key, Check, X, Loader2 } from 'lucide-react';
import { validateApiKey } from '../utils/geminiApi';

export default function ApiKeyInput({ apiKey, onApiKeyChange }) {
  const [inputValue, setInputValue] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState(null);

  useEffect(() => {
    setInputValue(apiKey);
  }, [apiKey]);

  const handleSave = async () => {
    if (!inputValue.trim()) {
      setValidationStatus('error');
      return;
    }

    setIsValidating(true);
    setValidationStatus(null);

    const isValid = await validateApiKey(inputValue);

    if (isValid) {
      localStorage.setItem('geminiApiKey', inputValue);
      onApiKeyChange(inputValue);
      setValidationStatus('success');
      setTimeout(() => setValidationStatus(null), 3000);
    } else {
      setValidationStatus('error');
    }

    setIsValidating(false);
  };

  const handleClear = () => {
    setInputValue('');
    localStorage.removeItem('geminiApiKey');
    onApiKeyChange('');
    setValidationStatus(null);
  };

  if (apiKey && validationStatus !== 'error') {
    return (
      <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center">
              <Key className="w-5 h-5 text-[#00d4ff]" />
            </div>
            <div>
              <div className="text-white font-medium">API Key Configured</div>
              <div className="text-[#999999] text-sm">Gemini API ready to use</div>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-[#333333] text-white rounded-lg hover:bg-[#444444] transition-colors"
          >
            Change Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/10 flex items-center justify-center">
          <Key className="w-5 h-5 text-[#00d4ff]" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-lg">Enter Your Gemini API Key</h3>
          <p className="text-[#999999] text-sm">
            Get your free API key at:{' '}
            <a
              href="https://ai.google.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#00d4ff] hover:underline"
            >
              https://ai.google.dev
            </a>
          </p>
        </div>
      </div>

      <div className="relative">
        <label htmlFor="api-key-input" className="sr-only">Gemini API Key</label>
        <input
          id="api-key-input"
          type={showKey ? 'text' : 'password'}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="AIza..."
          aria-label="Gemini API Key"
          aria-invalid={validationStatus === 'error'}
          aria-describedby={validationStatus === 'error' ? 'api-key-error' : undefined}
          className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-4 py-3 pr-24 text-white placeholder-[#666666] focus:outline-none focus:border-[#00d4ff] transition-colors"
        />
        <button
          onClick={() => setShowKey(!showKey)}
          aria-label={showKey ? 'Hide API key' : 'Show API key'}
          aria-pressed={showKey}
          className="absolute right-14 top-1/2 -translate-y-1/2 text-[#999999] hover:text-white transition-colors"
        >
          {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
        {validationStatus === 'success' && (
          <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#00ff88]" aria-hidden="true" />
        )}
        {validationStatus === 'error' && (
          <X className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ff4444]" />
        )}
      </div>

      {validationStatus === 'error' && (
        <p id="api-key-error" role="alert" className="text-[#ff4444] text-sm mt-2">
          Invalid API key. Please check and try again.
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={isValidating || !inputValue.trim()}
        className="mt-4 w-full bg-[#00d4ff] text-[#0a0a0a] font-semibold py-3 rounded-lg hover:bg-[#00bbdd] disabled:bg-[#333333] disabled:text-[#666666] disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {isValidating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Validating...
          </>
        ) : (
          'Save Key'
        )}
      </button>
    </div>
  );
}
