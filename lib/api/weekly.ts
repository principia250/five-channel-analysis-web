import { prisma } from "@/lib/prisma/client";
import { formatDate } from "@/lib/utils/date";
import type {
  WeeklyStatsParams,
  WeeklyStatsResponse,
  AvailableWeeksParams,
  AvailableWeeksResponse,
  WeekInfo,
} from "@/lib/types/api";

/**
 * 特定の週の名詞統計を取得
 */
export async function getWeeklyStats(
  params: WeeklyStatsParams
): Promise<WeeklyStatsResponse> {
  const {
    weekStartDate,
    boardKey,
    limit,
    sortBy = "postHits",
    sortOrder = "desc",
  } = params;

  const weekStart = new Date(weekStartDate);

  // 週次データと用語情報をJOINして取得
  const trends = await prisma.weeklyTermTrend.findMany({
    where: {
      weekStartDate: weekStart,
      boardKey,
      term: {
        isBlocked: false,
      },
    },
    include: {
      term: true,
    },
  });

  if (trends.length === 0) {
    return {
      weekStartDate,
      boardKey,
      totalPosts: 0,
      terms: [],
    };
  }

  // totalPostsは最初のレコードから取得（全てのレコードで同じ値のはず）
  const totalPosts = trends[0]?.totalPosts ?? 0;

  // ソート処理
  const sortedTrends = [...trends].sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (sortBy) {
      case "zscore":
        aValue = a.zscore ?? 0;
        bValue = b.zscore ?? 0;
        break;
      case "postHits":
        aValue = a.postHits;
        bValue = b.postHits;
        break;
      case "appearanceRate":
        aValue = a.appearanceRate;
        bValue = b.appearanceRate;
        break;
      default:
        aValue = a.postHits;
        bValue = b.postHits;
    }

    if (sortOrder === "asc") {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  // 件数制限
  const limitedTrends = limit ? sortedTrends.slice(0, limit) : sortedTrends;

  // レスポンス形式に変換
  const terms = limitedTrends.map((trend) => ({
    termId: Number(trend.termId),
    normalized: trend.term.normalized,
    postHits: trend.postHits,
    appearanceRate: trend.appearanceRate,
    appearanceRateCiLower: trend.appearanceRateCiLower,
    appearanceRateCiUpper: trend.appearanceRateCiUpper,
    zscore: trend.zscore,
  }));

  return {
    weekStartDate,
    boardKey,
    totalPosts,
    terms,
  };
}

/**
 * 利用可能な週のリストを取得
 */
export async function getAvailableWeeks(
  params: AvailableWeeksParams
): Promise<AvailableWeeksResponse> {
  const { boardKey, termId } = params;

  if (termId) {
    // 回帰分析グラフ用：指定された名詞の回帰分析結果が存在し、かつ過去8週間のデータが存在する週のみを返す
    const regression = await prisma.termRegressionResult.findUnique({
      where: {
        boardKey_termId: {
          boardKey,
          termId: BigInt(termId),
        },
      },
    });

    if (!regression) {
      return {
        boardKey,
        termId,
        weeks: [],
      };
    }

    // analysis_end_dateを基準に、過去8週間のデータが存在する週を確認
    const analysisEndDate = new Date(regression.analysisEndDate);
    const weekStartDate7WeeksAgo = new Date(analysisEndDate);
    weekStartDate7WeeksAgo.setDate(weekStartDate7WeeksAgo.getDate() - 7 * 7); // 7週間前

    // 過去8週間のデータを取得
    const weeklyData = await prisma.weeklyTermTrend.findMany({
      where: {
        boardKey,
        termId: BigInt(termId),
        weekStartDate: {
          gte: weekStartDate7WeeksAgo,
          lte: analysisEndDate,
        },
      },
      select: {
        weekStartDate: true,
      },
      distinct: ["weekStartDate"],
      orderBy: {
        weekStartDate: "desc",
      },
    });

    // 過去8週間のデータが全て存在する基準週を計算
    // analysisEndDateから逆算して、過去8週間のデータが全て存在する週のみを返す
    const validWeeks: WeekInfo[] = [];
    
    // 各週について、過去8週間のデータが存在するか確認
    for (const week of weeklyData) {
      const weekStart = new Date(week.weekStartDate);
      const weekStart7WeeksAgo = new Date(weekStart);
      weekStart7WeeksAgo.setDate(weekStart7WeeksAgo.getDate() - 7 * 7);

      const count = await prisma.weeklyTermTrend.count({
        where: {
          boardKey,
          termId: BigInt(termId),
          weekStartDate: {
            gte: weekStart7WeeksAgo,
            lte: weekStart,
          },
        },
      });

      // 過去8週間のデータが全て存在する場合（8週分）
      if (count >= 8) {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // 日曜日

        validWeeks.push({
          weekStartDate: formatDate(weekStart),
          weekEndDate: formatDate(weekEnd),
        });
      }
    }

    return {
      boardKey,
      termId,
      weeks: validWeeks,
    };
  } else {
    // 通常の週次グラフ用：weekly_term_trendsに存在する全ての週を返す
    const weeks = await prisma.weeklyTermTrend.findMany({
      where: {
        boardKey,
      },
      select: {
        weekStartDate: true,
      },
      distinct: ["weekStartDate"],
      orderBy: {
        weekStartDate: "desc",
      },
    });

    const weekInfos: WeekInfo[] = weeks.map((week: { weekStartDate: Date }) => {
      const weekStart = new Date(week.weekStartDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6); // 日曜日

      return {
        weekStartDate: formatDate(weekStart),
        weekEndDate: formatDate(weekEnd),
      };
    });

    return {
      boardKey,
      weeks: weekInfos,
    };
  }
}


