import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/app/api/trends/term/route";
import { getTermTrend } from "@/lib/api/trends";
import { createValidationError, validateDate } from "@/lib/api/errors";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

vi.mock("@/lib/api/trends");
vi.mock("@/lib/api/errors", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/errors")>("@/lib/api/errors");
  return {
    ...actual,
    createValidationError: vi.fn(),
    validateDate: vi.fn((date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date).getTime())),
  };
});

describe("GET /api/trends/term", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return term trend for valid parameters", async () => {
    vi.mocked(validateDate).mockReturnValue(true);
    
    const mockResponse = {
      termId: 123,
      normalized: "python",
      boardKey: "prog",
      data: [
        {
          weekStartDate: "2025-01-06",
          postHits: 189,
          appearanceRate: 0.0159,
          appearanceRateCiLower: 0.0138,
          appearanceRateCiUpper: 0.0183,
        },
        {
          weekStartDate: "2025-01-13",
          postHits: 234,
          appearanceRate: 0.0189,
          appearanceRateCiLower: 0.0166,
          appearanceRateCiUpper: 0.0215,
        },
      ],
    };

    vi.mocked(getTermTrend).mockResolvedValue(mockResponse);

    const request = new NextRequest(
      "http://localhost:3000/api/trends/term?termId=123&boardKey=prog&fromDate=2025-01-06&toDate=2025-01-13"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockResponse);
    expect(getTermTrend).toHaveBeenCalledWith({
      termId: 123,
      boardKey: "prog",
      fromDate: "2025-01-06",
      toDate: "2025-01-13",
    });
  });

  it("should return 400 when required parameters are missing", async () => {
    const mockErrorResponse = NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message:
            "Missing required parameters: termId, boardKey, fromDate, and toDate are required",
        },
      },
      { status: 400 }
    );

    vi.mocked(createValidationError).mockReturnValue(mockErrorResponse);

    const request = new NextRequest("http://localhost:3000/api/trends/term?boardKey=prog");

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(createValidationError).toHaveBeenCalled();
  });

  it("should return 400 when date format is invalid", async () => {
    vi.mocked(validateDate).mockImplementation((date: string) => {
      return date !== "invalid" && /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date).getTime());
    });
    
    const mockErrorResponse = NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "Invalid date format for fromDate. Expected YYYY-MM-DD",
        },
      },
      { status: 400 }
    );

    vi.mocked(createValidationError).mockReturnValue(mockErrorResponse);

    const request = new NextRequest(
      "http://localhost:3000/api/trends/term?termId=123&boardKey=prog&fromDate=invalid&toDate=2025-01-13"
    );

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(createValidationError).toHaveBeenCalled();
  });
});

