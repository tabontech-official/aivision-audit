/**
 * Keyword Research & SERP Intelligence Types
 */

export type KeywordIntent = "Informational" | "Commercial" | "Transactional" | "Navigational";

export type KeywordDifficultyTier = "Easy" | "Possible" | "Hard" | "Very Hard";

export interface KeywordIdeaItem {
  id?: string;
  keyword: string;
  searchVolume: number;
  cpc: number;
  ppc: number;
  difficulty: number; // 0-100
  difficultyTier: KeywordDifficultyTier;
  intent: KeywordIntent;
  trend: number[]; // 12-month historical volumes
  category: "related" | "question" | "autocomplete";
  isTracked?: boolean;
}

export interface SerpPositionResult {
  position: number;
  url: string;
  domain: string;
  title: string;
  domainRank: number;
  pageRank: number;
  backlinksCount: number;
  estimatedVisits: number;
}

export interface KeywordSearchResult {
  searchId: string;
  query: string;
  location: string;
  language: string;
  totalResults: number;
  avgSearchVolume: number;
  avgDifficulty: number;
  related: KeywordIdeaItem[];
  questions: KeywordIdeaItem[];
  autocomplete: KeywordIdeaItem[];
  cached?: boolean;
}

export interface TrackedKeywordItem {
  id: string;
  websiteId: string;
  keyword: string;
  targetUrl: string | null;
  searchVolume: number;
  cpc: number;
  difficulty: number;
  currentPosition: number | null;
  previousPosition: number | null;
  bestPosition: number | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}
