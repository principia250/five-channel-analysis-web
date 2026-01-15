import { describe, it, expect, beforeEach, vi } from "vitest";
import { getWeeklyStats, getAvailableWeeks } from "@/lib/api/weekly";
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

describe("weekly API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getWeeklyStats", () => {
    it("should return weekly stats with terms sorted by postHits", async () => {
      const mockTrends = [
        {
          weekStartDate: new Date("2025-01-13"),
          boardKey: "prog",
          termId: BigInt(1),
          postHits: 100,
          totalPosts: 1000,
          appearanceRate: 0.1,
          appearanceRateCiLower: 0.08,
          appearanceRateCiUpper: 0.12,
          zscore: 2.0,
          term: {
            termId: BigInt(1),
            normalized: "python",
            isBlocked: false,
          },
        },
        {
          weekStartDate: new Date("2025-01-13"),
          boardKey: "prog",
          termId: BigInt(2),
          postHits: 200,
          totalPosts: 1000,
          appearanceRate: 0.2,
          appearanceRateCiLower: 0.18,
          appearanceRateCiUpper: 0.22,
          zscore: 3.0,
          term: {
            termId: BigInt(2),
            normalized: "javascript",
            isBlocked: false,
          },
        },
      ];

      vi.mocked(prisma.weeklyTermTrend.findMany).mockResolvedValue(mockTrends as never);

      const result = await getWeeklyStats({
        weekStartDate: "2025-01-13",
        boardKey: "prog",
        sortBy: "postHits",
        sortOrder: "desc",
      });

      expect(result.weekStartDate).toBe("2025-01-13");
      expect(result.boardKey).toBe("prog");
      expect(result.totalPosts).toBe(1000);
      expect(result.terms).toHaveLength(2);
      expect(result.terms[0].termId).toBe(2); // postHitsが大きい順
      expect(result.terms[0].normalized).toBe("javascript");
      expect(result.terms[1].termId).toBe(1);
    });

    it("should filter out blocked terms", async () => {
      const mockTrends = [
        {
          weekStartDate: new Date("2025-01-13"),
          boardKey: "prog",
          termId: BigInt(1),
          postHits: 100,
          totalPosts: 1000,
          appearanceRate: 0.1,
          appearanceRateCiLower: 0.08,
          appearanceRateCiUpper: 0.12,
          zscore: 2.0,
          term: {
            termId: BigInt(1),
            normalized: "python",
            isBlocked: false,
          },
        },
      ];

      vi.mocked(prisma.weeklyTermTrend.findMany).mockResolvedValue(mockTrends as never);

      const result = await getWeeklyStats({
        weekStartDate: "2025-01-13",
        boardKey: "prog",
      });

      expect(prisma.weeklyTermTrend.findMany).toHaveBeenCalled();
    });

    it("should return empty array when no trends found", async () => {
      vi.mocked(prisma.weeklyTermTrend.findMany).mockResolvedValue([]);

      const result = await getWeeklyStats({
        weekStartDate: "2025-01-13",
        boardKey: "prog",
      });

      expect(result.terms).toHaveLength(0);
      expect(result.totalPosts).toBe(0);
    });

    it("should limit results when limit is specified", async () => {
      const mockTrends = Array.from({ length: 10 }, (_, i) => ({
        weekStartDate: new Date("2025-01-13"),
        boardKey: "prog",
        termId: BigInt(i + 1),
        postHits: 100 - i,
        totalPosts: 1000,
        appearanceRate: 0.1,
        appearanceRateCiLower: 0.08,
        appearanceRateCiUpper: 0.12,
        zscore: 2.0,
        term: {
          termId: BigInt(i + 1),
          normalized: `term${i + 1}`,
          isBlocked: false,
        },
      }));

      vi.mocked(prisma.weeklyTermTrend.findMany).mockResolvedValue(mockTrends as never);

      const result = await getWeeklyStats({
        weekStartDate: "2025-01-13",
        boardKey: "prog",
        limit: 5,
      });

      expect(result.terms).toHaveLength(5);
    });
  });

  describe("getAvailableWeeks", () => {
    it("should return available weeks for boardKey", async () => {
      const mockWeeks = [
        { weekStartDate: new Date("2025-01-13") },
        { weekStartDate: new Date("2025-01-06") },
        { weekStartDate: new Date("2024-12-30") },
      ];

      vi.mocked(prisma.weeklyTermTrend.findMany).mockResolvedValue(mockWeeks as never);

      const result = await getAvailableWeeks({
        boardKey: "prog",
      });

      expect(result.weeks).toHaveLength(3);
      expect(result.weeks[0].weekStartDate).toBe("2025-01-13");
      expect(result.weeks[0].weekEndDate).toBe("2025-01-19"); // 月曜日 + 6日 = 日曜日
    });

    it("should return empty array when no weeks found", async () => {
      vi.mocked(prisma.weeklyTermTrend.findMany).mockResolvedValue([]);

      const result = await getAvailableWeeks({
        boardKey: "prog",
      });

      expect(result.weeks).toHaveLength(0);
    });

    it("should return available weeks for regression term", async () => {
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
      };

      const mockWeeks = [
        { weekStartDate: new Date("2025-01-13") },
        { weekStartDate: new Date("2025-01-06") },
      ];

      vi.mocked(prisma.termRegressionResult.findUnique).mockResolvedValue(mockRegression as never);
      vi.mocked(prisma.weeklyTermTrend.findMany).mockResolvedValue(mockWeeks as never);
      vi.mocked(prisma.weeklyTermTrend.count).mockResolvedValue(8);

      const result = await getAvailableWeeks({
        boardKey: "prog",
        termId: 1,
      });

      expect(result.termId).toBe(1);
      expect(prisma.termRegressionResult.findUnique).toHaveBeenCalled();
    });

    it("should return empty array when regression result not found", async () => {
      vi.mocked(prisma.termRegressionResult.findUnique).mockResolvedValue(null);

      const result = await getAvailableWeeks({
        boardKey: "prog",
        termId: 999,
      });

      expect(result.weeks).toHaveLength(0);
      expect(result.termId).toBe(999);
    });
  });
});

