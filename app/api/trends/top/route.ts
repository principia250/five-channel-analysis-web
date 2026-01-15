import { NextRequest, NextResponse } from "next/server";
import { getTopTrends } from "@/lib/api/trends";
import { createValidationError, createServerError, validateDate } from "@/lib/api/errors";
import type { TopTrendsResponse } from "@/lib/types/api";

export async function GET(
  request: NextRequest
): Promise<NextResponse<TopTrendsResponse | { error: unknown }>> {
  try {
    const searchParams = request.nextUrl.searchParams;

    // 必須パラメータの取得
    const boardKey = searchParams.get("boardKey");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    if (!boardKey || !fromDate || !toDate) {
      return createValidationError(
        "Missing required parameters: boardKey, fromDate, and toDate are required"
      );
    }

    // 日付形式のバリデーション
    if (!validateDate(fromDate)) {
      return createValidationError(
        "Invalid date format for fromDate. Expected YYYY-MM-DD",
        { fromDate }
      );
    }

    if (!validateDate(toDate)) {
      return createValidationError(
        "Invalid date format for toDate. Expected YYYY-MM-DD",
        { toDate }
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
    const validSortBy = ["postHits", "appearanceRate"];
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
    const result = await getTopTrends({
      boardKey,
      fromDate,
      toDate,
      limit,
      sortBy: sortBy as "postHits" | "appearanceRate" | undefined,
      sortOrder: sortOrder as "asc" | "desc" | undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/trends/top:", error);
    return createServerError(
      "Failed to fetch top trends",
      error instanceof Error ? { message: error.message } : undefined
    );
  }
}

