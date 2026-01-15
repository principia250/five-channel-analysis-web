import { NextRequest, NextResponse } from "next/server";
import { getAvailableWeeks } from "@/lib/api/weekly";
import { createValidationError, createServerError } from "@/lib/api/errors";
import type { AvailableWeeksResponse } from "@/lib/types/api";

export async function GET(
  request: NextRequest
): Promise<NextResponse<AvailableWeeksResponse | { error: unknown }>> {
  try {
    const searchParams = request.nextUrl.searchParams;

    // 必須パラメータの取得
    const boardKey = searchParams.get("boardKey");

    if (!boardKey) {
      return createValidationError("Missing required parameter: boardKey is required");
    }

    // オプションパラメータの取得
    const termIdParam = searchParams.get("termId");
    const termId = termIdParam ? parseInt(termIdParam, 10) : undefined;

    if (termIdParam && (termId === undefined || isNaN(termId) || termId < 1)) {
      return createValidationError(
        "Invalid termId parameter. Must be a positive integer",
        { termId: termIdParam }
      );
    }

    // データ取得
    const result = await getAvailableWeeks({
      boardKey,
      termId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/weekly/available:", error);
    return createServerError(
      "Failed to fetch available weeks",
      error instanceof Error ? { message: error.message } : undefined
    );
  }
}

