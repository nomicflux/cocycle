import { describe, it, expect } from "vitest";
import { presets } from "../src/presets/examples";
import type { Cochain, Disc, Nerve, SimplexKey } from "../src/state/types";
import { simplexKey } from "../src/state/types";
import { cup } from "../src/math/cup";
import { buildNerve } from "../src/math/nerve";
import { cohomology } from "../src/math/cohomology";
import { faces } from "../src/math/coboundary";

const D = (cx: number, cy: number, r: number): Disc => ({
  id: `${cx},${cy},${r}`, cx, cy, r, color: "#000",
});

function deltaMap(
  values: Map<SimplexKey, number>,
  nerve: Nerve,
  k: number,
): Map<SimplexKey, number> {
  const out = new Map<SimplexKey, number>();
  for (const tau of nerve.byDim[k + 1] ?? []) {
    let acc = 0;
    for (const { face, sign } of faces(tau)) {
      acc += sign * (values.get(simplexKey(face)) ?? 0);
    }
    if (acc !== 0) out.set(simplexKey(tau), acc);
  }
  return out;
}

function addMaps(
  a: Map<SimplexKey, number>,
  b: Map<SimplexKey, number>,
): Map<SimplexKey, number> {
  const out = new Map<SimplexKey, number>();
  for (const [k, v] of a) out.set(k, v);
  for (const [k, v] of b) out.set(k, (out.get(k) ?? 0) + v);
  for (const [k, v] of out) if (v === 0) out.delete(k);
  return out;
}

function scaleMap(a: Map<SimplexKey, number>, s: number): Map<SimplexKey, number> {
  if (s === 0) return new Map();
  const out = new Map<SimplexKey, number>();
  for (const [k, v] of a) out.set(k, v * s);
  return out;
}

function mapsEqual(
  a: Map<SimplexKey, number>,
  b: Map<SimplexKey, number>,
): boolean {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) if (b.get(k) !== v) return false;
  return true;
}

const tetraNerve: Nerve = {
  byDim: [
    [[0], [1], [2], [3]],
    [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]],
    [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]],
    [],
  ],
};

describe("cup — degree composition", () => {
  it("cup of a p-cochain and q-cochain has degree p+q", () => {
    const a: Cochain = { degree: 1, values: new Map([["0,1", 3]]) };
    const b: Cochain = { degree: 1, values: new Map([["1,2", 5]]) };
    expect(cup(a, b, tetraNerve).degree).toBe(2);
  });
});

describe("cup — identity by constant-1 0-cochain", () => {
  const ones: Cochain = {
    degree: 0,
    values: new Map([["0", 1], ["1", 1], ["2", 1], ["3", 1]]),
  };
  const beta: Cochain = {
    degree: 1,
    values: new Map([["0,1", 2], ["1,2", -3], ["2,3", 5]]),
  };
  it("ones ∪ β = β (left identity on H^q)", () => {
    const r = cup(ones, beta, tetraNerve);
    expect(mapsEqual(r.values, beta.values)).toBe(true);
  });
  it("β ∪ ones = β (right identity on H^q)", () => {
    const r = cup(beta, ones, tetraNerve);
    expect(mapsEqual(r.values, beta.values)).toBe(true);
  });
});

describe("cup — Leibniz identity δ(a∪b) = (δa)∪b + (-1)^p · a∪(δb)", () => {
  function leibniz(a: Cochain, b: Cochain, nerve: Nerve): boolean {
    const ab = cup(a, b, nerve);
    const lhs = deltaMap(ab.values, nerve, ab.degree);
    const da: Cochain = { degree: a.degree + 1, values: deltaMap(a.values, nerve, a.degree) };
    const db: Cochain = { degree: b.degree + 1, values: deltaMap(b.values, nerve, b.degree) };
    const t1 = cup(da, b, nerve).values;
    const t2 = cup(a, db, nerve).values;
    const sign = a.degree % 2 === 0 ? 1 : -1;
    const rhs = addMaps(t1, scaleMap(t2, sign));
    return mapsEqual(lhs, rhs);
  }
  it("holds for two 0-cochains on the ∂Δ³ nerve", () => {
    const a: Cochain = { degree: 0, values: new Map([["0", 2], ["1", -1], ["2", 3], ["3", 0]]) };
    const b: Cochain = { degree: 0, values: new Map([["0", 1], ["1", 4], ["2", -2], ["3", 5]]) };
    expect(leibniz(a, b, tetraNerve)).toBe(true);
  });
  it("holds for a 0-cochain and a 1-cochain on ∂Δ³", () => {
    const a: Cochain = { degree: 0, values: new Map([["0", 1], ["1", -2], ["2", 3]]) };
    const b: Cochain = {
      degree: 1,
      values: new Map([["0,1", 1], ["1,2", -2], ["0,3", 4], ["2,3", 5]]),
    };
    expect(leibniz(a, b, tetraNerve)).toBe(true);
  });
  it("holds for two 1-cochains on ∂Δ³", () => {
    const a: Cochain = {
      degree: 1,
      values: new Map([["0,1", 1], ["1,2", 2], ["0,3", -1], ["2,3", 3]]),
    };
    const b: Cochain = {
      degree: 1,
      values: new Map([["0,2", 4], ["1,3", -2], ["0,1", 3], ["2,3", 1]]),
    };
    expect(leibniz(a, b, tetraNerve)).toBe(true);
  });
});

describe("torus-t2 preset (Möbius 7-disc triangulation)", () => {
  const preset = presets.find((p) => p.id === "torus-t2");
  if (!preset) throw new Error("torus-t2 preset missing");
  const discs: Disc[] = preset.discs.map((d, i) => ({
    id: `t${i}`, cx: d.cx, cy: d.cy, r: d.r, color: "#000",
  }));
  const nerve = buildNerve(discs, 3, { space: "torus" });
  it("realizes minimal simplicial T²: V=7, E=21, F=14, T=0", () => {
    expect(nerve.byDim[0]).toHaveLength(7);
    expect(nerve.byDim[1]).toHaveLength(21);
    expect(nerve.byDim[2]).toHaveLength(14);
    expect(nerve.byDim[3] ?? []).toHaveLength(0);
  });
  it("has H⁰ = ℤ, H¹ = ℤ², H² = ℤ", () => {
    expect(cohomology(nerve, 0).rank).toBe(1);
    expect(cohomology(nerve, 1).rank).toBe(2);
    expect(cohomology(nerve, 2).rank).toBe(1);
  });
  it("cup of the two H¹ generators is non-zero in some ordering", () => {
    const gens = cohomology(nerve, 1).cocycleBasis.filter((c) => !c.isCoboundary);
    expect(gens.length).toBeGreaterThanOrEqual(2);
    const someNonZero =
      cup(gens[0].cochain, gens[1].cochain, nerve).values.size > 0 ||
      cup(gens[1].cochain, gens[0].cochain, nerve).values.size > 0;
    expect(someNonZero).toBe(true);
  });
});

describe("cup — planar S¹ cover (no 2-simplices)", () => {
  const r = 1.1;
  const discs = [D(0, 0, r), D(2, 0, r), D(1, Math.sqrt(3), r)];
  const nerve = buildNerve(discs);
  it("nerve has no 2-simplices", () => {
    expect(nerve.byDim[2]).toHaveLength(0);
  });
  it("cup of any cochains lands in an empty 2-cochain space", () => {
    const cohK = cohomology(nerve, 1);
    const gen = cohK.cocycleBasis.find((c) => !c.isCoboundary);
    expect(gen).toBeDefined();
    if (!gen) return;
    const r = cup(gen.cochain, gen.cochain, nerve);
    expect(r.degree).toBe(2);
    expect(r.values.size).toBe(0);
  });
});
