import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/utils/api';

import type {
  LiteLLMParams,
  ProviderConfig,
  ProviderTestResult,
  DiagnosticsResponse,
} from '@/types';

export type { LiteLLMParams, ProviderConfig, ProviderTestResult, DiagnosticsResponse };

export const PRESETS = [
  {
    name: 'OpenRouter Free Gemma 4',
    model: 'openrouter/google/gemma-4:free',
    apiBase: 'https://openrouter.ai/api/v1',
    apiKey: '${OPENROUTER_API_KEY}',
  },
  {
    name: 'Groq GPT OSS 120',
    model: 'groq/openai/gpt-oss-120',
    apiBase: 'https://api.groq.com/openai/v1',
    apiKey: '${GROQ_API_KEY}',
  }
];


export function useLlmProviders() {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [testResults, setTestResults] = useState<Record<string, ProviderTestResult>>({});
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [removeIndex, setRemoveIndex] = useState<number | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [newModel, setNewModel] = useState<string>('');
  const [newApiBase, setNewApiBase] = useState<string>('');
  const [newApiKey, setNewApiKey] = useState<string>('');
  const [newRpm, setNewRpm] = useState<number>(20);
  const [showAddForm, setShowAddForm] = useState(false);

  const showStatus = useCallback((type: 'success' | 'error', text: string) => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setStatusMessage({ type, text });
    statusTimerRef.current = setTimeout(() => setStatusMessage(null), 5000);
  }, []);

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<ProviderConfig[]>('/admin/llm/providers');
      const sorted = [...data].sort((a, b) => (a.order || 0) - (b.order || 0));
      setProviders(sorted);
    } catch (error) {
      console.error('Failed to load LLM configurations:', error);
      showStatus('error', 'Failed to load LLM configurations from server.');
    } finally {
      setLoading(false);
    }
  }, [showStatus]);

  useEffect(() => {
    fetchProviders();
    return () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, [fetchProviders]);

  const handleRunDiagnostics = useCallback(async () => {
    try {
      setTesting(true);
      showStatus('success', 'Starting parallel provider diagnostics...');
      const response = await api.post<DiagnosticsResponse>('/admin/llm/test', {});
      
      const resultsMap: Record<string, ProviderTestResult> = {};
      response.results.forEach(res => {
        resultsMap[res.model] = res;
      });
      setTestResults(resultsMap);
      showStatus('success', `Tested ${response.total_models} models. ${response.working_models} functional.`);
    } catch (error) {
      console.error('Failed to run diagnostics:', error);
      showStatus('error', 'Diagnostics failed. Check backend connectivity.');
    } finally {
      setTesting(false);
    }
  }, [showStatus]);

  const handleSaveConfig = useCallback(async (updatedList = providers) => {
    try {
      const payload = updatedList.map((p, idx) => ({
        ...p,
        order: idx + 1
      }));

      await api.put('/admin/llm/providers', payload);
      setProviders(payload);
      showStatus('success', 'Configurations saved and hot-reloaded successfully.');
    } catch (error) {
      console.error('Failed to save configuration:', error);
      showStatus('error', 'Failed to save configuration.');
    }
  }, [providers, showStatus]);

  const handleAddProvider = useCallback(() => {
    if (!newModel.trim()) {
      showStatus('error', 'Model name is required.');
      return;
    }

    const newProvider: ProviderConfig = {
      model_name: 'default',
      litellm_params: {
        model: newModel.trim(),
        ...(newApiBase.trim() && { api_base: newApiBase.trim() }),
        ...(newApiKey.trim() && { api_key: newApiKey.trim() }),
        ...(newRpm > 0 && { rpm: newRpm }),
      },
      order: providers.length + 1,
      is_active: true
    };

    const updated = [...providers, newProvider];
    setProviders(updated);
    
    setNewModel('');
    setNewApiBase('');
    setNewApiKey('');
    setNewRpm(20);
    setShowAddForm(false);
    
    handleSaveConfig(updated);
  }, [newModel, newApiBase, newApiKey, newRpm, providers, showStatus, handleSaveConfig]);

  const handleApplyPreset = useCallback((preset: typeof PRESETS[0]) => {
    setNewModel(preset.model);
    setNewApiBase(preset.apiBase);
    setNewApiKey(preset.apiKey);
  }, []);

  const handleRemoveProvider = useCallback((index: number) => {
    setRemoveIndex(index);
  }, []);

  const confirmRemoveProvider = useCallback(() => {
    if (removeIndex === null) return;
    const updated = providers.filter((_, idx) => idx !== removeIndex);
    setProviders(updated);
    setRemoveIndex(null);
    handleSaveConfig(updated);
  }, [removeIndex, providers, handleSaveConfig]);

  const handleMoveProvider = useCallback((index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === providers.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...providers];
    
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    setProviders(updated);
    handleSaveConfig(updated);
  }, [providers, handleSaveConfig]);

  const handleToggleActive = useCallback((index: number, checked: boolean) => {
    const updated = [...providers];
    updated[index] = {
      ...updated[index],
      is_active: checked
    };
    setProviders(updated);
    handleSaveConfig(updated);
  }, [providers, handleSaveConfig]);

  const handleEditField = useCallback((index: number, field: keyof LiteLLMParams, value: unknown) => {
    const updated = [...providers];
    updated[index] = {
      ...updated[index],
      litellm_params: {
        ...updated[index].litellm_params,
        [field]: value
      }
    };
    setProviders(updated);
  }, [providers]);

  return {
    providers,
    testResults,
    loading,
    testing,
    statusMessage,
    showAddForm,
    setShowAddForm,
    newModel,
    setNewModel,
    newApiBase,
    setNewApiBase,
    newApiKey,
    setNewApiKey,
    newRpm,
    setNewRpm,
    removeIndex,
    setRemoveIndex,
    fetchProviders,
    handleRunDiagnostics,
    handleSaveConfig,
    handleAddProvider,
    handleApplyPreset,
    handleRemoveProvider,
    confirmRemoveProvider,
    handleMoveProvider,
    handleToggleActive,
    handleEditField,
  };
}
