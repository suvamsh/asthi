import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { LLMProviderConfig, LLMProviderType } from '../../agent/llm/types';
import { PROVIDER_PRESETS } from '../../agent/llm/providerFactory';

interface AgentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LLMProviderConfig;
  onSave: (config: LLMProviderConfig) => void;
}

const PROVIDERS: { value: LLMProviderType; label: string }[] = [
  { value: 'ollama', label: 'Ollama (Local)' },
  { value: 'groq', label: 'Groq' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'together', label: 'Together AI' },
  { value: 'anthropic', label: 'Anthropic' },
];

interface ModelOption {
  value: string;
  label: string;
}

const PROVIDER_MODELS: Record<LLMProviderType, ModelOption[]> = {
  ollama: [
    { value: 'llama3.1:8b', label: 'Llama 3.1 8B' },
    { value: 'llama3.2:3b', label: 'Llama 3.2 3B' },
    { value: 'llama3.2:1b', label: 'Llama 3.2 1B' },
    { value: 'mistral', label: 'Mistral 7B' },
    { value: 'qwen2.5:7b', label: 'Qwen 2.5 7B' },
    { value: 'phi3:mini', label: 'Phi-3 Mini' },
  ],
  groq: [
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant (cheapest)' },
    { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B Versatile' },
    { value: 'gemma2-9b-it', label: 'Gemma 2 9B' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
  ],
  openai: [
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini (cheapest)' },
    { value: 'gpt-4.1-nano', label: 'GPT-4.1 Nano' },
    { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4.1', label: 'GPT-4.1' },
  ],
  together: [
    { value: 'meta-llama/Llama-3.1-8B-Instruct-Turbo', label: 'Llama 3.1 8B Turbo (cheapest)' },
    { value: 'meta-llama/Llama-3.1-70B-Instruct-Turbo', label: 'Llama 3.1 70B Turbo' },
    { value: 'mistralai/Mixtral-8x7B-Instruct-v0.1', label: 'Mixtral 8x7B' },
  ],
  anthropic: [
    { value: 'claude-haiku-4-5-20251001', label: 'Claude 4.5 Haiku (cheapest)' },
    { value: 'claude-sonnet-4-5-20250929', label: 'Claude 4.5 Sonnet' },
    { value: 'claude-opus-4-6', label: 'Claude Opus 4.6' },
  ],
};

export function AgentConfigModal({ isOpen, onClose, config, onSave }: AgentConfigModalProps) {
  const [provider, setProvider] = useState<LLMProviderType>(config.provider);
  const [model, setModel] = useState(config.model);
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [baseUrl, setBaseUrl] = useState(config.baseUrl || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const preset = PROVIDER_PRESETS[provider];
  const needsApiKey = preset.requiresApiKey;

  const handleProviderChange = (newProvider: LLMProviderType) => {
    const newPreset = PROVIDER_PRESETS[newProvider];
    setProvider(newProvider);
    setModel(newPreset.defaultModel);
    setBaseUrl(newPreset.defaultBaseUrl);
    setApiKey('');
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const testUrl = provider === 'ollama'
        ? `${baseUrl || preset.defaultBaseUrl}/api/tags`
        : `${baseUrl || preset.defaultBaseUrl}/v1/models`;

      const headers: Record<string, string> = {};
      if (apiKey) {
        if (provider === 'anthropic') {
          headers['x-api-key'] = apiKey;
          headers['anthropic-version'] = '2023-06-01';
        } else {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
      }

      const response = await fetch(testUrl, { headers });
      if (response.ok) {
        setTestResult({ ok: true, message: 'Connected successfully!' });
      } else {
        setTestResult({ ok: false, message: `Connection failed (${response.status})` });
      }
    } catch (err) {
      setTestResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Connection failed',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSave({
      provider,
      model: model || preset.defaultModel,
      apiKey: apiKey || undefined,
      baseUrl: baseUrl || preset.defaultBaseUrl,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="LLM Provider Settings" size="md">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#cccccc] mb-1">
            Provider
          </label>
          <select
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value as LLMProviderType)}
            className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#3c3c3c] rounded-md text-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#0e639c]"
          >
            {PROVIDERS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#cccccc] mb-1">
            Model
          </label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full px-3 py-2 bg-[#3c3c3c] border border-[#3c3c3c] rounded-md text-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#0e639c]"
          >
            {PROVIDER_MODELS[provider].map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {needsApiKey && (
          <Input
            label="API Key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key"
          />
        )}

        <Input
          label="Base URL"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder={preset.defaultBaseUrl}
          helpText={`Default: ${preset.defaultBaseUrl}`}
        />

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleTest} disabled={testing}>
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
          {testResult && (
            <span className={`text-sm ${testResult.ok ? 'text-[#4ec9b0]' : 'text-[#f14c4c]'}`}>
              {testResult.message}
            </span>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#3c3c3c]">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
