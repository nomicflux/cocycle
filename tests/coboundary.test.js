import { describe, it, expect } from "vitest";
import { coboundaryMatrix, faces, cofacesInNerve } from "../src/math/coboundary";
function matMul(A, B) {
    const m = A.length;
    const n = B[0]?.length ?? 0;
    const k = B.length;
    const C = Array.from({ length: m }, () => new Array(n).fill(0));
    for (let i = 0; i < m; i++)
        for (let j = 0; j < n; j++)
            for (let p = 0; p < k; p++)
                C[i][j] += A[i][p] * B[p][j];
    return C;
}
function isZeroMatrix(M) {
    return M.every((row) => row.every((v) => v === 0));
}
// Build the nerve = boundary of an n-simplex (all subsets of [0..n-1] except the
// top one). Used to stress-test δ∘δ=0.
function partialSimplexNerve(n, maxDim) {
    const byDim = [];
    for (let d = 0; d <= maxDim; d++) {
        const size = d + 1;
        const sims = [];
        const choose = (start, cur) => {
            if (cur.length === size) {
                sims.push([...cur]);
                return;
            }
            for (let i = start; i < n; i++) {
                cur.push(i);
                choose(i + 1, cur);
                cur.pop();
            }
        };
        choose(0, []);
        byDim.push(sims);
    }
    return { byDim };
}
describe("faces", () => {
    it("returns alternating-sign faces in order", () => {
        expect(faces([0, 1, 2])).toEqual([
            { face: [1, 2], sign: 1 },
            { face: [0, 2], sign: -1 },
            { face: [0, 1], sign: 1 },
        ]);
    });
});
describe("coboundaryMatrix", () => {
    it("has dimensions |C^(k+1)| x |C^k|", () => {
        const nerve = partialSimplexNerve(4, 3);
        const M = coboundaryMatrix(nerve, 1);
        expect(M.length).toBe(nerve.byDim[2].length);
        expect(M[0].length).toBe(nerve.byDim[1].length);
    });
    it("satisfies δ∘δ = 0 on the full 3-simplex nerve", () => {
        const nerve = partialSimplexNerve(4, 3);
        const D0 = coboundaryMatrix(nerve, 0);
        const D1 = coboundaryMatrix(nerve, 1);
        const D2 = coboundaryMatrix(nerve, 2);
        expect(isZeroMatrix(matMul(D1, D0))).toBe(true);
        expect(isZeroMatrix(matMul(D2, D1))).toBe(true);
    });
    it("satisfies δ∘δ = 0 on the 4-simplex nerve up to dim 3", () => {
        const nerve = partialSimplexNerve(5, 3);
        const D0 = coboundaryMatrix(nerve, 0);
        const D1 = coboundaryMatrix(nerve, 1);
        const D2 = coboundaryMatrix(nerve, 2);
        expect(isZeroMatrix(matMul(D1, D0))).toBe(true);
        expect(isZeroMatrix(matMul(D2, D1))).toBe(true);
    });
});
describe("cofacesInNerve", () => {
    it("finds cofaces of {1} in a 3-vertex triangle nerve", () => {
        const nerve = {
            byDim: [[[0], [1], [2]], [[0, 1], [0, 2], [1, 2]], [[0, 1, 2]]],
        };
        const cofaces = cofacesInNerve([1], nerve);
        // σ={1} is τ\{τ[0]} for τ=[0,1] (sign +1) and τ\{τ[1]} for τ=[1,2] (sign -1).
        expect(cofaces).toEqual([
            { face: [0, 1], sign: 1 },
            { face: [1, 2], sign: -1 },
        ]);
    });
});
