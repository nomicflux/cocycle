// Smith Normal Form over Z.
// Given integer matrix M (m x n), returns U (m x m), V (n x n), D (m x n) with
// U·M·V = D, U and V unimodular, and D diagonal with d_1 | d_2 | ... | d_r > 0
// followed by zeros.
const eye = (n) => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
const clone = (M) => M.map((row) => row.slice());
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
function addRow(M, src, dst, mult) {
    const cols = M[0].length;
    for (let k = 0; k < cols; k++)
        M[dst][k] += mult * M[src][k];
}
function addCol(M, src, dst, mult) {
    for (let k = 0; k < M.length; k++)
        M[k][dst] += mult * M[k][src];
}
function negateRow(M, i) {
    for (let k = 0; k < M[0].length; k++)
        M[i][k] = M[i][k] === 0 ? 0 : -M[i][k];
}
function findSmallestNonzero(D, i0, m, n) {
    let r = -1, c = -1, best = Infinity;
    for (let r2 = i0; r2 < m; r2++) {
        for (let c2 = i0; c2 < n; c2++) {
            const v = Math.abs(D[r2][c2]);
            if (v > 0 && v < best) {
                best = v;
                r = r2;
                c = c2;
            }
        }
    }
    return r === -1 ? null : [r, c];
}
function reduceColumn(D, U, i, m) {
    let progress = false;
    for (let r = i + 1; r < m; r++) {
        if (D[r][i] === 0)
            continue;
        const q = Math.trunc(D[r][i] / D[i][i]);
        if (q !== 0) {
            addRow(D, i, r, -q);
            addRow(U, i, r, -q);
        }
        if (D[r][i] !== 0) {
            swapRows(D, i, r);
            swapRows(U, i, r);
            progress = true;
        }
    }
    return progress;
}
function reduceRow(D, V, i, n) {
    let progress = false;
    for (let c = i + 1; c < n; c++) {
        if (D[i][c] === 0)
            continue;
        const q = Math.trunc(D[i][c] / D[i][i]);
        if (q !== 0) {
            addCol(D, i, c, -q);
            addCol(V, i, c, -q);
        }
        if (D[i][c] !== 0) {
            swapCols(D, i, c);
            swapCols(V, i, c);
            progress = true;
        }
    }
    return progress;
}
function fixDivisibility(D, U, i, m, n) {
    for (let r = i + 1; r < m; r++) {
        for (let c = i + 1; c < n; c++) {
            if (D[r][c] % D[i][i] !== 0) {
                addRow(D, r, i, 1);
                addRow(U, r, i, 1);
                return false;
            }
        }
    }
    return true;
}
function pivotAt(D, U, V, i, m, n) {
    let changed = true;
    while (changed) {
        changed = reduceColumn(D, U, i, m);
        if (reduceRow(D, V, i, n))
            changed = true;
    }
    if (D[i][i] < 0) {
        negateRow(D, i);
        negateRow(U, i);
    }
}
export function smithNormalForm(M_in) {
    const m = M_in.length;
    const n = m === 0 ? 0 : M_in[0].length;
    const D = m === 0 ? [] : clone(M_in);
    const U = eye(m);
    const V = eye(n);
    let i = 0;
    while (i < Math.min(m, n)) {
        const pivot = findSmallestNonzero(D, i, m, n);
        if (pivot === null)
            break;
        const [pr, pc] = pivot;
        swapRows(D, i, pr);
        swapRows(U, i, pr);
        swapCols(D, i, pc);
        swapCols(V, i, pc);
        pivotAt(D, U, V, i, m, n);
        if (fixDivisibility(D, U, i, m, n))
            i++;
    }
    let rank = 0;
    for (let k = 0; k < Math.min(m, n); k++)
        if (D[k][k] !== 0)
            rank++;
    return { U, V, D, rank };
}
export function matrixRank(M) {
    if (M.length === 0 || M[0].length === 0)
        return 0;
    return smithNormalForm(M).rank;
}
