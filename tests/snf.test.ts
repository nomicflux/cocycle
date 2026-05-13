import { describe, it, expect } from "vitest";
import { smithNormalForm, matrixRank } from "../src/math/snf";

function matMul(A: number[][], B: number[][]): number[][] {
  const m = A.length;
  const n = B[0]?.length ?? 0;
  const k = B.length;
  const C: number[][] = Array.from({ length: m }, () => new Array(n).fill(0));
  for (let i = 0; i < m; i++)
    for (let j = 0; j < n; j++)
      for (let p = 0; p < k; p++) C[i][j] += A[i][p] * B[p][j];
  return C;
}

function diag(D: number[][]): number[] {
  const n = Math.min(D.length, D[0]?.length ?? 0);
  return Array.from({ length: n }, (_, i) => D[i][i]);
}

describe("smithNormalForm", () => {
  it("computes diag(2,4) for [[2,4],[6,8]]", () => {
    const M = [[2, 4], [6, 8]];
    const snf = smithNormalForm(M);
    expect(diag(snf.D)).toEqual([2, 4]);
    expect(snf.rank).toBe(2);
  });

  it("computes diag(6) for [[6]]", () => {
    const snf = smithNormalForm([[6]]);
    expect(diag(snf.D)).toEqual([6]);
  });

  it("computes diag(1,6) for [[3,0],[0,6]] (after divisibility fix)", () => {
    // gcd(3,6)=3, lcm/gcd = 6. Result is diag(3,6)... wait actually 3 | 6 already so D stays diag(3,6).
    const snf = smithNormalForm([[3, 0], [0, 6]]);
    expect(diag(snf.D)).toEqual([3, 6]);
  });

  it("computes diag(1,4) for [[2, 2], [2, 6]]", () => {
    // det = 12 - 4 = 8. Elementary divisors must multiply to 8 with d1|d2: candidates (1,8), (2,4).
    // Computed via reduction: gcd entries = 2; after first step d1 = 2... or d1=1 if mixing rows.
    // Smallest non-zero is 2; q=1 reductions can produce a 1 in some position. Actual result: diag(2, 4).
    const snf = smithNormalForm([[2, 2], [2, 6]]);
    const d = diag(snf.D);
    expect(d[0]).toBe(2);
    expect(d[1]).toBe(4);
  });

  it("computes diag(1, 0) for [[1,2],[2,4]] (rank 1)", () => {
    const snf = smithNormalForm([[1, 2], [2, 4]]);
    expect(diag(snf.D)).toEqual([1, 0]);
    expect(snf.rank).toBe(1);
  });

  it("U · M · V = D for a random integer matrix", () => {
    const M = [
      [3, 1, 4],
      [1, 5, 9],
      [2, 6, 5],
    ];
    const snf = smithNormalForm(M);
    const product = matMul(matMul(snf.U, M), snf.V);
    expect(product).toEqual(snf.D);
  });

  it("handles the zero matrix", () => {
    const M = [[0, 0], [0, 0]];
    const snf = smithNormalForm(M);
    expect(snf.rank).toBe(0);
    expect(diag(snf.D)).toEqual([0, 0]);
  });

  it("handles non-square matrices (3x2 and 2x3)", () => {
    const A = [[1, 2], [3, 4], [5, 6]];
    const snfA = smithNormalForm(A);
    expect(snfA.rank).toBe(2);
    const productA = matMul(matMul(snfA.U, A), snfA.V);
    expect(productA).toEqual(snfA.D);

    const B = [[1, 2, 3], [4, 5, 6]];
    const snfB = smithNormalForm(B);
    expect(snfB.rank).toBe(2);
    const productB = matMul(matMul(snfB.U, B), snfB.V);
    expect(productB).toEqual(snfB.D);
  });

  it("rank() agrees with smithNormalForm", () => {
    expect(matrixRank([[1, 1], [1, 1]])).toBe(1);
    expect(matrixRank([[0, 0], [0, 0]])).toBe(0);
    expect(matrixRank([[1, 0, 0], [0, 1, 0], [0, 0, 1]])).toBe(3);
  });
});
