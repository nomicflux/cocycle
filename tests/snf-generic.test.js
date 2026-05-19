import { describe, it, expect } from "vitest";
import { ZRing, ZiRing, ZwRing } from "../src/math/ring";
import { smithNormalFormGeneric } from "../src/math/snf-generic";
// Matrix multiplication over a ring — used to verify U·A·V = D.
function matMul(A, B, ring) {
    if (A.length === 0)
        return [];
    const k = A[0].length;
    if (k === 0 || B.length === 0) {
        return A.map(() => new Array(B[0]?.length ?? 0).fill(ring.zero));
    }
    const m = A.length;
    const n = B[0].length;
    const out = Array.from({ length: m }, () => new Array(n).fill(ring.zero));
    for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
            let acc = ring.zero;
            for (let l = 0; l < k; l++)
                acc = ring.add(acc, ring.mul(A[i][l], B[l][j]));
            out[i][j] = acc;
        }
    }
    return out;
}
function matEq(A, B, ring) {
    if (A.length !== B.length)
        return false;
    for (let i = 0; i < A.length; i++) {
        if ((A[i].length) !== (B[i].length))
            return false;
        for (let j = 0; j < A[i].length; j++) {
            if (!ring.eq(A[i][j], B[i][j]))
                return false;
        }
    }
    return true;
}
function verifyFactorization(M, ring) {
    const snf = smithNormalFormGeneric(M, ring);
    expect(matEq(matMul(matMul(snf.U, M, ring), snf.V, ring), snf.D, ring)).toBe(true);
}
describe("smithNormalFormGeneric: edge cases", () => {
    it("empty matrix: rank 0", () => {
        const snf = smithNormalFormGeneric([], ZiRing);
        expect(snf.rank).toBe(0);
    });
    it("agrees with integer SNF on a Z-valued matrix viewed over Z", () => {
        const A = [[[2], [0]], [[0], [3]]];
        const snf = smithNormalFormGeneric(A, ZRing);
        expect(snf.rank).toBe(2);
        // Invariant factors over Z: 1, 6.
        expect(Math.abs(snf.D[0][0][0]) * Math.abs(snf.D[1][1][0])).toBe(6);
        verifyFactorization(A, ZRing);
    });
});
describe("smithNormalFormGeneric over Z[i]", () => {
    it("1×1 [[5]]: rank 1, norm 25 (5 = (2+i)(2-i) but no further factorization on diagonal)", () => {
        const A = [[[5, 0]]];
        const snf = smithNormalFormGeneric(A, ZiRing);
        expect(snf.rank).toBe(1);
        expect(ZiRing.norm(snf.D[0][0])).toBe(25);
        verifyFactorization(A, ZiRing);
    });
    it("1×1 [[1+i]]: rank 1, norm 2 (1+i is a Gaussian prime over 2)", () => {
        const A = [[[1, 1]]];
        const snf = smithNormalFormGeneric(A, ZiRing);
        expect(snf.rank).toBe(1);
        expect(ZiRing.norm(snf.D[0][0])).toBe(2);
        verifyFactorization(A, ZiRing);
    });
    it("[[2, 3]] (1×2): gcd 1 (since 2 and 3 coprime), rank 1, pivot a unit", () => {
        const A = [[[2, 0], [3, 0]]];
        const snf = smithNormalFormGeneric(A, ZiRing);
        expect(snf.rank).toBe(1);
        expect(ZiRing.norm(snf.D[0][0])).toBe(1);
        verifyFactorization(A, ZiRing);
    });
    it("[[1+i, 1-i]] (1×2): 1-i = (-i)(1+i), so gcd is 1+i; rank 1, norm 2", () => {
        const A = [[[1, 1], [1, -1]]];
        const snf = smithNormalFormGeneric(A, ZiRing);
        expect(snf.rank).toBe(1);
        expect(ZiRing.norm(snf.D[0][0])).toBe(2);
        verifyFactorization(A, ZiRing);
    });
    it("diag(2, 3): rank 2, |det| norm 36, invariant factors (1, 6)", () => {
        const A = [
            [[2, 0], [0, 0]],
            [[0, 0], [3, 0]],
        ];
        const snf = smithNormalFormGeneric(A, ZiRing);
        expect(snf.rank).toBe(2);
        expect(ZiRing.norm(snf.D[0][0])).toBe(1);
        expect(ZiRing.norm(snf.D[1][1])).toBe(36);
        verifyFactorization(A, ZiRing);
    });
    it("diag(2, 2): rank 2, invariant factors (2, 2), norms (4, 4)", () => {
        const A = [
            [[2, 0], [0, 0]],
            [[0, 0], [2, 0]],
        ];
        const snf = smithNormalFormGeneric(A, ZiRing);
        expect(snf.rank).toBe(2);
        expect(ZiRing.norm(snf.D[0][0])).toBe(4);
        expect(ZiRing.norm(snf.D[1][1])).toBe(4);
        verifyFactorization(A, ZiRing);
    });
});
describe("smithNormalFormGeneric over Z[ω]", () => {
    it("1×1 [[2]]: rank 1, norm 4 (2 is inert in Z[ω])", () => {
        const A = [[[2, 0]]];
        const snf = smithNormalFormGeneric(A, ZwRing);
        expect(snf.rank).toBe(1);
        expect(ZwRing.norm(snf.D[0][0])).toBe(4);
        verifyFactorization(A, ZwRing);
    });
    it("1×1 [[1-ω]]: 1-ω is an Eisenstein prime over 3, norm 3", () => {
        const A = [[[1, -1]]];
        const snf = smithNormalFormGeneric(A, ZwRing);
        expect(snf.rank).toBe(1);
        expect(ZwRing.norm(snf.D[0][0])).toBe(3);
        verifyFactorization(A, ZwRing);
    });
    it("[[2, 3]] (1×2): gcd 1, rank 1, pivot a unit", () => {
        const A = [[[2, 0], [3, 0]]];
        const snf = smithNormalFormGeneric(A, ZwRing);
        expect(snf.rank).toBe(1);
        expect(ZwRing.norm(snf.D[0][0])).toBe(1);
        verifyFactorization(A, ZwRing);
    });
    it("diag(2, 3): rank 2, invariant factors (1, 6), norm product 36", () => {
        const A = [
            [[2, 0], [0, 0]],
            [[0, 0], [3, 0]],
        ];
        const snf = smithNormalFormGeneric(A, ZwRing);
        expect(snf.rank).toBe(2);
        expect(ZwRing.norm(snf.D[0][0])).toBe(1);
        expect(ZwRing.norm(snf.D[1][1])).toBe(36);
        verifyFactorization(A, ZwRing);
    });
});
