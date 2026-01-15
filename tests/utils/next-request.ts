import { NextRequest } from "next/server";

/**
 * NextRequestを作成するヘルパー関数
 */
export function createNextRequest(url: string): NextRequest {
  return new NextRequest(url);
}

