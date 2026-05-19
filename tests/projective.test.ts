import { describe, it, expect } from "vitest";
import type { Disc } from "../src/state/types";
import {
  pairIntersectsOn,
  normalizePosition,
  pairComponentCount,
  tripleComponentCount,
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

// Regression: pair {0,8} on the 3×3 RP² grid has two planar overlapping lifts
// of disc 8 (at (-8,-4) via a⁻¹ and at (-4,-8) via b⁻¹), but those overlap
// regions share planar points (e.g. (-5,-5) is inside both lenses), so on RP²
// they form ONE connected component, not two. Before the union-find fix the
// algorithm naively reported 2.
describe("3×3 RP² cover: pair/triple components reflect chart-connectivity", () => {
  const D = (cx: number, cy: number, r: number): Disc => ({
    id: `${cx},${cy},${r}`, cx, cy, r, color: "#000",
  });
  const discs = [
    D(-4,-4,3.2), D(0,-4,3.2), D(4,-4,3.2),
    D(-4, 0,3.2), D(0, 0,3.2), D(4, 0,3.2),
    D(-4, 4,3.2), D(0, 4,3.2), D(4, 4,3.2),
  ];

  it("pair {0,8} has exactly 1 component on RP² (lenses share point (-5,-5))", () => {
    expect(pairComponentCount("projective", discs[0], discs[8])).toBe(1);
  });
  it("pair {2,6} has exactly 1 component on RP² (symmetric to {0,8})", () => {
    expect(pairComponentCount("projective", discs[2], discs[6])).toBe(1);
  });
  it("every pair has at most 1 component", () => {
    for (let i = 0; i < 9; i++) {
      for (let j = i + 1; j < 9; j++) {
        expect(pairComponentCount("projective", discs[i], discs[j])).toBeLessThanOrEqual(1);
      }
    }
  });
  it("every triple has at most 1 component", () => {
    for (let i = 0; i < 9; i++) {
      for (let j = i + 1; j < 9; j++) {
        for (let k = j + 1; k < 9; k++) {
          expect(tripleComponentCount("projective", discs[i], discs[j], discs[k]))
            .toBeLessThanOrEqual(1);
        }
      }
    }
  });
});

// Ground truth from the math (not from the algorithm): a region in RP² has n
// components iff its preimage in R² has n equivalence classes of connected
// cover-pieces under the deck action. Two lift-overlap regions that don't share
// a planar point but ARE the same RP² component (via deck identification) must
// be merged. The pre-deck-group heuristic only merged via planar overlap and so
// under-counts here.
describe("RP²: deck-identified lift-overlap regions (no planar overlap)", () => {
  it("large A contains four ε-images of B: one RP² component, not five", () => {
    // A is a disc at the origin with r = TORUS_PERIOD = 12. Its R²-disc reaches
    // (±12, 0) and (0, ±12) — the four ε-images of B. B itself sits at the
    // origin, inside A. So pairIntersects(A, lift) is true for five B-lifts:
    // the planar copy plus the four ε-images at (±12, 0) and (0, ±12).
    //
    // Each lift is a tiny disc (r=2) 12 units from every other lift → no two
    // lifts share a planar point → the planar-overlap heuristic merges nothing
    // and reports 5.
    //
    // Math: A's R²-disc has reach equal to one period, so its deck-orbit covers
    // R² and A_RP² = all of RP². B sits at a non-fixed point of the deck so its
    // image B_RP² is one disc. A ∩ B in RP² = B_RP² — ONE connected component.
    const A: Disc = { id: "A", cx: 0, cy: 0, r: 12, color: "#000" };
    const B: Disc = { id: "B", cx: 0, cy: 0, r: 2, color: "#000" };
    expect(pairComponentCount("projective", A, B)).toBe(1);
  });
});
