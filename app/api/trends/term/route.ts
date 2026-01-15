import { NextRequest, NextResponse } from "next/server";
import { getTermTrend } from "@/lib/api/trends";
import { createValidationError, createServerError, validateDate } from "@/lib/api/errors";
import type { TermTrendResponse } from "@/lib/types/api";

export async function GET(
  request: NextRequest
): Promise<NextResponse<TermTrendResponse | { error: unknown }>> {
  try {
    const searchParams = request.nextUrl.searchParams;

    // 必須パラメータの取得
    const termIdParam = searchParams.get("termId");
    const boardKey = searchParams.get("boardKey");
    const fromDate = searchParams.get("fromDate");
    const toDate = searchParams.get("toDate");

    if (!termIdParam || !boardKey || !fromDate || !toDate) {
      return createValidationError(
        "Missing required parameters: termId, boardKey, fromDate, and toDate are required"
      );
    }

    const termId = parseInt(termIdParam, 10);
    if (isNaN(termId) || termId < 1) {
      return createValidationError(
        "Invalid termId parameter. Must be a positive integer",
        { termId: termIdParam }
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

    // データ取得
    const result = await getTermTrend({
      termId,
      boardKey,
      fromDate,
      toDate,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/trends/term:", error);
    return createServerError(
      "Failed to fetch term trend",
      error instanceof Error ? { message: error.message } : undefined
    );
  }
}

