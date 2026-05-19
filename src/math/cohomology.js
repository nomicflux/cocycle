// Cohomology of a chain complex with coefficients in a ring R.
//
// All three exports — cohomology, isCoboundary, classCoordinates — are
// ring-agnostic: they ask the Ring for linear-algebra primitives and apply
// UCT for the H^k(C; R) structure. Per-ring dispatch lives in makeRing.
import { simplexKey } from "../state/types";
import { coboundaryMatrix } from "./coboundary";
import { smithNormalForm } from "./snf";
import { ZRing } from "./ring";
function integerMatrixOverRing(M, ring) {
    return M.map((row) => row.map((v) => ring.fromInt(v)));
}
function mapToRingVector(values, simplices, ring) {
    return simplices.map((s) => values.get(simplexKey(s)) ?? ring.zero);
}
function vectorToCochainRing(values, simplices, degree, ring) {
    const map = new Map();
    simplices.forEach((s, i) => {
        if (!ring.isZero(values[i]))
            map.set(simplexKey(s), values[i]);
    });
    return { degree, values: map };
}
// Rank and torsion factors of an integer matrix's SNF diagonal.
function intSnfDiags(D) {
    if (D.length === 0 || (D[0]?.length ?? 0) === 0)
        return { p: 0, torsion: [] };
    const snf = smithNormalForm(D);
    let p = 0;
    const torsion = [];
    const r = Math.min(snf.D.length, snf.D[0]?.length ?? 0);
    for (let i = 0; i < r; i++) {
        const d = snf.D[i][i];
        if (d !== 0) {
            p++;
            if (Math.abs(d) > 1)
                torsion.push(Math.abs(d));
        }
    }
    return { p, torsion };
}
function isInColSpan(A, b, ring) {
    if (A.length === 0 || (A[0]?.length ?? 0) === 0) {
        return b.every((x) => ring.isZero(x));
    }
    return ring.solveLinearSystem(A, b) !== null;
}
// Greedy pick of `rank` cocycles that are R-independent modulo im(D^{k-1}).
// Augments the column matrix with each chosen v so subsequent picks are checked
// against the growing span.
function pickFreeBasis(kerBasis, Dkm1, rank, ring) {
    if (rank === 0)
        return [];
    const m = kerBasis[0]?.length ?? 0;
    if (m === 0)
        return [];
    const aug = Array.from({ length: m }, (_, i) => (Dkm1[i] ?? []).slice());
    const selected = [];
    for (const v of kerBasis) {
        if (selected.length >= rank)
            break;
        if (v.every((x) => ring.isZero(x)))
            continue;
        if (isInColSpan(aug, v, ring))
            continue;
        selected.push(v);
        for (let i = 0; i < m; i++)
            aug[i].push(v[i] ?? ring.zero);
    }
    return selected;
}
export function cohomology(nerve, k, ring = ZRing) {
    const simplicesK = nerve.byDim[k] ?? [];
    const Nk = simplicesK.length;
    if (Nk === 0)
        return { rank: 0, torsion: [], cocycleBasis: [] };
    const Dk_int = coboundaryMatrix(nerve, k);
    const Dkm1_int = k > 0 ? coboundaryMatrix(nerve, k - 1) : [];
    const snfPrev = intSnfDiags(Dkm1_int);
    const snfThis = intSnfDiags(Dk_int);
    // Integer H^k: free rank = Nk - rank(D^k) - rank(D^{k-1}); torsion comes
    // from SNF(D^{k-1}). snfThis.torsion feeds UCT's Tor(H^{k+1}(Z), R) term.
    const intHk = {
        rank: Nk - snfThis.p - snfPrev.p,
        torsion: snfPrev.torsion,
    };
    const { rank, torsion } = ring.applyUCT(intHk, snfThis.torsion);
    const Dk_R = integerMatrixOverRing(Dk_int, ring);
    const Dkm1_R = integerMatrixOverRing(Dkm1_int, ring);
    const kerBasis = ring.kernelBasis(Dk_R, Nk);
    const cocycleBasis = rank > 0
        ? pickFreeBasis(kerBasis, Dkm1_R, rank, ring).map((v) => ({
            cochain: vectorToCochainRing(v, simplicesK, k, ring),
            isCoboundary: false,
        }))
        : kerBasis.map((v) => ({
            cochain: vectorToCochainRing(v, simplicesK, k, ring),
            isCoboundary: isInColSpan(Dkm1_R, v, ring),
        }));
    return { rank, torsion, cocycleBasis };
}
export function isCoboundary(values, nerve, k, ring = ZRing) {
    const simplicesK = nerve.byDim[k] ?? [];
    if (simplicesK.length === 0)
        return true;
    const c = mapToRingVector(values, simplicesK, ring);
    if (c.every((x) => ring.isZero(x)))
        return true;
    if (k === 0)
        return false;
    const Dkm1_R = integerMatrixOverRing(coboundaryMatrix(nerve, k - 1), ring);
    if (Dkm1_R.length === 0 || (Dkm1_R[0]?.length ?? 0) === 0)
        return false;
    return ring.solveLinearSystem(Dkm1_R, c) !== null;
}
function buildClassMatrix(simplicesK, generators, B, r, Nkm1, ring) {
    return simplicesK.map((s, i) => {
        const row = [];
        for (let j = 0; j < r; j++) {
            const v = generators[j].cochain.values.get(simplexKey(s));
            row.push(v === undefined ? ring.zero : v);
        }
        for (let j = 0; j < Nkm1; j++)
            row.push(B[i]?.[j] ?? ring.zero);
        return row;
    });
}
export function classCoordinates(values, nerve, k, ring = ZRing) {
    const simplicesK = nerve.byDim[k] ?? [];
    const Nk = simplicesK.length;
    if (Nk === 0)
        return [];
    const c = mapToRingVector(values, simplicesK, ring);
    const cohK = cohomology(nerve, k, ring);
    const generators = cohK.cocycleBasis.filter((cb) => !cb.isCoboundary);
    const r = generators.length;
    const Dkm1_R = integerMatrixOverRing(k > 0 ? coboundaryMatrix(nerve, k - 1) : [], ring);
    const Nkm1 = Dkm1_R[0]?.length ?? 0;
    if (r === 0 && Nkm1 === 0) {
        return c.every((x) => ring.isZero(x)) ? [] : null;
    }
    const A = buildClassMatrix(simplicesK, generators, Dkm1_R, r, Nkm1, ring);
    const sol = ring.solveLinearSystem(A, c);
    return sol === null ? null : sol.slice(0, r);
}
