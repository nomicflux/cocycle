import { describe, it, expect } from "vitest";
import type { Ring, RingElement } from "../src/math/ring";
import { QRing, ZpRing } from "../src/math/ring";
import { rankOverField, kernelBasisOverField, isInColumnSpanField } from "../src/math/rank";

function lift(M: number[][], ring: Ring): RingElement[][] {
  return M.map((row) => row.map((v) => ring.fromInt(v)));
}

describe("rankOverField — Q", () => {
  it("identity has full rank", () => {
    expect(rankOverField(lift([[1, 0], [0, 1]], QRing), QRing)).toBe(2);
  });
  it("zero matrix has rank 0", () => {
    expect(rankOverField(lift([[0, 0], [0, 0]], QRing), QRing)).toBe(0);
  });
  it("rank-1 matrix", () => {
    expect(rankOverField(lift([[1, 2], [2, 4]], QRing), QRing)).toBe(1);
  });
  it("3x4 with rank 2", () => {
    expect(rankOverField(lift([[1, 2, 3, 4], [2, 4, 6, 8], [0, 0, 1, 1]], QRing), QRing)).toBe(2);
  });
});

describe("rankOverField — Z/2", () => {
  const R = ZpRing(2);
  it("[[1,1],[1,1]] has rank 1 over Z/2", () => {
    expect(rankOverField(lift([[1, 1], [1, 1]], R), R)).toBe(1);
  });
  it("[[1,1],[1,0]] has rank 2 over Z/2", () => {
    expect(rankOverField(lift([[1, 1], [1, 0]], R), R)).toBe(2);
  });
  it("[[0,0],[1,0]] has rank 1 over Z/2", () => {
    expect(rankOverField(lift([[0, 0], [1, 0]], R), R)).toBe(1);
  });
});

describe("kernelBasisOverField — Q", () => {
  it("kernel of [[1,1,1]] has dim 2; basis vectors satisfy M v = 0", () => {
    const M = lift([[1, 1, 1]], QRing);
    const basis = kernelBasisOverField(M, 3, QRing);
    expect(basis.length).toBe(2);
    for (const v of basis) {
      // M v over Q
      let s: RingElement = QRing.zero;
      for (let j = 0; j < 3; j++) s = QRing.add(s, QRing.mul(M[0][j], v[j]));
      expect(QRing.isZero(s)).toBe(true);
    }
  });
  it("kernel of identity has dim 0", () => {
    const M = lift([[1, 0], [0, 1]], QRing);
    expect(kernelBasisOverField(M, 2, QRing).length).toBe(0);
  });
});

describe("kernelBasisOverField — Z/2", () => {
  const R = ZpRing(2);
  it("kernel of [[1,1]] over Z/2 has dim 1", () => {
    const M = lift([[1, 1]], R);
    const basis = kernelBasisOverField(M, 2, R);
    expect(basis.length).toBe(1);
    // M v = 0
    const v = basis[0];
    const s = R.add(R.mul(M[0][0], v[0]), R.mul(M[0][1], v[1]));
    expect(R.isZero(s)).toBe(true);
  });
});

describe("isInColumnSpanField — Q", () => {
  const M = lift([[1, 0], [0, 1], [1, 1]], QRing);
  it("column [1,1,2] is in column span", () => {
    const b = [QRing.fromInt(1), QRing.fromInt(1), QRing.fromInt(2)];
    expect(isInColumnSpanField(M, b, QRing)).toBe(true);
  });
  it("column [1,0,2] is NOT in column span", () => {
    const b = [QRing.fromInt(1), QRing.fromInt(0), QRing.fromInt(2)];
    expect(isInColumnSpanField(M, b, QRing)).toBe(false);
  });
  it("zero column is in span", () => {
    const b = [QRing.zero, QRing.zero, QRing.zero];
    expect(isInColumnSpanField(M, b, QRing)).toBe(true);
  });
});
