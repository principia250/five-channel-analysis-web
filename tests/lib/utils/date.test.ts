import { describe, it, expect } from "vitest";
import { formatDate, parseDate } from "@/lib/utils/date";

describe("date utils", () => {
  describe("formatDate", () => {
    it("should format date to YYYY-MM-DD", () => {
      const date = new Date("2025-01-13T00:00:00Z");
      expect(formatDate(date)).toBe("2025-01-13");
    });

    it("should pad single digit month and day", () => {
      const date = new Date("2025-01-05T00:00:00Z");
      expect(formatDate(date)).toBe("2025-01-05");
    });

    it("should handle different dates", () => {
      const date = new Date("2024-12-25T00:00:00Z");
      expect(formatDate(date)).toBe("2024-12-25");
    });
  });

  describe("parseDate", () => {
    it("should parse YYYY-MM-DD string to Date", () => {
      const dateString = "2025-01-13";
      const date = parseDate(dateString);
      expect(date.getUTCFullYear()).toBe(2025);
      expect(date.getUTCMonth()).toBe(0); // January is 0
      expect(date.getUTCDate()).toBe(13);
    });

    it("should handle single digit month and day", () => {
      const dateString = "2025-01-05";
      const date = parseDate(dateString);
      expect(date.getUTCFullYear()).toBe(2025);
      expect(date.getUTCMonth()).toBe(0);
      expect(date.getUTCDate()).toBe(5);
    });
  });
});

