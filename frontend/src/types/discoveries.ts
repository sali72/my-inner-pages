export interface PatternExcerpt {
  entryId: string;
  quote: string;
  entryDate?: string | null;
}

export interface PatternCard {
  id: string;
  description: string;
  evidence: string;
  excerpts: PatternExcerpt[];
}

export interface JourneyState {
  status: 'empty' | 'active';
  totalEntries: number;
  totalWords: number;
  firstEntryDate?: string | null;
  lastEntryDate?: string | null;
  lastModelUpdate?: string | null;
  modelVersion: number;
}

export interface MomentItem {
  id: string;
  type: string;
  date: string;
  title: string;
  description: string;
}

export interface DiscoveriesPayload {
  status: string;
  journey: JourneyState;
  patterns: PatternCard[];
  activeThemes: string[];
  moments: MomentItem[];
}
