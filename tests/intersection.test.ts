import { describe, it, expect } from "vitest";
import type { Disc } from "../src/state/types";
import { pairIntersects, tripleIntersects, pointInDisc } from "../src/math/intersection";
import { buildNerve } from "../src/math/nerve";

const D = (cx: number, cy: number, r: number): Disc => ({ id: `${cx},${cy},${r}`, cx, cy, r, color: "#000" });

describe("pairIntersects", () => {
  it("returns true for overlapping discs", () => {
    expect(pairIntersects(D(0, 0, 1), D(1, 0, 1))).toBe(true);
  });
  it("returns true for tangent discs", () => {
    expect(pairIntersects(D(0, 0, 1), D(2, 0, 1))).toBe(true);
  });
  it("returns false for disjoint discs", () => {
    expect(pairIntersects(D(0, 0, 1), D(3, 0, 1))).toBe(false);
  });
  it("returns true when one contains the other", () => {
    expect(pairIntersects(D(0, 0, 5), D(0.1, 0, 0.1))).toBe(true);
  });
});

describe("tripleIntersects", () => {
  it("returns true for three fully overlapping discs", () => {
    expect(tripleIntersects(D(0, 0, 2), D(0.1, 0, 2), D(0, 0.1, 2))).toBe(true);
  });
  it("returns false for the 'triangle hole' configuration (pairwise but no triple)", () => {
    // equilateral triangle side 2, r=1.1: pairs overlap, centroid is at dist 2/sqrt(3) ~1.155 > 1.1
    const r = 1.1;
    const a = D(0, 0, r);
    const b = D(2, 0, r);
    const c = D(1, Math.sqrt(3), r);
    expect(pairIntersects(a, b)).toBe(true);
    expect(pairIntersects(a, c)).toBe(true);
    expect(pairIntersects(b, c)).toBe(true);
    expect(tripleIntersects(a, b, c)).toBe(false);
  });
  it("returns true when one disc is contained in the other two", () => {
    expect(tripleIntersects(D(0, 0, 10), D(0, 0, 5), D(0.1, 0, 0.5))).toBe(true);
  });
  it("returns false when any pair is disjoint", () => {
    expect(tripleIntersects(D(0, 0, 1), D(10, 0, 1), D(0.5, 0.5, 1))).toBe(false);
  });
});

describe("pointInDisc", () => {
  it("respects the closed-disc boundary", () => {
    expect(pointInDisc(1, 0, D(0, 0, 1))).toBe(true);
    expect(pointInDisc(1.001, 0, D(0, 0, 1))).toBe(false);
    expect(pointInDisc(0, 0, D(0, 0, 1))).toBe(true);
  });
});

describe("buildNerve with discs", () => {
  it("gives the 3-cycle nerve for the triangle-hole configuration", () => {
    const r = 1.1;
    const discs = [D(0, 0, r), D(2, 0, r), D(1, Math.sqrt(3), r)];
    const nerve = buildNerve(discs);
    expect(nerve.byDim[0]).toHaveLength(3);
    expect(nerve.byDim[1]).toHaveLength(3);
    expect(nerve.byDim[2]).toHaveLength(0);
    expect(nerve.byDim[3]).toHaveLength(0);
  });
  it("includes the 2-simplex when discs fully overlap", () => {
    const discs = [D(0, 0, 2), D(0.5, 0, 2), D(0.25, 0.5, 2)];
    const nerve = buildNerve(discs);
    expect(nerve.byDim[2]).toEqual([[0, 1, 2]]);
  });
  it("gives two components for disjoint discs", () => {
    const discs = [D(0, 0, 1), D(10, 0, 1)];
    const nerve = buildNerve(discs);
    expect(nerve.byDim[0]).toHaveLength(2);
    expect(nerve.byDim[1]).toHaveLength(0);
  });
});
