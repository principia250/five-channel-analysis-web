import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "@/app/api/weekly/available/route";
import { getAvailableWeeks } from "@/lib/api/weekly";
import { createValidationError } from "@/lib/api/errors";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

vi.mock("@/lib/api/weekly");
vi.mock("@/lib/api/errors", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/errors")>("@/lib/api/errors");
  return {
    ...actual,
    createValidationError: vi.fn(),
  };
});

describe("GET /api/weekly/available", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return available weeks for boardKey", async () => {
    const mockResponse = {
      boardKey: "prog",
      weeks: [
        {
          weekStartDate: "2025-01-13",
          weekEndDate: "2025-01-19",
        },
        {
          weekStartDate: "2025-01-06",
          weekEndDate: "2025-01-12",
        },
      ],
    };

    vi.mocked(getAvailableWeeks).mockResolvedValue(mockResponse);

    const request = new NextRequest(
      "http://localhost:3000/api/weekly/available?boardKey=prog"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockResponse);
    expect(getAvailableWeeks).toHaveBeenCalledWith({
      boardKey: "prog",
      termId: undefined,
    });
  });

  it("should handle termId parameter for regression", async () => {
    const mockResponse = {
      boardKey: "prog",
      termId: 123,
      weeks: [
        {
          weekStartDate: "2025-01-13",
          weekEndDate: "2025-01-19",
        },
      ],
    };

    vi.mocked(getAvailableWeeks).mockResolvedValue(mockResponse);

    const request = new NextRequest(
      "http://localhost:3000/api/weekly/available?boardKey=prog&termId=123"
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockResponse);
    expect(getAvailableWeeks).toHaveBeenCalledWith({
      boardKey: "prog",
      termId: 123,
    });
  });

  it("should return 400 when boardKey is missing", async () => {
    const mockErrorResponse = NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "Missing required parameter: boardKey is required",
        },
      },
      { status: 400 }
    );

    vi.mocked(createValidationError).mockReturnValue(mockErrorResponse);

    const request = new NextRequest("http://localhost:3000/api/weekly/available");

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(createValidationError).toHaveBeenCalled();
  });

  it("should return 400 when termId is invalid", async () => {
    const mockErrorResponse = NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: "Invalid termId parameter. Must be a positive integer",
        },
      },
      { status: 400 }
    );

    vi.mocked(createValidationError).mockReturnValue(mockErrorResponse);

    const request = new NextRequest(
      "http://localhost:3000/api/weekly/available?boardKey=prog&termId=invalid"
    );

    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(createValidationError).toHaveBeenCalled();
  });
});

