import React, { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';

interface QuestionDistribution {
  question_id: string;
  label: string;
  count: number;
}

interface SummaryResponse {
  total_responses: number;
  by_variant: Record<string, number>;
  by_trigger: Record<string, number>;
  average_overall_feel: number | null;
  question_distributions: Record<string, QuestionDistribution[]>;
  headline_counts: Record<string, Record<string, number>>;
}

interface FeedbackItem {
  id: string;
  user_id: string;
  variant: string;
  trigger: string;
  answers: Record<string, unknown>;
  context: { entry_count: number; days_since_signup: number; current_view: string | null; locale: string; session_entry_count: number };
  questionnaire_version: string;
  app_version: string;
  created_at: string;
}

interface ListResponse {
  items: FeedbackItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const AdminFeedbackView: React.FC = () => {
  const [tab, setTab] = useState<'summary' | 'raw'>('summary');
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [list, setList] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [variantFilter, setVariantFilter] = useState('');
  const [triggerFilter, setTriggerFilter] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchSummary = async () => {
    try {
      const data = await api.get<SummaryResponse>('/feedback/summary');
      setSummary(data);
    } catch (e) {
      console.error('Failed to fetch feedback summary', e);
    }
  };

  const fetchList = async () => {
    try {
      const params = new URLSearchParams({ page: String(page), page_size: '50' });
      if (variantFilter) params.set('variant', variantFilter);
      if (triggerFilter) params.set('trigger', triggerFilter);
      const data = await api.get<ListResponse>(`/feedback?${params.toString()}`);
      setList(data);
    } catch (e) {
      console.error('Failed to fetch feedback list', e);
    }
  };

  useEffect(() => {
    setLoading(true);
    if (tab === 'summary') {
      fetchSummary().finally(() => setLoading(false));
    } else {
      fetchList().finally(() => setLoading(false));
    }
  }, [tab, page, variantFilter, triggerFilter]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading && !summary && !list) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const questionLabels: Record<string, string> = {
    usage_frequency: 'Usage frequency',
    journaling_blocker: 'Journaling blocker',
    features_tried: 'Features tried',
    features_most_useful: 'Most useful feature',
    ai_personalization: 'AI personalization',
    mirror_accuracy: 'Mirror accuracy',
    chat_realism: 'Chat realism',
    overall_feel: 'Overall feel',
    self_understanding: 'Self-understanding',
    felt_lost: 'Felt lost',
    would_use_free: 'Would use free',
    would_pay: 'Would pay',
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 bg-base rounded-lg p-1 border border-default w-fit">
        <button
          onClick={() => setTab('summary')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            tab === 'summary' ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-primary'
          }`}
        >
          Summary
        </button>
        <button
          onClick={() => setTab('raw')}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
            tab === 'raw' ? 'bg-surface text-primary shadow-sm' : 'text-secondary hover:text-primary'
          }`}
        >
          Raw Responses
        </button>
      </div>

      {tab === 'summary' && summary && (
        <div className="space-y-6">
          {/* Headline counts */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="card p-4 border-accent/30">
              <p className="text-xs text-secondary uppercase font-semibold mb-1">Total</p>
              <p className="text-2xl font-bold text-primary">{summary.total_responses}</p>
            </div>
            {Object.entries(summary.by_variant).map(([k, v]) => (
              <div key={k} className="card p-4">
                <p className="text-xs text-secondary uppercase font-semibold mb-1">{k}</p>
                <p className="text-2xl font-bold text-primary">{v}</p>
              </div>
            ))}
            {summary.average_overall_feel !== null && (
              <div className="card p-4 border-accent/30">
                <p className="text-xs text-secondary uppercase font-semibold mb-1">Avg. feel</p>
                <p className="text-2xl font-bold text-primary">{summary.average_overall_feel.toFixed(1)}</p>
              </div>
            )}
          </div>

          {/* Headline retention/pricing */}
          {summary.headline_counts && Object.keys(summary.headline_counts).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(summary.headline_counts).map(([qid, counts]) => (
                <div key={qid} className="card p-4">
                  <p className="text-sm font-semibold text-primary mb-2">{questionLabels[qid] || qid}</p>
                  <div className="space-y-1">
                    {Object.entries(counts).map(([label, count]) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <span className="text-secondary">{label}</span>
                        <span className="font-medium text-primary">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Question distributions */}
          {Object.entries(summary.question_distributions).map(([qid, dist]) => (
            <div key={qid} className="card p-4">
              <p className="text-sm font-semibold text-primary mb-3">{questionLabels[qid] || qid}</p>
              <div className="space-y-2">
                {dist.map(d => {
                  const totalForQ = dist.reduce((s, x) => s + x.count, 0);
                  const pct = totalForQ > 0 ? Math.round((d.count / totalForQ) * 100) : 0;
                  return (
                    <div key={d.label} className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-secondary">{d.label}</span>
                        <span className="font-medium text-primary">{d.count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 bg-base rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'raw' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <select
              value={variantFilter}
              onChange={e => { setVariantFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 rounded-lg border border-default bg-surface text-sm text-primary focus:border-accent"
            >
              <option value="">All variants</option>
              <option value="full">Full</option>
              <option value="short">Short</option>
            </select>
            <select
              value={triggerFilter}
              onChange={e => { setTriggerFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 rounded-lg border border-default bg-surface text-sm text-primary focus:border-accent"
            >
              <option value="">All triggers</option>
              <option value="button">Button</option>
              <option value="session_nudge">Session nudge</option>
              <option value="exit_intent">Exit intent</option>
            </select>
            <span className="text-sm text-secondary self-center">
              {list ? `${list.total} response(s)` : ''}
            </span>
          </div>

          {/* List */}
          {list && list.items.length === 0 && (
            <p className="text-secondary text-sm py-8 text-center">No responses yet.</p>
          )}
          {list?.items.map(item => (
            <div key={item.id} className="card p-4">
              <button
                onClick={() => toggleExpand(item.id)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  {expandedIds.has(item.id) ? (
                    <ChevronDown className="w-4 h-4 text-muted" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted" />
                  )}
                  <span className="text-xs text-muted font-mono">{item.id.slice(-8)}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    item.variant === 'full' ? 'bg-accent-tint text-accent' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
                  }`}>
                    {item.variant}
                  </span>
                  <span className="text-xs text-secondary">{item.trigger}</span>
                </div>
                <span className="text-xs text-muted">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </button>

              {expandedIds.has(item.id) && (
                <div className="mt-3 pt-3 border-t border-default space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs text-secondary">
                    <div>User: <span className="text-primary font-mono">{item.user_id.slice(-8)}</span></div>
                    <div>Session entries: <span className="text-primary">{item.context.session_entry_count}</span></div>
                    <div>Total entries: <span className="text-primary">{item.context.entry_count}</span></div>
                    <div>Locale: <span className="text-primary">{item.context.locale || '-'}</span></div>
                    <div>Days since signup: <span className="text-primary">{item.context.days_since_signup}</span></div>
                    <div>View: <span className="text-primary">{item.context.current_view || '-'}</span></div>
                    <div>Questionnaire: <span className="text-primary font-mono">v{item.questionnaire_version}</span></div>
                    <div>App version: <span className="text-primary font-mono">{item.app_version || '?'}</span></div>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(item.answers).map(([qid, val]) => (
                      <div key={qid} className="text-xs">
                        <span className="text-secondary font-medium">{questionLabels[qid] || qid}: </span>
                        <span className="text-primary">
                          {Array.isArray(val) ? val.join(', ') : String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          {list && list.total_pages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-default text-sm text-secondary hover:text-primary disabled:opacity-30"
              >
                Prev
              </button>
              <span className="text-xs text-muted">
                Page {list.page} of {list.total_pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(list.total_pages, p + 1))}
                disabled={page >= list.total_pages}
                className="px-3 py-1.5 rounded-lg border border-default text-sm text-secondary hover:text-primary disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
