import { describe, it, expect, beforeEach, vi } from "vitest";
import { getTermTrend, getTopTrends } from "@/lib/api/trends";
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

describe("trends API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTermTrend", () => {
    it("should return term trend data for specified period", async () => {
      const mockTrends = [
        {
          weekStartDate: new Date("2025-01-06"),
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
          termId: BigInt(1),
          postHits: 120,
          totalPosts: 1100,
          appearanceRate: 0.109,
          appearanceRateCiLower: 0.09,
          appearanceRateCiUpper: 0.13,
          zscore: 2.5,
          term: {
            termId: BigInt(1),
            normalized: "python",
            isBlocked: false,
          },
        },
      ];

      vi.mocked(prisma.weeklyTermTrend.findMany).mockResolvedValue(mockTrends as never);

      const result = await getTermTrend({
        termId: 1,
        boardKey: "prog",
        fromDate: "2025-01-06",
        toDate: "2025-01-13",
      });

      expect(result.termId).toBe(1);
      expect(result.normalized).toBe("python");
      expect(result.boardKey).toBe("prog");
      expect(result.data).toHaveLength(2);
      expect(result.data[0].weekStartDate).toBe("2025-01-06");
      expect(result.data[0].postHits).toBe(100);
      expect(result.data[1].weekStartDate).toBe("2025-01-13");
      expect(result.data[1].postHits).toBe(120);
    });

    it("should return empty data when no trends found", async () => {
      vi.mocked(prisma.weeklyTermTrend.findMany).mockResolvedValue([]);
      vi.mocked(prisma.term.findUnique).mockResolvedValue({
        termId: BigInt(1),
        normalized: "python",
        isBlocked: false,
        needsReview: false,
        blockedReason: null,
        surfaceExamples: [],
        createdAt: new Date(),
      });

      const result = await getTermTrend({
        termId: 1,
        boardKey: "prog",
        fromDate: "2025-01-06",
        toDate: "2025-01-13",
      });

      expect(result.termId).toBe(1);
      expect(result.normalized).toBe("python");
      expect(result.data).toHaveLength(0);
    });

    it("should filter out blocked terms", async () => {
      vi.mocked(prisma.weeklyTermTrend.findMany).mockResolvedValue([]);

      await getTermTrend({
        termId: 1,
        boardKey: "prog",
        fromDate: "2025-01-06",
        toDate: "2025-01-13",
      });

      expect(prisma.weeklyTermTrend.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            term: {
              isBlocked: false,
            },
          }),
        })
      );
    });
  });

  describe("getTopTrends", () => {
    it("should return top N terms by postHits sum", async () => {
      const mockTrends = [
        {
          weekStartDate: new Date("2025-01-06"),
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
          termId: BigInt(1),
          postHits: 120,
          totalPosts: 1100,
          appearanceRate: 0.109,
          appearanceRateCiLower: 0.09,
          appearanceRateCiUpper: 0.13,
          zscore: 2.5,
          term: {
            termId: BigInt(1),
            normalized: "python",
            isBlocked: false,
          },
        },
        {
          weekStartDate: new Date("2025-01-06"),
          boardKey: "prog",
          termId: BigInt(2),
          postHits: 50,
          totalPosts: 1000,
          appearanceRate: 0.05,
          appearanceRateCiLower: 0.04,
          appearanceRateCiUpper: 0.06,
          zscore: 1.0,
          term: {
            termId: BigInt(2),
            normalized: "javascript",
            isBlocked: false,
          },
        },
        {
          weekStartDate: new Date("2025-01-13"),
          boardKey: "prog",
          termId: BigInt(2),
          postHits: 60,
          totalPosts: 1100,
          appearanceRate: 0.055,
          appearanceRateCiLower: 0.045,
          appearanceRateCiUpper: 0.065,
          zscore: 1.2,
          term: {
            termId: BigInt(2),
            normalized: "javascript",
            isBlocked: false,
          },
        },
      ];

      vi.mocked(prisma.weeklyTermTrend.findMany).mockResolvedValue(mockTrends as never);

      const result = await getTopTrends({
        boardKey: "prog",
        fromDate: "2025-01-06",
        toDate: "2025-01-13",
        limit: 2,
        sortBy: "postHits",
        sortOrder: "desc",
      });

      expect(result.boardKey).toBe("prog");
      expect(result.terms).toHaveLength(2);
      expect(result.terms[0].termId).toBe(1); // postHits合計: 220
      expect(result.terms[0].normalized).toBe("python");
      expect(result.terms[1].termId).toBe(2); // postHits合計: 110
      expect(result.terms[0].data).toHaveLength(2);
    });

    it("should return empty array when no trends found", async () => {
      vi.mocked(prisma.weeklyTermTrend.findMany).mockResolvedValue([]);

      const result = await getTopTrends({
        boardKey: "prog",
        fromDate: "2025-01-06",
        toDate: "2025-01-13",
      });

      expect(result.terms).toHaveLength(0);
    });

    it("should limit results to specified limit", async () => {
      const mockTrends = Array.from({ length: 30 }, (_, i) => ({
        weekStartDate: new Date("2025-01-06"),
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

      const result = await getTopTrends({
        boardKey: "prog",
        fromDate: "2025-01-06",
        toDate: "2025-01-13",
        limit: 10,
      });

      expect(result.terms).toHaveLength(10);
    });
  });
});

