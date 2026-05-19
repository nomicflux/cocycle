import { describe, it, expect } from "vitest";
import type { Ring, RingElement } from "../src/math/ring";
import { ZRing, ZpRing, QRing, ZiRing, ZwRing } from "../src/math/ring";

function axioms(name: string, ring: Ring, samples: RingElement[]) {
  describe(`${name} — ring axioms`, () => {
    it("a + 0 = a", () => {
      for (const a of samples) expect(ring.eq(ring.add(a, ring.zero), a)).toBe(true);
    });
    it("a + (-a) = 0", () => {
      for (const a of samples) expect(ring.isZero(ring.add(a, ring.neg(a)))).toBe(true);
    });
    it("a * 1 = a", () => {
      for (const a of samples) expect(ring.eq(ring.mul(a, ring.one), a)).toBe(true);
    });
    it("a * 0 = 0", () => {
      for (const a of samples) expect(ring.isZero(ring.mul(a, ring.zero))).toBe(true);
    });
    it("a + b = b + a", () => {
      for (const a of samples) for (const b of samples)
        expect(ring.eq(ring.add(a, b), ring.add(b, a))).toBe(true);
    });
    it("a * b = b * a (commutative ring)", () => {
      for (const a of samples) for (const b of samples)
        expect(ring.eq(ring.mul(a, b), ring.mul(b, a))).toBe(true);
    });
    it("(a + b) + c = a + (b + c)", () => {
      for (const a of samples) for (const b of samples) for (const c of samples)
        expect(ring.eq(ring.add(ring.add(a, b), c), ring.add(a, ring.add(b, c)))).toBe(true);
    });
    it("(a * b) * c = a * (b * c)", () => {
      for (const a of samples) for (const b of samples) for (const c of samples)
        expect(ring.eq(ring.mul(ring.mul(a, b), c), ring.mul(a, ring.mul(b, c)))).toBe(true);
    });
    it("a * (b + c) = a*b + a*c", () => {
      for (const a of samples) for (const b of samples) for (const c of samples) {
        const lhs = ring.mul(a, ring.add(b, c));
        const rhs = ring.add(ring.mul(a, b), ring.mul(a, c));
        expect(ring.eq(lhs, rhs)).toBe(true);
      }
    });
  });
}

axioms("Z", ZRing, [[-3], [-1], [0], [1], [2], [7]]);

axioms("Z/2", ZpRing(2), [[0], [1]]);
axioms("Z/3", ZpRing(3), [[0], [1], [2]]);
axioms("Z/5", ZpRing(5), [[0], [1], [2], [3], [4]]);

axioms("Q", QRing, [[0, 1], [1, 1], [-1, 1], [1, 2], [-3, 4], [5, 7]]);

axioms("Z[i]", ZiRing, [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1], [2, 3], [-2, 1]]);

axioms("Z[ω]", ZwRing, [[0, 0], [1, 0], [0, 1], [-1, 0], [0, -1], [2, 3], [-2, 1]]);

describe("Z/p — modular reduction", () => {
  const R = ZpRing(5);
  it("fromInt reduces mod p (positive and negative)", () => {
    expect(R.fromInt(7)).toEqual([2]);
    expect(R.fromInt(-1)).toEqual([4]);
    expect(R.fromInt(10)).toEqual([0]);
  });
  it("add wraps", () => {
    expect(R.add([3], [4])).toEqual([2]);
  });
  it("mul wraps", () => {
    expect(R.mul([3], [4])).toEqual([2]);
  });
});

describe("Q — canonical form", () => {
  it("reduces by gcd and forces positive denominator", () => {
    expect(QRing.add([1, 2], [1, 2])).toEqual([1, 1]);
    expect(QRing.mul([2, 3], [3, 4])).toEqual([1, 2]);
    expect(QRing.add([1, 2], [-1, 2])).toEqual([0, 1]);
    expect(QRing.neg([3, 5])).toEqual([-3, 5]);
  });
  it("parses fractions and integers", () => {
    expect(QRing.parse("3/4")).toEqual([3, 4]);
    expect(QRing.parse("-2/6")).toEqual([-1, 3]);
    expect(QRing.parse("5")).toEqual([5, 1]);
    expect(QRing.parse("garbage")).toBeNull();
    expect(QRing.parse("1/0")).toBeNull();
  });
  it("formats canonical", () => {
    expect(QRing.format([3, 4])).toBe("3/4");
    expect(QRing.format([5, 1])).toBe("5");
    expect(QRing.format([0, 1])).toBe("0");
  });
});

describe("Z[i] — Gaussian arithmetic", () => {
  it("(1+i)(1-i) = 2", () => {
    expect(ZiRing.mul([1, 1], [1, -1])).toEqual([2, 0]);
  });
  it("i * i = -1", () => {
    expect(ZiRing.mul([0, 1], [0, 1])).toEqual([-1, 0]);
  });
  it("(2+3i) + (1-i) = (3+2i)", () => {
    expect(ZiRing.add([2, 3], [1, -1])).toEqual([3, 2]);
  });
  it("parse round-trips", () => {
    expect(ZiRing.parse("3+2i")).toEqual([3, 2]);
    expect(ZiRing.parse("3-2i")).toEqual([3, -2]);
    expect(ZiRing.parse("-i")).toEqual([0, -1]);
    expect(ZiRing.parse("i")).toEqual([0, 1]);
    expect(ZiRing.parse("5")).toEqual([5, 0]);
    expect(ZiRing.parse("garbage")).toBeNull();
  });
  it("format", () => {
    expect(ZiRing.format([3, 2])).toBe("3+2i");
    expect(ZiRing.format([3, -2])).toBe("3-2i");
    expect(ZiRing.format([0, 1])).toBe("i");
    expect(ZiRing.format([0, -1])).toBe("-i");
    expect(ZiRing.format([5, 0])).toBe("5");
    expect(ZiRing.format([0, 0])).toBe("0");
  });
});

describe("Ring.inputShape", () => {
  it("Z is integer", () => {
    expect(ZRing.inputShape()).toEqual({ kind: "integer" });
  });
  it("Q is fraction", () => {
    expect(QRing.inputShape()).toEqual({ kind: "fraction" });
  });
  it("Z/p is mod-cycle with p", () => {
    expect(ZpRing(2).inputShape()).toEqual({ kind: "mod-cycle", p: 2 });
    expect(ZpRing(5).inputShape()).toEqual({ kind: "mod-cycle", p: 5 });
    expect(ZpRing(7).inputShape()).toEqual({ kind: "mod-cycle", p: 7 });
  });
  it("Z[i] is complex with i", () => {
    expect(ZiRing.inputShape()).toEqual({ kind: "complex", imagSymbol: "i" });
  });
  it("Z[ω] is complex with ω", () => {
    expect(ZwRing.inputShape()).toEqual({ kind: "complex", imagSymbol: "ω" });
  });
});

describe("Z[ω] — Eisenstein arithmetic, ω² = -1 - ω", () => {
  it("ω * ω = -1 - ω", () => {
    // (0 + 1·ω)(0 + 1·ω) = (0·0 - 1·1) + (0·1 + 1·0 - 1·1)ω = (-1) + (-1)ω
    expect(ZwRing.mul([0, 1], [0, 1])).toEqual([-1, -1]);
  });
  it("ω³ = 1", () => {
    const w = [0, 1] as const;
    const w2 = ZwRing.mul(w, w);
    const w3 = ZwRing.mul(w2, w);
    expect(w3).toEqual([1, 0]);
  });
  it("(1 - ω)(1 - ω) = -3ω · (something)?  Spot-check: norm(1-ω) = 3", () => {
    // N(a+bω) = a² - ab + b². N(1-ω) = 1 - (1)(-1) + 1 = 3.
    // Phase B doesn't expose norm directly; instead verify (1-ω)(1-ω̄) = 3.
    // ω̄ = ω² = -1 - ω, so (1-ω)(1-ω²) = (1-ω)(1-(-1-ω)) = (1-ω)(2+ω)
    // = 2 + ω - 2ω - ω² = 2 - ω - (-1-ω) = 3.
    const a: RingElement = [1, -1];     // 1 - ω
    const b: RingElement = [2, 1];      // 2 + ω
    expect(ZwRing.mul(a, b)).toEqual([3, 0]);
  });
  it("parse and format accept w and ω", () => {
    expect(ZwRing.parse("3+2w")).toEqual([3, 2]);
    expect(ZwRing.parse("3+2ω")).toEqual([3, 2]);
    expect(ZwRing.parse("-ω")).toEqual([0, -1]);
    expect(ZwRing.format([3, 2])).toBe("3+2ω");
    expect(ZwRing.format([0, 1])).toBe("ω");
  });
});
