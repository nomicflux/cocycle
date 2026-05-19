import { describe, it, expect } from "vitest";
import { pairIntersects, pairIntersectsOn, tripleIntersectsOn, quadIntersectsOn, TORUS_PERIOD, } from "../src/math/intersection";
import { buildNerve } from "../src/math/nerve";
import { cohomology } from "../src/math/cohomology";
const D = (cx, cy, r) => ({
    id: `${cx},${cy},${r}`,
    cx, cy, r,
    color: "#000",
});
describe("TORUS_PERIOD", () => {
    it("matches the canvas extent (12 = MATH_MAX - MATH_MIN)", () => {
        expect(TORUS_PERIOD).toBe(12);
    });
});
describe("pairIntersectsTorus", () => {
    it("returns true for discs overlapping via horizontal wrap", () => {
        const a = D(-5, 0, 2.5);
        const b = D(5, 0, 2.5);
        expect(pairIntersects(a, b)).toBe(false);
        expect(pairIntersectsOn("torus", a, b)).toBe(true);
    });
    it("returns false for small far-apart discs", () => {
        expect(pairIntersectsOn("torus", D(-3, 0, 1), D(3, 0, 1))).toBe(false);
    });
    it("returns true when planar intersection already exists", () => {
        expect(pairIntersectsOn("torus", D(0, 0, 1), D(1, 0, 1))).toBe(true);
    });
    it("returns true for diagonal corner wraparound", () => {
        expect(pairIntersectsOn("torus", D(-5.5, -5.5, 1.5), D(5.5, 5.5, 1.5))).toBe(true);
    });
});
describe("tripleIntersectsTorus", () => {
    it("returns true for three discs sharing the identified corner via wrap", () => {
        const a = D(-5.5, -5.5, 1.5);
        const b = D(5.5, -5.5, 1.5);
        const c = D(5.5, 5.5, 1.5);
        expect(tripleIntersectsOn("torus", a, b, c)).toBe(true);
    });
    it("returns false when a pair doesn't intersect even on the torus", () => {
        expect(tripleIntersectsOn("torus", D(-3, 0, 1), D(3, 0, 1), D(0, 0, 1))).toBe(false);
    });
});
describe("quadIntersectsTorus", () => {
    it("returns true when four corners all meet the identified corner via wrap", () => {
        expect(quadIntersectsOn("torus", D(-5.5, -5.5, 1.5), D(5.5, -5.5, 1.5), D(-5.5, 5.5, 1.5), D(5.5, 5.5, 1.5))).toBe(true);
    });
    it("returns false when no torus point is in all four discs", () => {
        expect(quadIntersectsOn("torus", D(-3, 0, 1), D(0, -3, 1), D(3, 0, 1), D(0, 3, 1))).toBe(false);
    });
});
describe("buildNerve dispatch (4-disc torus loop)", () => {
    const discs = [
        D(-4.5, 0, 1.6),
        D(-1.5, 0, 1.6),
        D(1.5, 0, 1.6),
        D(4.5, 0, 1.6),
    ];
    it("planar mode: 3 edges (path), 0 triangles, 0 tetrahedra", () => {
        const nerve = buildNerve(discs);
        expect(nerve.byDim[0]).toHaveLength(4);
        expect(nerve.byDim[1]).toHaveLength(3);
        expect(nerve.byDim[2]).toHaveLength(0);
        expect(nerve.byDim[3]).toHaveLength(0);
    });
    it("torus mode: 4 edges (cycle), 0 triangles", () => {
        const nerve = buildNerve(discs, 3, { space: "torus" });
        expect(nerve.byDim[0]).toHaveLength(4);
        expect(nerve.byDim[1]).toHaveLength(4);
        expect(nerve.byDim[2]).toHaveLength(0);
        const edgeKeys = nerve.byDim[1].map((e) => e.join(","));
        expect(edgeKeys).toContain("0,3");
    });
    it("planar H¹ = 0; torus H¹ = ℤ", () => {
        const planar = buildNerve(discs);
        const torus = buildNerve(discs, 3, { space: "torus" });
        expect(cohomology(planar, 1).rank).toBe(0);
        expect(cohomology(torus, 0).rank).toBe(1);
        expect(cohomology(torus, 1).rank).toBe(1);
    });
});
