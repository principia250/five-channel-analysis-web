import { describe, it, expect, beforeEach, vi } from "vitest";
import { getRegressionTerm } from "@/lib/api/regression";
import { prisma } from "@/lib/prisma/client";

vi.mock("@/lib/prisma/client", () => ({
  prisma: {
    weeklyTermTrend: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    term: {
      findUnique: vi.fn(),
    },
    termRegressionResult: {
      findUnique: vi.fn(),
    },
  },
}));

describe("regression API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getRegressionTerm", () => {
    it("should return regression result with weekly data", async () => {
      const mockRegression = {
        boardKey: "prog",
        termId: BigInt(1),
        intercept: 0.01,
        slope: 0.001,
        interceptCiLower: 0.009,
        interceptCiUpper: 0.011,
        slopeCiLower: 0.0008,
        slopeCiUpper: 0.0012,
        pValue: 0.05,
        analysisStartDate: new Date("2024-11-25"),
        analysisEndDate: new Date("2025-01-13"),
        createdAt: new Date(),
        updatedAt: new Date(),
        term: {
          termId: BigInt(1),
          normalized: "python",
          isBlocked: false,
          needsReview: false,
          blockedReason: null,
          surfaceExamples: [],
          createdAt: new Date(),
        },
      };

      const mockWeeklyData = Array.from({ length: 8 }, (_, i) => {
        const date = new Date("2025-01-13");
        date.setDate(date.getDate() - 7 * (7 - i));
        return {
          weekStartDate: date,
          boardKey: "prog",
          termId: BigInt(1),
          postHits: 100 + i * 10,
          totalPosts: 1000,
          appearanceRate: 0.1 + i * 0.001,
          appearanceRateCiLower: 0.08,
          appearanceRateCiUpper: 0.12,
          zscore: 2.0,
          createdAt: new Date(),
        };
      });

      vi.mocked(prisma.termRegressionResult.findUnique).mockResolvedValue(
        mockRegression as never
      );
      vi.mocked(prisma.weeklyTermTrend.findFirst).mockResolvedValue({
        weekStartDate: new Date("2025-01-13"),
      } as never);
      vi.mocked(prisma.weeklyTermTrend.findMany).mockResolvedValue(mockWeeklyData as never);

      const result = await getRegressionTerm({
        termId: 1,
        boardKey: "prog",
        weekStartDate: "2025-01-13",
      });

      expect(result.termId).toBe(1);
      expect(result.normalized).toBe("python");
      expect(result.boardKey).toBe("prog");
      expect(result.regression.intercept).toBe(0.01);
      expect(result.regression.slope).toBe(0.001);
      expect(result.data).toHaveLength(8);
      expect(result.data[0].weekIndex).toBe(0);
    });

    it("should use latest week when weekStartDate is not specified", async () => {
      const mockRegression = {
        boardKey: "prog",
        termId: BigInt(1),
        intercept: 0.01,
        slope: 0.001,
        interceptCiLower: 0.009,
        interceptCiUpper: 0.011,
        slopeCiLower: 0.0008,
        slopeCiUpper: 0.0012,
        pValue: 0.05,
        analysisStartDate: new Date("2024-11-25"),
        analysisEndDate: new Date("2025-01-13"),
        createdAt: new Date(),
        updatedAt: new Date(),
        term: {
          termId: BigInt(1),
          normalized: "python",
          isBlocked: false,
          needsReview: false,
          blockedReason: null,
          surfaceExamples: [],
          createdAt: new Date(),
        },
      };

      const mockLatestTrend = {
        weekStartDate: new Date("2025-01-13"),
      };

      const mockWeeklyData = Array.from({ length: 8 }, (_, i) => {
        const date = new Date("2025-01-13");
        date.setDate(date.getDate() - 7 * (7 - i));
        return {
          weekStartDate: date,
          boardKey: "prog",
          termId: BigInt(1),
          postHits: 100 + i * 10,
          totalPosts: 1000,
          appearanceRate: 0.1 + i * 0.001,
          appearanceRateCiLower: 0.08,
          appearanceRateCiUpper: 0.12,
          zscore: 2.0,
          createdAt: new Date(),
        };
      });

      vi.mocked(prisma.termRegressionResult.findUnique).mockResolvedValue(
        mockRegression as never
      );
      vi.mocked(prisma.weeklyTermTrend.findFirst).mockResolvedValue(
        mockLatestTrend as never
      );
      vi.mocked(prisma.weeklyTermTrend.findMany).mockResolvedValue(mockWeeklyData as never);

      const result = await getRegressionTerm({
        termId: 1,
        boardKey: "prog",
      });

      expect(prisma.weeklyTermTrend.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            termId: BigInt(1),
            boardKey: "prog",
          },
          orderBy: {
            weekStartDate: "desc",
          },
        })
      );
      expect(result.data).toHaveLength(8);
    });

    it("should throw error when regression result not found", async () => {
      vi.mocked(prisma.termRegressionResult.findUnique).mockResolvedValue(null);

      await expect(
        getRegressionTerm({
          termId: 999,
          boardKey: "prog",
        })
      ).rejects.toThrow("Regression result not found");
    });

    it("should throw error when no weekly data found", async () => {
      const mockRegression = {
        boardKey: "prog",
        termId: BigInt(1),
        intercept: 0.01,
        slope: 0.001,
        interceptCiLower: 0.009,
        interceptCiUpper: 0.011,
        slopeCiLower: 0.0008,
        slopeCiUpper: 0.0012,
        pValue: 0.05,
        analysisStartDate: new Date("2024-11-25"),
        analysisEndDate: new Date("2025-01-13"),
        createdAt: new Date(),
        updatedAt: new Date(),
        term: {
          termId: BigInt(1),
          normalized: "python",
          isBlocked: false,
          needsReview: false,
          blockedReason: null,
          surfaceExamples: [],
          createdAt: new Date(),
        },
      };

      vi.mocked(prisma.termRegressionResult.findUnique).mockResolvedValue(
        mockRegression as never
      );
      vi.mocked(prisma.weeklyTermTrend.findFirst).mockResolvedValue(null);

      await expect(
        getRegressionTerm({
          termId: 1,
          boardKey: "prog",
        })
      ).rejects.toThrow("No weekly data found");
    });
  });
});

