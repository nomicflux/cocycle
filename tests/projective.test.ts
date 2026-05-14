import { describe, it, expect } from "vitest";
import type { Disc } from "../src/state/types";
import {
  pairIntersectsOn,
  normalizePosition,
} from "../src/math/intersection";
import { buildNerve } from "../src/math/nerve";
import { cohomology } from "../src/math/cohomology";

const D = (cx: number, cy: number, r: number): Disc => ({
  id: `${cx},${cy},${r}`, cx, cy, r, color: "#000",
});

describe("RP²: both wraps are twisted", () => {
  it("horizontal wrap of an off-axis disc flips y, breaking torus closure", () => {
    const a = D(-5, 1, 1.1);
    const b = D(5, 1, 1.1);
    expect(pairIntersectsOn("torus", a, b)).toBe(true);
    expect(pairIntersectsOn("projective", a, b)).toBe(false);
  });
  it("vertical wrap of an off-axis disc flips x, breaking torus closure", () => {
    const a = D(1, -5, 1.1);
    const b = D(1, 5, 1.1);
    expect(pairIntersectsOn("torus", a, b)).toBe(true);
    expect(pairIntersectsOn("projective", a, b)).toBe(false);
  });
  it("axial wraps still close because the flipped axis is zero", () => {
    const a = D(-5, 0, 2.5);
    const b = D(5, 0, 2.5);
    expect(pairIntersectsOn("projective", a, b)).toBe(true);
  });
  it("normalizePosition wraps with the opposite-axis flip", () => {
    expect(normalizePosition(2, 7, "projective")).toEqual({ cx: -2, cy: -5 });
    expect(normalizePosition(7, 2, "projective")).toEqual({ cx: -5, cy: -2 });
  });
});

describe("RP²-twist preset (off-axis 4-chain at y = 1)", () => {
  const discs = [
    D(-4.5, 1, 1.6),
    D(-1.5, 1, 1.6),
    D(1.5, 1, 1.6),
    D(4.5, 1, 1.6),
  ];
  it("planar: 3 edges (path)", () => {
    const nerve = buildNerve(discs, 3, { space: "planar" });
    expect(nerve.byDim[1]).toHaveLength(3);
  });
  it("torus: 4 edges (horizontal wrap closes the loop)", () => {
    const nerve = buildNerve(discs, 3, { space: "torus" });
    expect(nerve.byDim[1]).toHaveLength(4);
  });
  it("klein: 4 edges (x-wrap plain on Klein)", () => {
    const nerve = buildNerve(discs, 3, { space: "klein" });
    expect(nerve.byDim[1]).toHaveLength(4);
  });
  it("projective: 3 edges (x-wrap flips y, breaks closure)", () => {
    const nerve = buildNerve(discs, 3, { space: "projective" });
    expect(nerve.byDim[1]).toHaveLength(3);
  });
  it("H¹: planar=0, torus=ℤ, klein=ℤ, projective=0", () => {
    expect(cohomology(buildNerve(discs, 3, { space: "planar" }), 1).rank).toBe(0);
    expect(cohomology(buildNerve(discs, 3, { space: "torus" }), 1).rank).toBe(1);
    expect(cohomology(buildNerve(discs, 3, { space: "klein" }), 1).rank).toBe(1);
    expect(cohomology(buildNerve(discs, 3, { space: "projective" }), 1).rank).toBe(0);
  });
});
