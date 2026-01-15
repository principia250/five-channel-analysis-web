import { NextResponse } from "next/server";
import type { ApiErrorResponse } from "@/lib/types/api";
import { formatDate } from "@/lib/utils/date";

/**
 * エラーレスポンスを作成
 */
export function createErrorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
      },
    },
    { status }
  );
}

/**
 * バリデーションエラーを作成
 */
export function createValidationError(
  message: string,
  details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  return createErrorResponse("BAD_REQUEST", message, 400, details);
}

/**
 * リソースが見つからないエラーを作成
 */
export function createNotFoundError(
  message: string,
  details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  return createErrorResponse("NOT_FOUND", message, 404, details);
}

/**
 * サーバーエラーを作成
 */
export function createServerError(
  message: string = "Internal server error",
  details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  return createErrorResponse("INTERNAL_SERVER_ERROR", message, 500, details);
}

/**
 * 日付文字列のバリデーション（YYYY-MM-DD形式）
 */
export function validateDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === formatDate(date);
}

