// Linear algebra over a Euclidean ring via Smith Normal Form.
// Used by Z, Z[i], Z[ω]. The ring supplies quotRem / norm to snf-generic.
import { smithNormalFormGeneric } from "./snf-generic";
function matVecMul(M, v, rows, cols, ring) {
    const out = new Array(rows).fill(ring.zero);
    for (let i = 0; i < rows; i++) {
        let acc = ring.zero;
        for (let j = 0; j < cols; j++)
            acc = ring.add(acc, ring.mul(M[i][j], v[j]));
        out[i] = acc;
    }
    return out;
}
// Solve A · v = b over R. Returns a particular solution or null.
export function solveLinearEuclidean(A, b, ring) {
    const m = A.length;
    const n = m === 0 ? 0 : A[0].length;
    if (m === 0)
        return b.length === 0 ? [] : null;
    if (n === 0)
        return b.every((x) => ring.isZero(x)) ? [] : null;
    const snf = smithNormalFormGeneric(A, ring);
    const Ub = matVecMul(snf.U, b, m, m, ring);
    const y = new Array(n).fill(ring.zero);
    const r = Math.min(m, n);
    for (let i = 0; i < r; i++) {
        const d = snf.D[i][i];
        if (ring.isZero(d)) {
            if (!ring.isZero(Ub[i]))
                return null;
        }
        else {
            const { q, r: rem } = ring.quotRem(Ub[i], d);
            if (!ring.isZero(rem))
                return null;
            y[i] = q;
        }
    }
    for (let i = r; i < m; i++)
        if (!ring.isZero(Ub[i]))
            return null;
    return matVecMul(snf.V, y, n, n, ring);
}
// Cokernel of A as an R-module: R^m / col(A) = R^(m-rank) ⊕ ⊕ R/(d_i)
// where d_i are the nonzero SNF diagonals. Unit d_i are dropped (R/(unit) = 0).
// Torsion entries are returned as the integer norm of the invariant factor —
// matches the existing CohomologyDim.torsion: number[] surface (which is what
// formatGroup consumes for display).
export function cokernelStructureEuclidean(A, ring) {
    const m = A.length;
    const n = m === 0 ? 0 : A[0].length;
    if (m === 0 || n === 0)
        return { rank: m, torsion: [] };
    const snf = smithNormalFormGeneric(A, ring);
    const torsion = [];
    let p = 0;
    for (let k = 0; k < Math.min(m, n); k++) {
        const d = snf.D[k][k];
        if (ring.isZero(d))
            continue;
        p++;
        const norm = ring.norm(d);
        if (norm > 1)
            torsion.push(norm);
    }
    return { rank: m - p, torsion };
}
// Basis of ker(A) as a sub-R-module of R^nCols. Returns the V-columns
// corresponding to the trailing zero rows of D (each is a free generator).
export function kernelBasisEuclidean(A, nCols, ring) {
    if (nCols === 0)
        return [];
    if (A.length === 0 || (A[0]?.length ?? 0) === 0) {
        return Array.from({ length: nCols }, (_, j) => {
            const v = new Array(nCols).fill(ring.zero);
            v[j] = ring.one;
            return v;
        });
    }
    const snf = smithNormalFormGeneric(A, ring);
    const basis = [];
    for (let j = snf.rank; j < nCols; j++) {
        basis.push(snf.V.map((row) => row[j]));
    }
    return basis;
}
