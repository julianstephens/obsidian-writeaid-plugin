import { describe, it, expect } from "vitest";

describe("WordCountDonut", () => {
  describe("percentage calculation", () => {
    it("should calculate correct percentage for typical values", () => {
      const calculate = (current: number, target: number) => {
        const clampedCurrent = Math.max(0, Number.isFinite(current) ? current : 0);
        const clampedTarget = Math.max(0, Number.isFinite(target) ? target : 0);
        return clampedTarget > 0
          ? Math.min(100, Math.round((clampedCurrent / clampedTarget) * 100))
          : 0;
      };

      expect(calculate(5000, 10000)).toBe(50);
      expect(calculate(7500, 10000)).toBe(75);
      expect(calculate(2500, 10000)).toBe(25);
      expect(calculate(10000, 10000)).toBe(100);
    });

    it("should handle edge cases", () => {
      const calculate = (current: number, target: number) => {
        const clampedCurrent = Math.max(0, Number.isFinite(current) ? current : 0);
        const clampedTarget = Math.max(0, Number.isFinite(target) ? target : 0);
        return clampedTarget > 0
          ? Math.min(100, Math.round((clampedCurrent / clampedTarget) * 100))
          : 0;
      };

      // Zero target should return 0
      expect(calculate(5000, 0)).toBe(0);

      // Zero current should return 0
      expect(calculate(0, 10000)).toBe(0);

      // Both zero should return 0
      expect(calculate(0, 0)).toBe(0);

      // Over target should cap at 100
      expect(calculate(12000, 10000)).toBe(100);
      expect(calculate(20000, 10000)).toBe(100);
    });

    it("should handle negative values by clamping to 0", () => {
      const calculate = (current: number, target: number) => {
        const clampedCurrent = Math.max(0, Number.isFinite(current) ? current : 0);
        const clampedTarget = Math.max(0, Number.isFinite(target) ? target : 0);
        return clampedTarget > 0
          ? Math.min(100, Math.round((clampedCurrent / clampedTarget) * 100))
          : 0;
      };

      expect(calculate(-5000, 10000)).toBe(0);
      expect(calculate(5000, -10000)).toBe(0);
      expect(calculate(-5000, -10000)).toBe(0);
    });

    it("should handle non-finite values", () => {
      const calculate = (current: number, target: number) => {
        const clampedCurrent = Math.max(0, Number.isFinite(current) ? current : 0);
        const clampedTarget = Math.max(0, Number.isFinite(target) ? target : 0);
        return clampedTarget > 0
          ? Math.min(100, Math.round((clampedCurrent / clampedTarget) * 100))
          : 0;
      };

      expect(calculate(NaN, 10000)).toBe(0);
      expect(calculate(5000, NaN)).toBe(0);
      // Infinity is not finite, so it gets clamped to 0
      expect(calculate(Infinity, 10000)).toBe(0);
      expect(calculate(5000, Infinity)).toBe(0);
    });

    it("should round to nearest integer", () => {
      const calculate = (current: number, target: number) => {
        const clampedCurrent = Math.max(0, Number.isFinite(current) ? current : 0);
        const clampedTarget = Math.max(0, Number.isFinite(target) ? target : 0);
        return clampedTarget > 0
          ? Math.min(100, Math.round((clampedCurrent / clampedTarget) * 100))
          : 0;
      };

      // 33.33... should round to 33
      expect(calculate(1000, 3000)).toBe(33);

      // 66.66... should round to 67
      expect(calculate(2000, 3000)).toBe(67);

      // 50.5 should round to 51
      expect(calculate(5050, 10000)).toBe(51);

      // 50.4 should round to 50
      expect(calculate(5040, 10000)).toBe(50);
    });
  });
});
