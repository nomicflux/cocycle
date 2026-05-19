// Linear algebra over a field. Used for cohomology with field coefficients
// (Q and Z/p for p prime). Operates on RingElement matrices via the Ring
// interface plus a field-inverse helper.
import { fieldInv } from "./ring";
function copyMatrix(M) {
    return M.map((row) => row.slice());
}
// Reduce A in-place to reduced row-echelon form over the field. Returns the
// pivot column for each rank-row (length = rank).
function rrefInPlace(A, ring) {
    const m = A.length;
    const n = m === 0 ? 0 : A[0].length;
    const pivotCols = [];
    let row = 0;
    for (let col = 0; col < n && row < m; col++) {
        let pivot = -1;
        for (let i = row; i < m; i++) {
            if (!ring.isZero(A[i][col])) {
                pivot = i;
                break;
            }
        }
        if (pivot === -1)
            continue;
        if (pivot !== row)
            [A[row], A[pivot]] = [A[pivot], A[row]];
        const inv = fieldInv(ring, A[row][col]);
        for (let j = col; j < n; j++)
            A[row][j] = ring.mul(A[row][j], inv);
        for (let i = 0; i < m; i++) {
            if (i === row)
                continue;
            const factor = A[i][col];
            if (ring.isZero(factor))
                continue;
            for (let j = col; j < n; j++) {
                A[i][j] = ring.add(A[i][j], ring.neg(ring.mul(factor, A[row][j])));
            }
        }
        pivotCols.push(col);
        row++;
    }
    return pivotCols;
}
export function rankOverField(M, ring) {
    if (M.length === 0 || (M[0]?.length ?? 0) === 0)
        return 0;
    const A = copyMatrix(M);
    return rrefInPlace(A, ring).length;
}
// Returns true iff `b` lies in the column span of `M` over the field.
export function isInColumnSpanField(M, b, ring) {
    if (M.length === 0)
        return b.every((x) => ring.isZero(x));
    const n = M[0].length;
    // Augment with b as the last column.
    const A = M.map((row, i) => [...row, b[i] ?? ring.zero]);
    const pivots = rrefInPlace(A, ring);
    // b is in span iff no pivot lands in the last column.
    return pivots.every((c) => c < n);
}
// Solve A · v = b over the field. Returns a particular solution or null.
export function solveLinearOverField(A, b, ring) {
    const m = A.length;
    if (m === 0)
        return b.length === 0 ? [] : null;
    const n = A[0].length;
    if (n === 0)
        return b.every((x) => ring.isZero(x)) ? [] : null;
    const aug = A.map((row, i) => [...row, b[i] ?? ring.zero]);
    const pivots = rrefInPlace(aug, ring);
    if (pivots.some((c) => c === n))
        return null;
    const v = new Array(n).fill(ring.zero);
    for (let r = 0; r < pivots.length; r++)
        v[pivots[r]] = aug[r][n];
    return v;
}
// Cokernel structure over a field: rank = m - rank(A); no torsion.
export function cokernelStructureOverField(A, ring) {
    const m = A.length;
    if (m === 0)
        return { rank: 0, torsion: [] };
    return { rank: m - rankOverField(A, ring), torsion: [] };
}
// Basis of ker(M) as a list of column vectors of length nCols.
export function kernelBasisOverField(M, nCols, ring) {
    if (nCols === 0)
        return [];
    if (M.length === 0 || (M[0]?.length ?? 0) === 0) {
        // Empty matrix: every standard basis vector is in the kernel.
        return Array.from({ length: nCols }, (_, j) => {
            const v = new Array(nCols).fill(ring.zero);
            v[j] = ring.one;
            return v;
        });
    }
    const A = copyMatrix(M);
    const pivotCols = rrefInPlace(A, ring);
    const pivotSet = new Set(pivotCols);
    const freeCols = [];
    for (let j = 0; j < nCols; j++)
        if (!pivotSet.has(j))
            freeCols.push(j);
    const basis = [];
    for (const free of freeCols) {
        const v = new Array(nCols).fill(ring.zero);
        v[free] = ring.one;
        for (let r = 0; r < pivotCols.length; r++) {
            const piv = pivotCols[r];
            // A[r][free] is the coefficient that the free variable contributes to
            // the pivot row; the basis vector has -A[r][free] in the pivot position.
            v[piv] = ring.neg(A[r][free]);
        }
        basis.push(v);
    }
    return basis;
}
