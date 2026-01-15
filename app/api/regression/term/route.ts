import { NextRequest, NextResponse } from "next/server";
import { getRegressionTerm } from "@/lib/api/regression";
import {
  createValidationError,
  createServerError,
  createNotFoundError,
  validateDate,
} from "@/lib/api/errors";
import type { RegressionTermResponse } from "@/lib/types/api";

export async function GET(
  request: NextRequest
): Promise<NextResponse<RegressionTermResponse | { error: unknown }>> {
  try {
    const searchParams = request.nextUrl.searchParams;

    // 必須パラメータの取得
    const termIdParam = searchParams.get("termId");
    const boardKey = searchParams.get("boardKey");

    if (!termIdParam || !boardKey) {
      return createValidationError(
        "Missing required parameters: termId and boardKey are required"
      );
    }

    const termId = parseInt(termIdParam, 10);
    if (isNaN(termId) || termId < 1) {
      return createValidationError(
        "Invalid termId parameter. Must be a positive integer",
        { termId: termIdParam }
      );
    }

    // オプションパラメータの取得
    const weekStartDate = searchParams.get("weekStartDate");

    if (weekStartDate && !validateDate(weekStartDate)) {
      return createValidationError(
        "Invalid date format for weekStartDate. Expected YYYY-MM-DD",
        { weekStartDate }
      );
    }

    // データ取得
    const result = await getRegressionTerm({
      termId,
      boardKey,
      weekStartDate: weekStartDate || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/regression/term:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found") || error.message.includes("No weekly data")) {
        return createNotFoundError(error.message, {
          termId: request.nextUrl.searchParams.get("termId"),
          boardKey: request.nextUrl.searchParams.get("boardKey"),
        });
      }
    }

    return createServerError(
      "Failed to fetch regression term",
      error instanceof Error ? { message: error.message } : undefined
    );
  }
}

