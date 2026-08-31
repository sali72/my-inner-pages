import React, { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { DiscoveriesPayload, PatternExcerpt } from '@/types/discoveries';
import { JourneySection } from './JourneySection';
import { EmergingSection } from './EmergingSection';
import { MomentsSection } from './MomentsSection';

interface DiscoveriesViewProps {
  onStartChat: (insight: string, excerpts?: PatternExcerpt[]) => void;
}

export const DiscoveriesView: React.FC<DiscoveriesViewProps> = ({ onStartChat }) => {
  const [data, setData] = useState<DiscoveriesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchDiscoveries() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get<DiscoveriesPayload>('/discoveries');
        if (isMounted) {
          setData(res);
          if (res.journey && res.journey.modelVersion) {
            localStorage.setItem('innerpages_last_seen_model_version', String(res.journey.modelVersion));
            window.dispatchEvent(new Event('discoveries_viewed'));
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to fetch discoveries:', err);
          setError('Unable to load discoveries. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDiscoveries();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-elevated border border-subtle rounded-2xl shadow-card p-6 md:p-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-secondary text-sm font-mono">Reading your pages...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-elevated border border-subtle rounded-2xl shadow-card p-6 md:p-8 flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <p className="text-danger text-sm mb-4">{error || 'Something went wrong.'}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-surface border border-default hover:bg-surface-hover text-body transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-elevated border border-subtle rounded-2xl shadow-card p-6 md:p-8">
        <JourneySection journey={data.journey} />
        <EmergingSection
          patterns={data.patterns}
          activeThemes={data.activeThemes}
          onStartChat={onStartChat}
        />
        <MomentsSection moments={data.moments} />
      </div>
    </div>
  );
};
