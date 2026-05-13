import { describe, it, expect } from "vitest";
import type { Disc, Nerve } from "../src/state/types";
import { buildNerve } from "../src/math/nerve";
import { cohomology } from "../src/math/cohomology";
import { connectedComponents } from "../src/math/components";

const D = (cx: number, cy: number, r: number): Disc => ({ id: `${cx},${cy},${r}`, cx, cy, r });

describe("cohomology of S^1 (3 discs in the triangle-hole configuration)", () => {
  const r = 1.1;
  const discs = [D(0, 0, r), D(2, 0, r), D(1, Math.sqrt(3), r)];
  const nerve = buildNerve(discs);
  it("H^0 = Z", () => {
    const h0 = cohomology(nerve, 0);
    expect(h0.rank).toBe(1);
    expect(h0.torsion).toEqual([]);
  });
  it("H^1 = Z", () => {
    const h1 = cohomology(nerve, 1);
    expect(h1.rank).toBe(1);
    expect(h1.torsion).toEqual([]);
  });
  it("H^2 = 0", () => {
    const h2 = cohomology(nerve, 2);
    expect(h2.rank).toBe(0);
  });
});

describe("cohomology of a single disc (contractible)", () => {
  const nerve = buildNerve([D(0, 0, 1)]);
  it("H^0 = Z", () => {
    expect(cohomology(nerve, 0).rank).toBe(1);
  });
  it("H^1 = 0", () => {
    expect(cohomology(nerve, 1).rank).toBe(0);
  });
});

describe("cohomology of two disjoint discs", () => {
  const nerve = buildNerve([D(0, 0, 1), D(10, 0, 1)]);
  it("H^0 = Z^2", () => {
    expect(cohomology(nerve, 0).rank).toBe(2);
  });
  it("H^1 = 0", () => {
    expect(cohomology(nerve, 1).rank).toBe(0);
  });
});

describe("cohomology of S^2 (synthetic ∂Δ³ nerve, since R² cannot host it)", () => {
  // 4 vertices, 6 edges, 4 triangles, 0 tetrahedra.
  const nerve: Nerve = {
    byDim: [
      [[0], [1], [2], [3]],
      [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]],
      [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]],
      [],
    ],
  };
  it("H^0 = Z", () => {
    expect(cohomology(nerve, 0).rank).toBe(1);
  });
  it("H^1 = 0", () => {
    const h1 = cohomology(nerve, 1);
    expect(h1.rank).toBe(0);
    expect(h1.torsion).toEqual([]);
  });
  it("H^2 = Z", () => {
    const h2 = cohomology(nerve, 2);
    expect(h2.rank).toBe(1);
    expect(h2.torsion).toEqual([]);
  });
});

describe("connectedComponents", () => {
  it("returns one component per vertex on 4 disjoint vertices", () => {
    const nerve: Nerve = { byDim: [[[0], [1], [2], [3]], []] };
    expect(connectedComponents(nerve)).toEqual([0, 1, 2, 3]);
  });
  it("merges via edges", () => {
    const nerve: Nerve = {
      byDim: [[[0], [1], [2], [3]], [[0, 1], [2, 3]]],
    };
    const c = connectedComponents(nerve);
    expect(c[0]).toBe(c[1]);
    expect(c[2]).toBe(c[3]);
    expect(c[0]).not.toBe(c[2]);
  });
});

describe("cocycle basis includes representatives of H^1 generators", () => {
  const r = 1.1;
  const discs = [D(0, 0, r), D(2, 0, r), D(1, Math.sqrt(3), r)];
  const nerve = buildNerve(discs);
  it("has a non-coboundary cocycle for the S^1 case", () => {
    const h1 = cohomology(nerve, 1);
    expect(h1.cocycleBasis.length).toBeGreaterThan(0);
    const nonCobd = h1.cocycleBasis.filter((c) => !c.isCoboundary);
    expect(nonCobd.length).toBeGreaterThanOrEqual(1);
  });
});
