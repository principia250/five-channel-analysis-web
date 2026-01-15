import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/app/api/regression/term/route";
import { getRegressionTerm } from "@/lib/api/regression";
import { createValidationError, createNotFoundError, validateDate } from "@/lib/api/errors";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

vi.mock("@/lib/api/regression");
vi.mock("@/lib/api/errors", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/errors")>("@/lib/api/errors");
  return {
    ...actual,
    createValidationError: vi.fn(),
    createNotFoundError: vi.fn(),
    validateDate: vi.fn((date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date).getTime())),
  };
});

describe("GET /api/regression/term", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return regression result for valid parameters", async () => {
    vi.mocked(validateDate).mockReturnValue(true);
    
    const mockResponse = {
      termId: 123,
      normalized: "python",
      boardKey: "prog",
      regression: {
        intercept: 0.0123,
        slope: 0.0005,
        interceptCiLower: 0.0101,
        interceptCiUpper: 0.0145,
        slopeCiLower: 0.0003,
        slopeCiUpper: 0.0007,
        pValue: 0.0023,
        analysisStartDate: "2024-11-25",
        analysisEndDate: "2025-01-13",
      },
      data: [
        {
          weekStartDate: "2024-11-25",
          weekIndex: 0,
          postHits: 156,
          appearanceRate: 0.0139,
        },
      ],
    };

    vi.mocked(getRegressionTerm).mockResolvedValue(mockResponse);

    const request = new NextRequest(
      "http://localhost:3000/api/regression/term?termId=123&boardKey=prog&weekStartDate=2025-01-13"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockResponse);
    expect(getRegressionTerm).toHaveBeenCalledWith({
      termId: 123,
      boardKey: "prog",
      weekStartDate: "2025-01-13",
    });
  });

  it("should use latest week when weekStartDate is not specified", async () => {
    const mockResponse = {
      termId: 123,
      normalized: "python",
      boardKey: "prog",
      regression: {
        intercept: 0.0123,
        slope: 0.0005,
        interceptCiLower: 0.0101,
        interceptCiUpper: 0.0145,
        slopeCiLower: 0.0003,
        slopeCiUpper: 0.0007,
        pValue: 0.0023,
        analysisStartDate: "2024-11-25",
        analysisEndDate: "2025-01-13",
      },
      data: [],
    };

    vi.mocked(getRegressionTerm).mockResolvedValue(mockResponse);

    const request = new NextRequest(
      "http://localhost:3000/api/regression/term?termId=123&boardKey=prog"
    );

    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(getRegressionTerm).toHaveBeenCalledWith({
      termId: 123,
      boardKey: "prog",
      weekStartDate: undefined,
    });
  });

  it("should return 400 when required parameters are missing", async () => {
    const mockErrorResponse = NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "Missing required parameters: termId and boardKey are required",
        },
      },
      { status: 400 }
    );

    vi.mocked(createValidationError).mockReturnValue(mockErrorResponse);

    const request = new NextRequest("http://localhost:3000/api/regression/term?boardKey=prog");

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(createValidationError).toHaveBeenCalled();
  });

  it("should return 404 when regression result not found", async () => {
    const mockErrorResponse = NextResponse.json(
      {
        error: {
          code: "NOT_FOUND",
          message: "Regression result not found for termId: 999, boardKey: prog",
        },
      },
      { status: 404 }
    );

    vi.mocked(getRegressionTerm).mockRejectedValue(
      new Error("Regression result not found for termId: 999, boardKey: prog")
    );
    vi.mocked(createNotFoundError).mockReturnValue(mockErrorResponse);

    const request = new NextRequest(
      "http://localhost:3000/api/regression/term?termId=999&boardKey=prog"
    );

    const response = await GET(request);

    expect(response.status).toBe(404);
    expect(createNotFoundError).toHaveBeenCalled();
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
      "http://localhost:3000/api/regression/term?termId=123&boardKey=prog&weekStartDate=invalid"
    );

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(createValidationError).toHaveBeenCalled();
  });
});

