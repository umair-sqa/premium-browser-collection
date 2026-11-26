import { describe, it, expect } from "vitest";
import {
  isSemverLike,
  rgbTripletValid,
  hslTintValid,
  gregorianToHijri,
  qiblaBearing,
  moonPhase,
  pad2,
  formatTime,
} from "../../packages/shared-utils/index.js";

describe("shared-utils", () => {
  it("validates semver-like versions", () => {
    expect(isSemverLike("1.0.0")).toBe(true);
    expect(isSemverLike("1.1")).toBe(true);
    expect(isSemverLike("abc")).toBe(false);
  });

  it("validates RGB and tint triplets", () => {
    expect(rgbTripletValid([18, 18, 20])).toBe(true);
    expect(rgbTripletValid([18, 18])).toBe(false);
    expect(hslTintValid([0.1, 0.2, 0.5])).toBe(true);
    expect(hslTintValid([0.1, 0.2, 1.5])).toBe(false);
  });

  it("formats time with padded digits", () => {
    expect(pad2(3)).toBe("03");
    expect(formatTime(new Date(2026, 0, 1, 9, 5, 7))).toMatch(/09:05:07/);
  });

  it("computes algorithmic Hijri approximation", () => {
    const h = gregorianToHijri(new Date(Date.UTC(2026, 0, 1)));
    expect(h.year).toBeGreaterThan(1400);
    expect(h.approximation).toBe(true);
    expect(h.formatted).toContain("AH");
  });

  it("computes Qibla bearing for known reference points", () => {
    const bearing = qiblaBearing(40.7128, -74.006); // NYC
    expect(bearing).toBeGreaterThan(50);
    expect(bearing).toBeLessThan(70);
  });

  it("computes moon phase approximation", () => {
    const phase = moonPhase(new Date("2026-01-15T12:00:00Z"));
    expect(phase.name).toBeTruthy();
    expect(phase.fraction).toBeGreaterThanOrEqual(0);
    expect(phase.fraction).toBeLessThanOrEqual(1);
  });
});
