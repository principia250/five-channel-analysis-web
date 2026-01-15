// APIリクエスト・レスポンス型定義

// ========== エラー型 ==========

export type ApiError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export type ApiErrorResponse = {
  error: ApiError;
};

// ========== 週次統計API ==========

export type WeeklyStatsParams = {
  weekStartDate: string; // YYYY-MM-DD形式
  boardKey: string;
  limit?: number;
  sortBy?: "zscore" | "postHits" | "appearanceRate";
  sortOrder?: "asc" | "desc";
};

export type WeeklyStatsTerm = {
  termId: number;
  normalized: string;
  postHits: number;
  appearanceRate: number;
  appearanceRateCiLower: number | null;
  appearanceRateCiUpper: number | null;
  zscore: number | null;
};

export type WeeklyStatsResponse = {
  weekStartDate: string;
  boardKey: string;
  totalPosts: number;
  terms: WeeklyStatsTerm[];
};

// ========== 特定名詞の推移API ==========

export type TermTrendParams = {
  termId: number;
  boardKey: string;
  fromDate: string; // YYYY-MM-DD形式
  toDate: string; // YYYY-MM-DD形式
};

export type TermTrendDataPoint = {
  weekStartDate: string;
  postHits: number;
  appearanceRate: number;
  appearanceRateCiLower: number | null;
  appearanceRateCiUpper: number | null;
};

export type TermTrendResponse = {
  termId: number;
  normalized: string;
  boardKey: string;
  data: TermTrendDataPoint[];
};

// ========== 上位名詞の推移API ==========

export type TopTrendsParams = {
  boardKey: string;
  fromDate: string; // YYYY-MM-DD形式
  toDate: string; // YYYY-MM-DD形式
  limit?: number;
  sortBy?: "postHits" | "appearanceRate";
  sortOrder?: "asc" | "desc";
};

export type TopTrendDataPoint = {
  weekStartDate: string;
  postHits: number;
  appearanceRate: number;
};

export type TopTrendTerm = {
  termId: number;
  normalized: string;
  data: TopTrendDataPoint[];
};

export type TopTrendsResponse = {
  boardKey: string;
  fromDate: string;
  toDate: string;
  terms: TopTrendTerm[];
};

// ========== 回帰分析結果API ==========

export type RegressionTermParams = {
  termId: number;
  boardKey: string;
  weekStartDate?: string; // YYYY-MM-DD形式、省略時は最新週
};

export type RegressionResult = {
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

export type RegressionDataPoint = {
  weekStartDate: string;
  weekIndex: number;
  postHits: number;
  appearanceRate: number;
};

export type RegressionTermResponse = {
  termId: number;
  normalized: string;
  boardKey: string;
  regression: RegressionResult;
  data: RegressionDataPoint[];
};

// ========== 利用可能な週のリストAPI ==========

export type AvailableWeeksParams = {
  boardKey: string;
  termId?: number;
};

export type WeekInfo = {
  weekStartDate: string; // 月曜日、YYYY-MM-DD形式
  weekEndDate: string; // 日曜日、YYYY-MM-DD形式
};

export type AvailableWeeksResponse = {
  boardKey: string;
  termId?: number;
  weeks: WeekInfo[];
};

