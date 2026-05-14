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

describe("Klein bottle: x-wrap is plain, y-wrap is twisted (x-flip)", () => {
  it("two discs that meet via horizontal wrap behave the same as on torus", () => {
    const a = D(-5, 0, 2.5);
    const b = D(5, 0, 2.5);
    expect(pairIntersectsOn("klein", a, b)).toBe(true);
    expect(pairIntersectsOn("torus", a, b)).toBe(true);
  });
  it("vertical wrap of an off-axis disc flips x, breaking torus-style closure", () => {
    const a = D(3, 5, 1);
    const b = D(3, -5, 1);
    expect(pairIntersectsOn("torus", a, b)).toBe(true);
    expect(pairIntersectsOn("klein", a, b)).toBe(false);
  });
  it("normalizePosition wraps y with x-flip, x without flip", () => {
    expect(normalizePosition(2, 7, "klein")).toEqual({ cx: -2, cy: -5 });
    expect(normalizePosition(7, 2, "klein")).toEqual({ cx: -5, cy: 2 });
  });
});

describe("Klein-twist preset (vertical 4-chain at x = 2)", () => {
  const discs = [
    D(2, -4.5, 1.6),
    D(2, -1.5, 1.6),
    D(2, 1.5, 1.6),
    D(2, 4.5, 1.6),
  ];
  it("planar: 3 edges (path)", () => {
    const nerve = buildNerve(discs, 3, { space: "planar" });
    expect(nerve.byDim[1]).toHaveLength(3);
  });
  it("torus: 4 edges (cycle from vertical wrap)", () => {
    const nerve = buildNerve(discs, 3, { space: "torus" });
    expect(nerve.byDim[1]).toHaveLength(4);
  });
  it("klein: 3 edges (twist breaks wrap closure)", () => {
    const nerve = buildNerve(discs, 3, { space: "klein" });
    expect(nerve.byDim[1]).toHaveLength(3);
  });
  it("H¹: planar=0, torus=ℤ, klein=0", () => {
    expect(cohomology(buildNerve(discs, 3, { space: "planar" }), 1).rank).toBe(0);
    expect(cohomology(buildNerve(discs, 3, { space: "torus" }), 1).rank).toBe(1);
    expect(cohomology(buildNerve(discs, 3, { space: "klein" }), 1).rank).toBe(0);
  });
});
