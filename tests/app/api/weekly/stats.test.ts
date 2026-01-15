import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/app/api/weekly/stats/route";
import { getWeeklyStats } from "@/lib/api/weekly";
import { createValidationError, createServerError, validateDate } from "@/lib/api/errors";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

vi.mock("@/lib/api/weekly");
vi.mock("@/lib/api/errors", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/errors")>("@/lib/api/errors");
  return {
    ...actual,
    createValidationError: vi.fn(),
    createServerError: vi.fn(),
    validateDate: vi.fn((date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date).getTime())),
  };
});

describe("GET /api/weekly/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return weekly stats for valid parameters", async () => {
    vi.mocked(validateDate).mockReturnValue(true);
    
    const mockResponse = {
      weekStartDate: "2025-01-13",
      boardKey: "prog",
      totalPosts: 12345,
      terms: [
        {
          termId: 123,
          normalized: "python",
          postHits: 234,
          appearanceRate: 0.0189,
          appearanceRateCiLower: 0.0166,
          appearanceRateCiUpper: 0.0215,
          zscore: 3.45,
        },
      ],
    };

    vi.mocked(getWeeklyStats).mockResolvedValue(mockResponse);

    const request = new NextRequest(
      "http://localhost:3000/api/weekly/stats?weekStartDate=2025-01-13&boardKey=prog"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockResponse);
    expect(getWeeklyStats).toHaveBeenCalledWith({
      weekStartDate: "2025-01-13",
      boardKey: "prog",
      limit: undefined,
      sortBy: null,
      sortOrder: null,
    });
  });

  it("should return 400 when weekStartDate is missing", async () => {
    const mockErrorResponse = NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "Missing required parameters: weekStartDate and boardKey are required",
        },
      },
      { status: 400 }
    );

    vi.mocked(createValidationError).mockReturnValue(mockErrorResponse);

    const request = new NextRequest("http://localhost:3000/api/weekly/stats?boardKey=prog");

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(createValidationError).toHaveBeenCalled();
  });

  it("should return 400 when boardKey is missing", async () => {
    const mockErrorResponse = NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "Missing required parameters: weekStartDate and boardKey are required",
        },
      },
      { status: 400 }
    );

    vi.mocked(createValidationError).mockReturnValue(mockErrorResponse);

    const request = new NextRequest(
      "http://localhost:3000/api/weekly/stats?weekStartDate=2025-01-13"
    );

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(createValidationError).toHaveBeenCalled();
  });

  it("should return 400 when date format is invalid", async () => {
    vi.mocked(validateDate).mockReturnValue(false);
    
    const mockErrorResponse = NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "Invalid date format for weekStartDate. Expected YYYY-MM-DD",
        },
      },
      { status: 400 }
    );

    vi.mocked(createValidationError).mockReturnValue(mockErrorResponse);

    const request = new NextRequest(
      "http://localhost:3000/api/weekly/stats?weekStartDate=invalid&boardKey=prog"
    );

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(createValidationError).toHaveBeenCalled();
  });

  it("should handle optional parameters", async () => {
    vi.mocked(validateDate).mockReturnValue(true);
    
    const mockResponse = {
      weekStartDate: "2025-01-13",
      boardKey: "prog",
      totalPosts: 12345,
      terms: [],
    };

    vi.mocked(getWeeklyStats).mockResolvedValue(mockResponse);

    const request = new NextRequest(
      "http://localhost:3000/api/weekly/stats?weekStartDate=2025-01-13&boardKey=prog&limit=10&sortBy=zscore&sortOrder=desc"
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(getWeeklyStats).toHaveBeenCalledWith({
      weekStartDate: "2025-01-13",
      boardKey: "prog",
      limit: 10,
      sortBy: "zscore",
      sortOrder: "desc",
    });
  });

  it("should return 500 on server error", async () => {
    vi.mocked(validateDate).mockReturnValue(true);
    
    const mockErrorResponse = NextResponse.json(
      {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch weekly stats",
        },
      },
      { status: 500 }
    );

    vi.mocked(getWeeklyStats).mockRejectedValue(new Error("Database error"));
    vi.mocked(createServerError).mockReturnValue(mockErrorResponse);

    const request = new NextRequest(
      "http://localhost:3000/api/weekly/stats?weekStartDate=2025-01-13&boardKey=prog"
    );

    const response = await GET(request);

    expect(response.status).toBe(500);
  });
});

