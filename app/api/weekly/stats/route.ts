import { NextRequest, NextResponse } from "next/server";
import { getWeeklyStats } from "@/lib/api/weekly";
import { createValidationError, createServerError, validateDate } from "@/lib/api/errors";
import type { WeeklyStatsResponse } from "@/lib/types/api";

export async function GET(request: NextRequest): Promise<NextResponse<WeeklyStatsResponse | { error: unknown }>> {
  try {
    const searchParams = request.nextUrl.searchParams;

    // 必須パラメータの取得
    const weekStartDate = searchParams.get("weekStartDate");
    const boardKey = searchParams.get("boardKey");

    if (!weekStartDate || !boardKey) {
      return createValidationError(
        "Missing required parameters: weekStartDate and boardKey are required"
      );
    }

    // 日付形式のバリデーション
    if (!validateDate(weekStartDate)) {
      return createValidationError(
        "Invalid date format for weekStartDate. Expected YYYY-MM-DD",
        { weekStartDate }
      );
    }

    // オプションパラメータの取得
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    if (limitParam && (limit === undefined || isNaN(limit) || limit < 1)) {
      return createValidationError(
        "Invalid limit parameter. Must be a positive integer",
        { limit: limitParam }
      );
    }

    const sortBy = searchParams.get("sortBy");
    const validSortBy = ["zscore", "postHits", "appearanceRate"];
    if (sortBy && !validSortBy.includes(sortBy)) {
      return createValidationError(
        `Invalid sortBy parameter. Must be one of: ${validSortBy.join(", ")}`,
        { sortBy }
      );
    }

    const sortOrder = searchParams.get("sortOrder");
    const validSortOrder = ["asc", "desc"];
    if (sortOrder && !validSortOrder.includes(sortOrder)) {
      return createValidationError(
        `Invalid sortOrder parameter. Must be one of: ${validSortOrder.join(", ")}`,
        { sortOrder }
      );
    }

    // データ取得
    const result = await getWeeklyStats({
      weekStartDate,
      boardKey,
      limit,
      sortBy: sortBy as "zscore" | "postHits" | "appearanceRate" | undefined,
      sortOrder: sortOrder as "asc" | "desc" | undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/weekly/stats:", error);
    return createServerError(
      "Failed to fetch weekly stats",
      error instanceof Error ? { message: error.message } : undefined
    );
  }
}

