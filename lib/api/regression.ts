import { prisma } from "@/lib/prisma/client";
import { formatDate } from "@/lib/utils/date";
import type {
  RegressionTermParams,
  RegressionTermResponse,
} from "@/lib/types/api";

/**
 * 特定の名詞の回帰分析結果を取得
 */
export async function getRegressionTerm(
  params: RegressionTermParams
): Promise<RegressionTermResponse> {
  const { termId, boardKey, weekStartDate } = params;

  // 回帰分析結果を取得
  const regression = await prisma.termRegressionResult.findUnique({
    where: {
      boardKey_termId: {
        boardKey,
        termId: BigInt(termId),
      },
    },
    include: {
      term: true,
    },
  });

  if (!regression) {
    throw new Error(
      `Regression result not found for termId: ${termId}, boardKey: ${boardKey}`
    );
  }

  // 基準週を決定
  let baseWeekStartDate: Date;

  if (weekStartDate) {
    baseWeekStartDate = new Date(weekStartDate);
  } else {
    // 最新の週を取得
    const latestTrend = await prisma.weeklyTermTrend.findFirst({
      where: {
        termId: BigInt(termId),
        boardKey,
      },
      orderBy: {
        weekStartDate: "desc",
      },
    });

    if (!latestTrend) {
      throw new Error(
        `No weekly data found for termId: ${termId}, boardKey: ${boardKey}`
      );
    }

    baseWeekStartDate = new Date(latestTrend.weekStartDate);
  }

  // 過去8週間のデータを取得
  const weekStartDate7WeeksAgo = new Date(baseWeekStartDate);
  weekStartDate7WeeksAgo.setDate(weekStartDate7WeeksAgo.getDate() - 7 * 7); // 7週間前

  const weeklyData = await prisma.weeklyTermTrend.findMany({
    where: {
      termId: BigInt(termId),
      boardKey,
      weekStartDate: {
        gte: weekStartDate7WeeksAgo,
        lte: baseWeekStartDate,
      },
    },
    orderBy: {
      weekStartDate: "asc",
    },
  });

  // 週インデックスを計算（最初の週を0とする）
  const firstWeekStartDate =
    weeklyData.length > 0
      ? new Date(weeklyData[0].weekStartDate)
      : weekStartDate7WeeksAgo;

  const data = weeklyData.map((trend: typeof weeklyData[0]) => {
    const weekStart = new Date(trend.weekStartDate);
    // 最初の週からの週数を計算
    const weekIndex = Math.floor(
      (weekStart.getTime() - firstWeekStartDate.getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    );

    return {
      weekStartDate: formatDate(weekStart),
      weekIndex,
      postHits: trend.postHits,
      appearanceRate: trend.appearanceRate,
    };
  });

  return {
    termId: Number(termId),
    normalized: regression.term.normalized,
    boardKey,
    regression: {
      intercept: regression.intercept,
      slope: regression.slope,
      interceptCiLower: regression.interceptCiLower,
      interceptCiUpper: regression.interceptCiUpper,
      slopeCiLower: regression.slopeCiLower,
      slopeCiUpper: regression.slopeCiUpper,
      pValue: regression.pValue,
      analysisStartDate: formatDate(new Date(regression.analysisStartDate)),
      analysisEndDate: formatDate(new Date(regression.analysisEndDate)),
    },
    data,
  };
}


