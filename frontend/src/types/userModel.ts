export interface UserModelStats {
  totalEntries: number;
  totalWords: number;
}

export interface UserModelBaseline {
  emotionalTone: string;
  thinkingStyle: string;
  selfFocus: string;
  confidence: number;
}

export interface PatternItem {
  description: string;
  evidence: string;
}

export interface UserModel {
  version: number;
  updatedAt: string | null;
  stats: UserModelStats;
  baseline: UserModelBaseline;
  patterns: PatternItem[];
  activeThemes: string[];
  conversationGuidelines: string[];
}

export interface InjectedContext {
  userModel: UserModel | null;
  recentEntries: string;
  chatHistory: string;
}
