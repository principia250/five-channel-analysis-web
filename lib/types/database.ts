import type {
  PipelineRun,
  Term,
  DailyTermStat,
  WeeklyTermTrend,
  TermRegressionResult,
  PipelineMetricsDaily,
} from ".prisma/client";

// Prisma生成型のエクスポート（拡張可能）
export type {
  PipelineRun,
  Term,
  DailyTermStat,
  WeeklyTermTrend,
  TermRegressionResult,
  PipelineMetricsDaily,
};

// リレーションを含む型（includeを使用する場合）
export type PipelineRunWithMetrics = PipelineRun & {
  pipelineMetrics: PipelineMetricsDaily[];
};

export type DailyTermStatWithTerm = DailyTermStat & {
  term: Term;
};

export type WeeklyTermTrendWithTerm = WeeklyTermTrend & {
  term: Term;
};

export type TermRegressionResultWithTerm = TermRegressionResult & {
  term: Term;
};

// PipelineRunのstatus型
export type PipelineRunStatus = "success" | "failed" | "partial";

// APIレスポンス用の型定義（必要に応じて拡張）
export type TermStatsResponse = {
  date: string;
  boardKey: string;
  termId: number;
  normalized: string;
  postHits: number;
  threadHits: number;
};

export type WeeklyTrendResponse = {
  weekStartDate: string;
  boardKey: string;
  termId: number;
  normalized: string;
  postHits: number;
  totalPosts: number;
  appearanceRate: number;
  appearanceRateCiLower: number | null;
  appearanceRateCiUpper: number | null;
  zscore: number | null;
};

export type RegressionResultResponse = {
  boardKey: string;
  termId: number;
  normalized: string;
  intercept: number;
  slope: number;
  interceptCiLower: number | null;
  interceptCiUpper: number | null;
  slopeCiLower: number | null;
  slopeCiUpper: number | null;
  pValue: number | null;
  analysisStartDate: string;
  analysisEndDate: string;
};

export type PipelineMetricsResponse = {
  date: string;
  boardKey: string;
  runId: string | null;
  fetchedThreads: number;
  fetchedPosts: number;
  parsedPosts: number;
  parseFailPosts: number;
  tokenizeFailPosts: number;
  filteredTokens: number;
  totalTokens: number;
  filteredRate: number;
  durationSec: number;
};

