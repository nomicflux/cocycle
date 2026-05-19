import { describe, it, expect } from "vitest";
import type { Disc, Nerve } from "../src/state/types";
import { buildNerve } from "../src/math/nerve";
import { cohomology, classCoordinates, isCoboundary } from "../src/math/cohomology";
import { cup } from "../src/math/cup";
import { presets } from "../src/presets/examples";
import type { Ring } from "../src/math/ring";
import { ZRing, ZpRing, QRing, ZiRing, ZwRing } from "../src/math/ring";

const D = (cx: number, cy: number, r: number): Disc => ({
  id: `${cx},${cy},${r}`, cx, cy, r, color: "#000",
});

// ---------- Test fixtures ----------

const pointNerve: Nerve = { byDim: [[[0]], [], []] };

const s1Nerve = (() => {
  const r = 1.1;
  return buildNerve([D(0, 0, r), D(2, 0, r), D(1, Math.sqrt(3), r)]);
})();

const s2Nerve: Nerve = {
  byDim: [
    [[0], [1], [2], [3]],
    [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]],
    [[0, 1, 2], [0, 1, 3], [0, 2, 3], [1, 2, 3]],
    [],
  ],
};

const t2Nerve = (() => {
  const preset = presets.find((p) => p.id === "torus-t2");
  if (!preset) throw new Error("torus-t2 preset missing");
  const discs: Disc[] = preset.discs.map((d, i) => ({
    id: `t${i}`, cx: d.cx, cy: d.cy, r: d.r, color: "#000",
  }));
  return buildNerve(discs, 3, { space: "torus" });
})();

// Minimal simplicial triangulation of RP² with 6 vertices, 15 edges, 10 triangles.
const rp2Nerve: Nerve = {
  byDim: [
    [[0], [1], [2], [3], [4], [5]],
    [
      [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
      [1, 2], [1, 3], [1, 4], [1, 5],
      [2, 3], [2, 4], [2, 5],
      [3, 4], [3, 5],
      [4, 5],
    ],
    [
      [0, 1, 2], [0, 1, 3], [0, 2, 4], [0, 3, 5], [0, 4, 5],
      [1, 2, 5], [1, 3, 4], [1, 4, 5], [2, 3, 4], [2, 3, 5],
    ],
    [],
  ],
};

// ---------- H^0 sanity: H^0(X; R) = R for connected X ----------

describe("H^0(X; R) = R for connected X (every ring)", () => {
  const cases = [
    ["Z", ZRing], ["Z/2", ZpRing(2)], ["Z/3", ZpRing(3)], ["Z/5", ZpRing(5)],
    ["Q", QRing], ["Z[i]", ZiRing], ["Z[ω]", ZwRing],
  ] as const;
  for (const [name, R] of cases) {
    it(`point: H^0 has rank 1 over ${name}`, () => {
      expect(cohomology(pointNerve, 0, R).rank).toBe(1);
    });
    it(`S^1: H^0 has rank 1 over ${name}`, () => {
      expect(cohomology(s1Nerve, 0, R).rank).toBe(1);
    });
  }
});

// ---------- S^1 ----------

describe("S^1 cohomology over various rings", () => {
  const cases = [
    ["Z", ZRing], ["Z/2", ZpRing(2)], ["Z/3", ZpRing(3)], ["Q", QRing], ["Z[i]", ZiRing],
  ] as const;
  for (const [name, R] of cases) {
    it(`H^1(S^1; ${name}) has rank 1`, () => {
      expect(cohomology(s1Nerve, 1, R).rank).toBe(1);
    });
  }
});

// ---------- S^2 ----------

describe("S^2 cohomology over various rings", () => {
  const cases = [
    ["Z", ZRing], ["Z/2", ZpRing(2)], ["Z/3", ZpRing(3)], ["Q", QRing], ["Z[i]", ZiRing],
  ] as const;
  for (const [name, R] of cases) {
    it(`H^*(S^2; ${name}): ranks (1, 0, 1)`, () => {
      expect(cohomology(s2Nerve, 0, R).rank).toBe(1);
      expect(cohomology(s2Nerve, 1, R).rank).toBe(0);
      expect(cohomology(s2Nerve, 2, R).rank).toBe(1);
    });
  }
});

// ---------- T^2 ----------

describe("T^2 cohomology over various rings", () => {
  const cases = [
    ["Z", ZRing], ["Z/2", ZpRing(2)], ["Z/3", ZpRing(3)], ["Z/5", ZpRing(5)],
    ["Q", QRing], ["Z[i]", ZiRing], ["Z[ω]", ZwRing],
  ] as const;
  for (const [name, R] of cases) {
    it(`H^*(T^2; ${name}): Betti (1, 2, 1)`, () => {
      const h0 = cohomology(t2Nerve, 0, R);
      const h1 = cohomology(t2Nerve, 1, R);
      const h2 = cohomology(t2Nerve, 2, R);
      expect(h0.rank).toBe(1);
      expect(h1.rank).toBe(2);
      expect(h2.rank).toBe(1);
      expect(h0.torsion).toEqual([]);
      expect(h1.torsion).toEqual([]);
      expect(h2.torsion).toEqual([]);
    });
  }
});

// ---------- RP^2: the headline ----------

describe("RP^2 cohomology: ring choice matters", () => {
  it("RP² as a nerve has χ = 1 (sanity)", () => {
    const V = rp2Nerve.byDim[0].length;
    const E = rp2Nerve.byDim[1].length;
    const F = rp2Nerve.byDim[2].length;
    expect(V - E + F).toBe(1);
  });

  it("H^*(RP²; Z): ranks (1, 0, 0); H² has Z/2 torsion", () => {
    expect(cohomology(rp2Nerve, 0, ZRing).rank).toBe(1);
    expect(cohomology(rp2Nerve, 1, ZRing).rank).toBe(0);
    const h2 = cohomology(rp2Nerve, 2, ZRing);
    expect(h2.rank).toBe(0);
    expect(h2.torsion).toEqual([2]);
  });

  it("H^*(RP²; Q): ranks (1, 0, 0), no torsion — Q kills 2-torsion", () => {
    expect(cohomology(rp2Nerve, 0, QRing).rank).toBe(1);
    expect(cohomology(rp2Nerve, 1, QRing).rank).toBe(0);
    expect(cohomology(rp2Nerve, 2, QRing).rank).toBe(0);
  });

  it("H^*(RP²; Z/2): ranks (1, 1, 1) — the torsion class survives mod 2", () => {
    const F = ZpRing(2);
    expect(cohomology(rp2Nerve, 0, F).rank).toBe(1);
    expect(cohomology(rp2Nerve, 1, F).rank).toBe(1);
    expect(cohomology(rp2Nerve, 2, F).rank).toBe(1);
  });

  it("H^*(RP²; Z/3): ranks (1, 0, 0) — odd-prime field doesn't see Z/2", () => {
    const F = ZpRing(3);
    expect(cohomology(rp2Nerve, 0, F).rank).toBe(1);
    expect(cohomology(rp2Nerve, 1, F).rank).toBe(0);
    expect(cohomology(rp2Nerve, 2, F).rank).toBe(0);
  });
});

// ---------- Cup product on RP² over Z/2: α² ≠ 0 ----------

describe("Cup product on RP² over Z/2: α² is the H² generator", () => {
  const F = ZpRing(2);
  const h1 = cohomology(rp2Nerve, 1, F);
  const nonCob = h1.cocycleBasis.filter((c) => !c.isCoboundary);

  it("H¹(RP²; Z/2) has at least one non-coboundary representative", () => {
    expect(nonCob.length).toBeGreaterThanOrEqual(1);
  });

  it("α ⌣ α is NOT a coboundary in H²(RP²; Z/2) — generator survives", () => {
    expect(nonCob.length).toBeGreaterThanOrEqual(1);
    const alpha = nonCob[0].cochain;
    const sq = cup(alpha, alpha, rp2Nerve, F);
    expect(isCoboundary(sq.values, rp2Nerve, 2, F)).toBe(false);
  });

  it("for comparison, on S² over Z/2 every cup square in H¹ ⊗ H¹ is a coboundary (H¹=0 so vacuous)", () => {
    const h1S2 = cohomology(s2Nerve, 1, F);
    expect(h1S2.rank).toBe(0);
  });
});

// ---------- Composite Z/n cohomology (Universal Coefficient Theorem) ----------
//
// For RP² with H^*(Z) = (Z, 0, Z/2):
//   H^k(RP²; Z/n) = H^k(Z) ⊗ Z/n  ⊕  Tor(H^{k+1}(Z), Z/n)
// gives
//   H^0 = Z/n              (one R-free summand)
//   H^1 = Tor(Z/2, Z/n)    = Z/gcd(2, n)
//   H^2 = Z/2 ⊗ Z/n        = Z/gcd(2, n)

describe("RP² cohomology over composite Z/n: UCT", () => {
  const composite: Array<[string, number]> = [
    ["Z/4", 4], ["Z/6", 6], ["Z/8", 8], ["Z/9", 9], ["Z/12", 12],
  ];
  for (const [name, n] of composite) {
    const R = ZpRing(n);
    const g = (a: number, b: number): number => {
      let x = Math.abs(a); let y = Math.abs(b);
      while (y !== 0) [x, y] = [y, x % y];
      return x;
    };
    const tor = g(2, n);
    it(`H^*(RP²; ${name}): rank/torsion match UCT`, () => {
      const h0 = cohomology(rp2Nerve, 0, R);
      expect(h0.rank).toBe(1);
      expect(h0.torsion).toEqual([]);
      const h1 = cohomology(rp2Nerve, 1, R);
      const h2 = cohomology(rp2Nerve, 2, R);
      if (tor === 1) {
        expect(h1.rank).toBe(0);
        expect(h1.torsion).toEqual([]);
        expect(h2.rank).toBe(0);
        expect(h2.torsion).toEqual([]);
      } else if (tor === n) {
        // Z/gcd(2,n) summand IS R-free (degenerate when n=2).
        expect(h1.rank).toBe(1);
        expect(h1.torsion).toEqual([]);
        expect(h2.rank).toBe(1);
        expect(h2.torsion).toEqual([]);
      } else {
        expect(h1.rank).toBe(0);
        expect(h1.torsion).toEqual([tor]);
        expect(h2.rank).toBe(0);
        expect(h2.torsion).toEqual([tor]);
      }
    });
  }
});

describe("T² cohomology over composite Z/n: Betti (1, 2, 1), no torsion", () => {
  const composite: Array<[string, number]> = [
    ["Z/4", 4], ["Z/6", 6], ["Z/9", 9], ["Z/12", 12],
  ];
  for (const [name, n] of composite) {
    const R = ZpRing(n);
    it(`H^*(T²; ${name})`, () => {
      const h0 = cohomology(t2Nerve, 0, R);
      const h1 = cohomology(t2Nerve, 1, R);
      const h2 = cohomology(t2Nerve, 2, R);
      expect(h0.rank).toBe(1);
      expect(h1.rank).toBe(2);
      expect(h2.rank).toBe(1);
      expect(h0.torsion).toEqual([]);
      expect(h1.torsion).toEqual([]);
      expect(h2.torsion).toEqual([]);
    });
  }
});

// ---------- Class coordinates for every ring ----------

function expectFirstUnit(coords: ReturnType<typeof classCoordinates>, R: Ring): void {
  expect(coords).not.toBeNull();
  if (coords === null) return;
  expect(coords.length).toBeGreaterThanOrEqual(1);
  expect(R.eq(coords[0], R.one)).toBe(true);
  for (let i = 1; i < coords.length; i++) {
    expect(R.isZero(coords[i])).toBe(true);
  }
}

describe("classCoordinates: H^1 generator cocycle gets coords [1, 0, …] over every ring", () => {
  const cases: Array<[string, Ring]> = [
    ["Z", ZRing], ["Z/2", ZpRing(2)], ["Z/3", ZpRing(3)], ["Z/4", ZpRing(4)],
    ["Z/6", ZpRing(6)], ["Q", QRing], ["Z[i]", ZiRing], ["Z[ω]", ZwRing],
  ];
  for (const [name, R] of cases) {
    it(`S^1 H^1 generator → [1] over ${name}`, () => {
      const h1 = cohomology(s1Nerve, 1, R);
      const gens = h1.cocycleBasis.filter((c) => !c.isCoboundary);
      if (gens.length === 0) return;
      const coords = classCoordinates(gens[0].cochain.values, s1Nerve, 1, R);
      expectFirstUnit(coords, R);
    });
    it(`T² H^1 first generator → [1, 0] over ${name}`, () => {
      const h1 = cohomology(t2Nerve, 1, R);
      const gens = h1.cocycleBasis.filter((c) => !c.isCoboundary);
      if (gens.length === 0) return;
      const coords = classCoordinates(gens[0].cochain.values, t2Nerve, 1, R);
      expectFirstUnit(coords, R);
    });
  }
});

describe("classCoordinates: zero cochain returns zero coords over every ring", () => {
  const cases: Array<[string, Ring]> = [
    ["Z", ZRing], ["Z/4", ZpRing(4)], ["Q", QRing], ["Z[i]", ZiRing],
  ];
  for (const [name, R] of cases) {
    it(`T² zero cochain at k=1 → all zero over ${name}`, () => {
      const empty = new Map();
      const coords = classCoordinates(empty, t2Nerve, 1, R);
      expect(coords).not.toBeNull();
      for (const c of coords!) expect(R.isZero(c)).toBe(true);
    });
  }
});
