import { prisma } from "@/lib/prisma/client";
import { formatDate } from "@/lib/utils/date";
import type {
  TermTrendParams,
  TermTrendResponse,
  TopTrendsParams,
  TopTrendsResponse,
} from "@/lib/types/api";

/**
 * 特定の名詞の推移を取得
 */
export async function getTermTrend(
  params: TermTrendParams
): Promise<TermTrendResponse> {
  const { termId, boardKey, fromDate, toDate } = params;

  const from = new Date(fromDate);
  const to = new Date(toDate);

  // 週次データと用語情報をJOINして取得
  const trends = await prisma.weeklyTermTrend.findMany({
    where: {
      termId: BigInt(termId),
      boardKey,
      weekStartDate: {
        gte: from,
        lte: to,
      },
      term: {
        isBlocked: false,
      },
    },
    include: {
      term: true,
    },
    orderBy: {
      weekStartDate: "asc",
    },
  });

  if (trends.length === 0) {
    // 用語情報を取得
    const term = await prisma.term.findUnique({
      where: {
        termId: BigInt(termId),
      },
    });

    return {
      termId: Number(termId),
      normalized: term?.normalized ?? "",
      boardKey,
      data: [],
    };
  }

  // レスポンス形式に変換
  const data = trends.map((trend: typeof trends[0]) => ({
    weekStartDate: formatDate(new Date(trend.weekStartDate)),
    postHits: trend.postHits,
    appearanceRate: trend.appearanceRate,
    appearanceRateCiLower: trend.appearanceRateCiLower,
    appearanceRateCiUpper: trend.appearanceRateCiUpper,
  }));

  return {
    termId: Number(termId),
    normalized: trends[0]?.term.normalized ?? "",
    boardKey,
    data,
  };
}

/**
 * 上位名詞の推移を取得
 */
export async function getTopTrends(
  params: TopTrendsParams
): Promise<TopTrendsResponse> {
  const {
    boardKey,
    fromDate,
    toDate,
    limit = 10,
    sortBy = "postHits",
    sortOrder = "desc",
  } = params;

  const from = new Date(fromDate);
  const to = new Date(toDate);

  // 指定期間内の全ての週次データを取得
  const allTrends = await prisma.weeklyTermTrend.findMany({
    where: {
      boardKey,
      weekStartDate: {
        gte: from,
        lte: to,
      },
      term: {
        isBlocked: false,
      },
    },
    include: {
      term: true,
    },
  });

  if (allTrends.length === 0) {
    return {
      boardKey,
      fromDate,
      toDate,
      terms: [],
    };
  }

  // 名詞ごとにグループ化し、期間内の合計値を計算
  const termMap = new Map<
    bigint,
    {
      termId: bigint;
      normalized: string;
      totalValue: number;
      trends: typeof allTrends;
    }
  >();

  for (const trend of allTrends) {
    const existing = termMap.get(trend.termId);
    const value =
      sortBy === "appearanceRate" ? trend.appearanceRate : trend.postHits;

    if (existing) {
      existing.totalValue += value;
      existing.trends.push(trend);
    } else {
      termMap.set(trend.termId, {
        termId: trend.termId,
        normalized: trend.term.normalized,
        totalValue: value,
        trends: [trend],
      });
    }
  }

  // 合計値でソート
  const sortedTerms = Array.from(termMap.values()).sort((a, b) => {
    if (sortOrder === "asc") {
      return a.totalValue - b.totalValue;
    } else {
      return b.totalValue - a.totalValue;
    }
  });

  // 上位limit件を取得
  const topTerms = sortedTerms.slice(0, limit);

  // 選択された名詞について、期間全体のデータを返す
  const terms = topTerms.map((termData) => {
    // 週の開始日でソート
    const sortedTrends = [...termData.trends].sort((a, b) => {
      const dateA = new Date(a.weekStartDate).getTime();
      const dateB = new Date(b.weekStartDate).getTime();
      return dateA - dateB;
    });

    const data = sortedTrends.map((trend: typeof sortedTrends[0]) => ({
      weekStartDate: formatDate(new Date(trend.weekStartDate)),
      postHits: trend.postHits,
      appearanceRate: trend.appearanceRate,
    }));

    return {
      termId: Number(termData.termId),
      normalized: termData.normalized,
      data,
    };
  });

  return {
    boardKey,
    fromDate,
    toDate,
    terms,
  };
}


