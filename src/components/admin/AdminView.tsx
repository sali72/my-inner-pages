import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw, 
  ArrowUp, 
  ArrowDown, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  ShieldAlert, 
  Globe, 
  Key, 
  Zap, 
  Cpu
} from 'lucide-react';
import { api } from '@/utils/api';
import { ConfirmModal } from '@components/journal';

interface LiteLLMParams {
  model: string;
  api_base?: string;
  api_key?: string;
  rpm?: number;
  tpm?: number;
}

interface ProviderConfig {
  model_name: string;
  litellm_params: LiteLLMParams;
  order?: number;
  is_active: boolean;
}

interface ProviderTestResult {
  index: number;
  model: string;
  status: string;
  latency: number;
  details: string;
}

interface DiagnosticsResponse {
  total_models: number;
  working_models: number;
  failed_models: number;
  results: ProviderTestResult[];
}

export const AdminView: React.FC = () => {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [testResults, setTestResults] = useState<Record<string, ProviderTestResult>>({});
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Confirmation modal state
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Form state for adding a new provider
  const [newModel, setNewModel] = useState<string>('');
  const [newApiBase, setNewApiBase] = useState<string>('');
  const [newApiKey, setNewApiKey] = useState<string>('');
  const [newRpm, setNewRpm] = useState<number>(20);
  const [showAddForm, setShowAddForm] = useState(false);

  // Preset templates for quick addition
  const PRESETS = [
    {
      name: 'OpenRouter Free DeepSeek',
      model: 'openrouter/deepseek/deepseek-chat-v3.1:free',
      apiBase: 'https://openrouter.ai/api/v1',
      apiKey: '${OPENROUTER_API_KEY}',
    },
    {
      name: 'OpenRouter Free Gemma 2',
      model: 'openrouter/google/gemma-2-9b-it:free',
      apiBase: 'https://openrouter.ai/api/v1',
      apiKey: '${OPENROUTER_API_KEY}',
    },
    {
      name: 'Local Ollama Llama 3',
      model: 'ollama/llama3.2',
      apiBase: 'http://localhost:11434/v1',
      apiKey: 'none',
    }
  ];

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const data = await api.get<ProviderConfig[]>('/admin/llm/providers');
      // Sort providers by order field
      const sorted = [...data].sort((a, b) => (a.order || 0) - (b.order || 0));
      setProviders(sorted);
    } catch (error) {
      console.error('Failed to load LLM configurations:', error);
      showStatus('error', 'Failed to load LLM configurations from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProviders();
    return () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, []);

  const showStatus = (type: 'success' | 'error', text: string) => {
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    setStatusMessage({ type, text });
    statusTimerRef.current = setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleRunDiagnostics = async () => {
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
  };

  const handleSaveConfig = async (updatedList = providers) => {
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
  };

  const handleAddProvider = () => {
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
    
    // Reset form
    setNewModel('');
    setNewApiBase('');
    setNewApiKey('');
    setNewRpm(20);
    setShowAddForm(false);
    
    // Automatically save
    handleSaveConfig(updated);
  };

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setNewModel(preset.model);
    setNewApiBase(preset.apiBase);
    setNewApiKey(preset.apiKey);
  };

  const handleRemoveProvider = (index: number) => {
    setRemoveIndex(index);
  };

  const confirmRemoveProvider = () => {
    if (removeIndex === null) return;
    const updated = providers.filter((_, idx) => idx !== removeIndex);
    setProviders(updated);
    setRemoveIndex(null);
    handleSaveConfig(updated);
  };

  const handleMoveProvider = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === providers.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const updated = [...providers];
    
    // Swap
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    setProviders(updated);
    handleSaveConfig(updated);
  };

  const handleToggleActive = (index: number, checked: boolean) => {
    const updated = [...providers];
    updated[index] = {
      ...updated[index],
      is_active: checked
    };
    setProviders(updated);
    handleSaveConfig(updated);
  };

  const handleEditField = (index: number, field: keyof LiteLLMParams, value: any) => {
    const updated = [...providers];
    updated[index] = {
      ...updated[index],
      litellm_params: {
        ...updated[index].litellm_params,
        [field]: value
      }
    };
    setProviders(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 animate-spin text-accent mx-auto mb-4" />
          <p className="text-secondary text-lg">Loading LLM configuration system...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto p-4 pt-6 space-y-6">
        
        {/* Header and Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary flex items-center gap-2">
              <Cpu className="w-8 h-8 text-accent animate-pulse" />
              LLM Provider Management
            </h1>
            <p className="text-sm text-secondary mt-1">
              Configure, order, and monitor API router deployments.
            </p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={handleRunDiagnostics}
              disabled={testing || providers.length === 0}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                testing 
                  ? 'bg-accent-tint text-accent border-accent-tint' 
                  : 'bg-surface text-primary border-default hover:border-hover hover:bg-hover'
              }`}
            >
              <Activity className={`w-4 h-4 ${testing ? 'animate-pulse' : ''}`} />
              {testing ? 'Testing...' : 'Test Providers'}
            </button>
            
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Provider
            </button>
          </div>
        </div>

        {/* Notifications */}
        {statusMessage && (
          <div className={`p-4 rounded-lg flex items-start gap-3 border transition-all duration-300 ${
            statusMessage.type === 'success' 
              ? 'bg-green-50/50 border-green-200 text-green-800 dark:bg-green-950/20 dark:border-green-900/50 dark:text-green-200' 
              : 'bg-red-50/50 border-red-200 text-red-800 dark:bg-red-950/20 dark:border-red-900/50 dark:text-red-200'
          }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            )}
            <span className="text-sm font-medium">{statusMessage.text}</span>
          </div>
        )}

        {/* Add New Provider Modal/Form */}
        {showAddForm && (
          <div className="card p-6 border-accent bg-accent-tint/5 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <h2 className="text-lg font-semibold text-primary">New Provider Deployment</h2>
            
            {/* Quick presets */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase text-secondary">Presets:</span>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyPreset(p)}
                    className="px-3 py-1.5 rounded bg-surface border border-default text-xs font-medium text-secondary hover:border-hover hover:text-primary transition-all"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-secondary block mb-1">LiteLLM Model ID</label>
                <input
                  type="text"
                  placeholder="e.g. openrouter/google/gemini-flash-1.5:free"
                  value={newModel}
                  onChange={e => setNewModel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-primary text-sm focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-secondary block mb-1">API Base (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. https://openrouter.ai/api/v1"
                  value={newApiBase}
                  onChange={e => setNewApiBase(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-primary text-sm focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-secondary block mb-1">API Key / Env Var Reference</label>
                <input
                  type="text"
                  placeholder="e.g. ${OPENROUTER_API_KEY}"
                  value={newApiKey}
                  onChange={e => setNewApiKey(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-primary text-sm focus:border-accent"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-secondary block mb-1">RPM Limit (Optional)</label>
                <input
                  type="number"
                  placeholder="20"
                  value={newRpm}
                  onChange={e => setNewRpm(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-lg border border-default bg-surface text-primary text-sm focus:border-accent"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-lg border border-default hover:bg-hover text-sm font-medium text-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProvider}
                className="px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent-hover text-sm font-medium"
              >
                Add Deployment
              </button>
            </div>
          </div>
        )}

        {/* Configurations List */}
        <div className="space-y-4">
          {providers.length === 0 ? (
            <div className="card p-12 text-center border-dashed">
              <Cpu className="w-12 h-12 mx-auto text-muted mb-4 opacity-40" />
              <p className="text-secondary text-lg">No LLM providers configured yet.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover"
              >
                Add Your First Provider
              </button>
            </div>
          ) : (
            providers.map((p, idx) => {
              const params = p.litellm_params;
              const testResult = testResults[params.model];
              
              return (
                <div 
                  key={`${p.litellm_params.model}-${p.order ?? idx}`}
                  className={`card p-5 hover:border-hover transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group ${
                    p.is_active === false ? 'opacity-50 bg-base/20' : ''
                  }`}
                >
                  
                  {/* Deployment Info */}
                  <div className="space-y-2 flex-grow w-full md:w-auto">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-accent-tint text-accent text-xs font-semibold">
                        Priority {idx + 1}
                      </span>

                      <label className="flex items-center gap-1.5 cursor-pointer bg-base px-2 py-0.5 rounded border border-default">
                        <input
                          type="checkbox"
                          checked={p.is_active !== false}
                          onChange={e => handleToggleActive(idx, e.target.checked)}
                          className="w-3.5 h-3.5 rounded text-accent focus:ring-accent accent-accent"
                        />
                        <span className="text-[10px] font-semibold text-secondary uppercase">Active</span>
                      </label>

                      <h3 className="font-semibold text-primary truncate max-w-xs md:max-w-md">
                        {params.model}
                      </h3>
                      
                      {/* Status Badge */}
                      {testResult && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1 ${
                          testResult.status === 'WORKING' 
                            ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400' 
                            : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                        }`}>
                          {testResult.status === 'WORKING' ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              {testResult.latency.toFixed(2)}s
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3" />
                              Failed
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    {/* Form fields for quick edit */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1.5">
                      <div className="flex items-center gap-1.5 bg-base/50 p-2 rounded border border-default">
                        <Globe className="w-3.5 h-3.5 text-muted shrink-0" />
                        <input
                          type="text"
                          title="API Base URL"
                          placeholder="Default API Base"
                          value={params.api_base || ''}
                          onChange={e => handleEditField(idx, 'api_base', e.target.value)}
                          className="bg-transparent border-none p-0 text-xs text-primary focus:outline-none w-full"
                        />
                      </div>
                      
                      <div className="flex items-center gap-1.5 bg-base/50 p-2 rounded border border-default">
                        <Key className="w-3.5 h-3.5 text-muted shrink-0" />
                        <input
                          type="text"
                          title="API Key (Obfuscated or Env Reference)"
                          placeholder="No API Key"
                          value={params.api_key || ''}
                          onChange={e => handleEditField(idx, 'api_key', e.target.value)}
                          className="bg-transparent border-none p-0 text-xs text-primary focus:outline-none w-full"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 bg-base/50 p-2 rounded border border-default">
                        <Zap className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span className="text-[10px] text-muted shrink-0">RPM:</span>
                        <input
                          type="number"
                          title="Requests Per Minute"
                          value={params.rpm || ''}
                          onChange={e => handleEditField(idx, 'rpm', parseInt(e.target.value) || undefined)}
                          className="bg-transparent border-none p-0 text-xs text-primary focus:outline-none w-full"
                        />
                      </div>
                    </div>

                    {/* Diagnostic Error Details */}
                    {testResult && testResult.status === 'FAILED' && (
                      <div className="p-2 rounded bg-red-50/50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-xs text-red-800 dark:text-red-300 font-mono mt-2 break-all">
                        {testResult.details}
                      </div>
                    )}
                  </div>

                  {/* Edit & Reorder Actions */}
                  <div className="flex items-center gap-1 border-t md:border-t-0 pt-3 md:pt-0 border-default w-full md:w-auto justify-end">
                    
                    {/* Save row (if touched) */}
                    <button
                      onClick={() => handleSaveConfig()}
                      className="p-2 text-muted hover:text-accent hover:bg-accent-tint rounded-lg transition-all"
                      title="Save Changes"
                    >
                      <Save className="w-4 h-4" />
                    </button>

                    <div className="flex border-r border-default pr-1.5 mr-1.5">
                      <button
                        onClick={() => handleMoveProvider(idx, 'up')}
                        disabled={idx === 0}
                        className="p-2 text-muted hover:text-primary hover:bg-hover rounded-lg transition-all disabled:opacity-30"
                        title="Move Priority Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleMoveProvider(idx, 'down')}
                        disabled={idx === providers.length - 1}
                        className="p-2 text-muted hover:text-primary hover:bg-hover rounded-lg transition-all disabled:opacity-30"
                        title="Move Priority Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveProvider(idx)}
                      className="p-2 text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                      title="Remove Deployment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={removeIndex !== null}
        title="Remove Provider"
        message={removeIndex !== null ? `Remove provider "${providers[removeIndex]?.litellm_params.model}"?` : ''}
        confirmLabel="Remove"
        variant="danger"
        onConfirm={confirmRemoveProvider}
        onCancel={() => setRemoveIndex(null)}
      />
    </>
  );
};
