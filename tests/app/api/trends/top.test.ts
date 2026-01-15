import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/app/api/trends/top/route";
import { getTopTrends } from "@/lib/api/trends";
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

describe("GET /api/trends/top", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return top trends for valid parameters", async () => {
    vi.mocked(validateDate).mockReturnValue(true);
    
    const mockResponse = {
      boardKey: "prog",
      fromDate: "2025-01-06",
      toDate: "2025-01-13",
      terms: [
        {
          termId: 123,
          normalized: "python",
          data: [
            {
              weekStartDate: "2025-01-06",
              postHits: 189,
              appearanceRate: 0.0159,
            },
          ],
        },
      ],
    };

    vi.mocked(getTopTrends).mockResolvedValue(mockResponse);

    const request = new NextRequest(
      "http://localhost:3000/api/trends/top?boardKey=prog&fromDate=2025-01-06&toDate=2025-01-13"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockResponse);
    expect(getTopTrends).toHaveBeenCalledWith({
      boardKey: "prog",
      fromDate: "2025-01-06",
      toDate: "2025-01-13",
      limit: undefined,
      sortBy: null,
      sortOrder: null,
    });
  });

  it("should handle optional parameters", async () => {
    vi.mocked(validateDate).mockReturnValue(true);
    
    const mockResponse = {
      boardKey: "prog",
      fromDate: "2025-01-06",
      toDate: "2025-01-13",
      terms: [],
    };

    vi.mocked(getTopTrends).mockResolvedValue(mockResponse);

    const request = new NextRequest(
      "http://localhost:3000/api/trends/top?boardKey=prog&fromDate=2025-01-06&toDate=2025-01-13&limit=10&sortBy=appearanceRate&sortOrder=asc"
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(getTopTrends).toHaveBeenCalledWith({
      boardKey: "prog",
      fromDate: "2025-01-06",
      toDate: "2025-01-13",
      limit: 10,
      sortBy: "appearanceRate",
      sortOrder: "asc",
    });
  });

  it("should return 400 when required parameters are missing", async () => {
    const mockErrorResponse = NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "Missing required parameters: boardKey, fromDate, and toDate are required",
        },
      },
      { status: 400 }
    );

    vi.mocked(createValidationError).mockReturnValue(mockErrorResponse);

    const request = new NextRequest("http://localhost:3000/api/trends/top?boardKey=prog");

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(createValidationError).toHaveBeenCalled();
  });
});

