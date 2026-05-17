import type { Cochain, Nerve, Simplex, SimplexKey } from "../state/types";
import { simplexKey } from "../state/types";
import { coboundaryMatrix } from "./coboundary";
import { matrixRank, smithNormalForm, SNF } from "./snf";

export type CocycleEntry = { cochain: Cochain; isCoboundary: boolean };

export type CohomologyDim = {
  rank: number;                  // free rank of H^k
  torsion: number[];             // invariant factors > 1 (each gives Z/d)
  cocycleBasis: CocycleEntry[];  // a Z-basis of ker(δ^k), annotated
};

function vectorToCochain(values: number[], simplices: Simplex[], degree: number): Cochain {
  const map = new Map<SimplexKey, number>();
  simplices.forEach((s, i) => {
    if (values[i] !== 0) map.set(simplexKey(s), values[i]);
  });
  return { degree, values: map };
}

function diagOf(D: number[][]): number[] {
  const r: number[] = [];
  const n = Math.min(D.length, D[0]?.length ?? 0);
  for (let i = 0; i < n; i++) r.push(D[i][i]);
  return r;
}

function kernelBasis(M: number[][], nCols: number): number[][] {
  if (M.length === 0 || M[0]?.length === 0 || nCols === 0) {
    return Array.from({ length: nCols }, (_, j) => {
      const v = new Array(nCols).fill(0);
      v[j] = 1;
      return v;
    });
  }
  const snf = smithNormalForm(M);
  const rk = snf.rank;
  const basis: number[][] = [];
  for (let j = rk; j < nCols; j++) {
    basis.push(snf.V.map((row) => row[j]));
  }
  return basis;
}

function isInColumnSpan(b: number[], snf: SNF, m: number): boolean {
  if (b.every((x) => x === 0)) return true;
  const Ub = new Array(m).fill(0);
  for (let i = 0; i < m; i++) {
    let acc = 0;
    for (let j = 0; j < m; j++) acc += snf.U[i][j] * b[j];
    Ub[i] = acc;
  }
  const diag = diagOf(snf.D);
  for (let i = 0; i < m; i++) {
    const d = diag[i] ?? 0;
    if (d === 0) { if (Ub[i] !== 0) return false; }
    else if (Ub[i] % d !== 0) return false;
  }
  return true;
}

export function isCoboundary(values: Map<SimplexKey, number>, nerve: Nerve, k: number): boolean {
  const simplicesK = nerve.byDim[k] ?? [];
  if (simplicesK.length === 0) return true;
  const b = simplicesK.map((s) => values.get(simplexKey(s)) ?? 0);
  if (b.every((x) => x === 0)) return true;
  if (k === 0) return false;
  const Dkm1 = coboundaryMatrix(nerve, k - 1);
  if (Dkm1.length === 0 || (Dkm1[0]?.length ?? 0) === 0) return false;
  const snf = smithNormalForm(Dkm1);
  return isInColumnSpan(b, snf, simplicesK.length);
}

function matVecMul(M: number[][], v: number[], rows: number, cols: number): number[] {
  const out = new Array(rows).fill(0);
  for (let i = 0; i < rows; i++) {
    let acc = 0;
    for (let j = 0; j < cols; j++) acc += M[i][j] * v[j];
    out[i] = acc;
  }
  return out;
}

function solveLinearOverZ(A: number[][], c: number[]): number[] | null {
  const m = A.length;
  const n = A[0]?.length ?? 0;
  if (m === 0) return c.length === 0 ? [] : null;
  if (n === 0) return c.every((x) => x === 0) ? [] : null;
  const snf = smithNormalForm(A);
  const Uc = matVecMul(snf.U, c, m, m);
  const y = new Array(n).fill(0);
  const r = Math.min(m, n);
  for (let i = 0; i < r; i++) {
    const d = snf.D[i][i];
    if (d === 0) { if (Uc[i] !== 0) return null; }
    else if (Uc[i] % d !== 0) return null;
    else y[i] = Uc[i] / d;
  }
  for (let i = r; i < m; i++) if (Uc[i] !== 0) return null;
  return matVecMul(snf.V, y, n, n);
}

function buildClassMatrix(simplicesK: Simplex[], generators: CocycleEntry[], B: number[][], r: number, Nkm1: number): number[][] {
  return simplicesK.map((s, i) => {
    const row: number[] = [];
    for (let j = 0; j < r; j++) row.push(generators[j].cochain.values.get(simplexKey(s)) ?? 0);
    for (let j = 0; j < Nkm1; j++) row.push(B[i]?.[j] ?? 0);
    return row;
  });
}

export function classCoordinates(values: Map<SimplexKey, number>, nerve: Nerve, k: number): number[] | null {
  const simplicesK = nerve.byDim[k] ?? [];
  const Nk = simplicesK.length;
  if (Nk === 0) return [];
  const c = simplicesK.map((s) => values.get(simplexKey(s)) ?? 0);
  const cohK = cohomology(nerve, k);
  const generators = cohK.cocycleBasis.filter((cb) => !cb.isCoboundary);
  const r = generators.length;
  const Dkm1 = k > 0 ? coboundaryMatrix(nerve, k - 1) : [];
  const Nkm1 = Dkm1[0]?.length ?? 0;
  if (r === 0 && Nkm1 === 0) return c.every((x) => x === 0) ? [] : null;
  const A = buildClassMatrix(simplicesK, generators, Dkm1, r, Nkm1);
  const sol = solveLinearOverZ(A, c);
  return sol === null ? null : sol.slice(0, r);
}

function colsToMatrix(cols: number[][], nRows: number): number[][] {
  if (cols.length === 0 || nRows === 0) return [];
  const M: number[][] = [];
  for (let i = 0; i < nRows; i++) M.push(cols.map((c) => c[i] ?? 0));
  return M;
}

function extractCols(M: number[][]): number[][] {
  const cols: number[][] = [];
  const n = M[0]?.length ?? 0;
  for (let j = 0; j < n; j++) cols.push(M.map((row) => row[j] ?? 0));
  return cols;
}

function pickFreeHkBasis(kerBasis: number[][], Dkm1: number[][], targetRank: number, Nk: number): number[][] {
  if (targetRank === 0) return [];
  const baseCols = Dkm1.length > 0 && (Dkm1[0]?.length ?? 0) > 0 ? extractCols(Dkm1) : [];
  let currentRank = baseCols.length === 0 ? 0 : matrixRank(colsToMatrix(baseCols, Nk));
  const out: number[][] = [];
  for (const v of kerBasis) {
    if (out.length >= targetRank) break;
    const r = matrixRank(colsToMatrix([...baseCols, ...out, v], Nk));
    if (r > currentRank) { out.push(v); currentRank = r; }
  }
  return out;
}

export function cohomology(nerve: Nerve, k: number): CohomologyDim {
  const simplicesK = nerve.byDim[k] ?? [];
  const Nk = simplicesK.length;
  if (Nk === 0) return { rank: 0, torsion: [], cocycleBasis: [] };

  const Dk = coboundaryMatrix(nerve, k);
  const kerBasis = kernelBasis(Dk, Nk);
  const kerDim = kerBasis.length;

  let p = 0;
  const torsion: number[] = [];
  let snfPrev: SNF | null = null;
  const Dkm1 = k > 0 ? coboundaryMatrix(nerve, k - 1) : [];
  if (Dkm1.length > 0 && (Dkm1[0]?.length ?? 0) > 0) {
    snfPrev = smithNormalForm(Dkm1);
    const diagPrev = diagOf(snfPrev.D);
    for (const d of diagPrev) {
      if (d !== 0) { p++; if (Math.abs(d) > 1) torsion.push(Math.abs(d)); }
    }
  }

  const freeRank = kerDim - p;
  const cocycleBasis: CocycleEntry[] =
    freeRank > 0
      ? pickFreeHkBasis(kerBasis, Dkm1, freeRank, Nk).map((v) => ({
          cochain: vectorToCochain(v, simplicesK, k),
          isCoboundary: false,
        }))
      : kerBasis.map((v) => ({
          cochain: vectorToCochain(v, simplicesK, k),
          isCoboundary: snfPrev !== null && isInColumnSpan(v, snfPrev, Nk),
        }));

  return { rank: freeRank, torsion, cocycleBasis };
}
