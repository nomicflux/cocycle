// Smith Normal Form over an arbitrary Euclidean ring.
//
// Same algorithm as snf.ts over Z, parameterized by ring.quotRem and ring.norm.
// Given m×n matrix M over R, returns unimodular U (m×m), V (n×n), and diagonal
// D (m×n) with U·M·V = D and D[0][0] | D[1][1] | … | D[r-1][r-1], the rest zero.
function eye(n, ring) {
    return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? ring.one : ring.zero)));
}
function clone(M) {
    return M.map((row) => row.slice());
}
function swapRows(M, i, j) {
    if (i !== j)
        [M[i], M[j]] = [M[j], M[i]];
}
function swapCols(M, i, j) {
    if (i === j)
        return;
    for (const row of M)
        [row[i], row[j]] = [row[j], row[i]];
}
function addRow(M, src, dst, mult, ring) {
    const cols = M[0].length;
    for (let k = 0; k < cols; k++) {
        M[dst][k] = ring.add(M[dst][k], ring.mul(mult, M[src][k]));
    }
}
function addCol(M, src, dst, mult, ring) {
    for (let k = 0; k < M.length; k++) {
        M[k][dst] = ring.add(M[k][dst], ring.mul(mult, M[k][src]));
    }
}
function findSmallestNonzero(D, i0, m, n, ring) {
    let r = -1, c = -1, best = Infinity;
    for (let r2 = i0; r2 < m; r2++) {
        for (let c2 = i0; c2 < n; c2++) {
            if (ring.isZero(D[r2][c2]))
                continue;
            const v = ring.norm(D[r2][c2]);
            if (v < best) {
                best = v;
                r = r2;
                c = c2;
            }
        }
    }
    return r === -1 ? null : [r, c];
}
function reduceColumn(D, U, i, m, ring) {
    let progress = false;
    for (let r = i + 1; r < m; r++) {
        if (ring.isZero(D[r][i]))
            continue;
        const { q } = ring.quotRem(D[r][i], D[i][i]);
        if (!ring.isZero(q)) {
            addRow(D, i, r, ring.neg(q), ring);
            addRow(U, i, r, ring.neg(q), ring);
        }
        if (!ring.isZero(D[r][i])) {
            swapRows(D, i, r);
            swapRows(U, i, r);
            progress = true;
        }
    }
    return progress;
}
function reduceRow(D, V, i, n, ring) {
    let progress = false;
    for (let c = i + 1; c < n; c++) {
        if (ring.isZero(D[i][c]))
            continue;
        const { q } = ring.quotRem(D[i][c], D[i][i]);
        if (!ring.isZero(q)) {
            addCol(D, i, c, ring.neg(q), ring);
            addCol(V, i, c, ring.neg(q), ring);
        }
        if (!ring.isZero(D[i][c])) {
            swapCols(D, i, c);
            swapCols(V, i, c);
            progress = true;
        }
    }
    return progress;
}
function fixDivisibility(D, U, i, m, n, ring) {
    for (let r = i + 1; r < m; r++) {
        for (let c = i + 1; c < n; c++) {
            const { r: rem } = ring.quotRem(D[r][c], D[i][i]);
            if (!ring.isZero(rem)) {
                addRow(D, r, i, ring.one, ring);
                addRow(U, r, i, ring.one, ring);
                return false;
            }
        }
    }
    return true;
}
function pivotAt(D, U, V, i, m, n, ring) {
    let changed = true;
    while (changed) {
        changed = reduceColumn(D, U, i, m, ring);
        if (reduceRow(D, V, i, n, ring))
            changed = true;
    }
}
export function smithNormalFormGeneric(M_in, ring) {
    const m = M_in.length;
    const n = m === 0 ? 0 : M_in[0].length;
    const D = m === 0 ? [] : clone(M_in);
    const U = eye(m, ring);
    const V = eye(n, ring);
    let i = 0;
    while (i < Math.min(m, n)) {
        const pivot = findSmallestNonzero(D, i, m, n, ring);
        if (pivot === null)
            break;
        const [pr, pc] = pivot;
        swapRows(D, i, pr);
        swapRows(U, i, pr);
        swapCols(D, i, pc);
        swapCols(V, i, pc);
        pivotAt(D, U, V, i, m, n, ring);
        if (fixDivisibility(D, U, i, m, n, ring))
            i++;
    }
    let rank = 0;
    for (let k = 0; k < Math.min(m, n); k++)
        if (!ring.isZero(D[k][k]))
            rank++;
    return { U, V, D, rank };
}
