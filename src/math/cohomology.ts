import type { Cochain, Nerve, Simplex, SimplexKey } from "../state/types";
import { simplexKey } from "../state/types";
import { coboundaryMatrix } from "./coboundary";
import { smithNormalForm, SNF } from "./snf";

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
  if (k > 0) {
    const Dkm1 = coboundaryMatrix(nerve, k - 1);
    if (Dkm1.length > 0 && Dkm1[0].length > 0) {
      snfPrev = smithNormalForm(Dkm1);
      const diagPrev = diagOf(snfPrev.D);
      for (const d of diagPrev) {
        if (d !== 0) { p++; if (Math.abs(d) > 1) torsion.push(Math.abs(d)); }
      }
    }
  }

  const cocycleBasis: CocycleEntry[] = kerBasis.map((v) => ({
    cochain: vectorToCochain(v, simplicesK, k),
    isCoboundary: snfPrev !== null && isInColumnSpan(v, snfPrev, Nk),
  }));

  return { rank: kerDim - p, torsion, cocycleBasis };
}
