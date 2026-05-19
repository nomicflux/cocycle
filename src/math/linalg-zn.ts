// Linear algebra over Z/n (composite n: not a field, not Euclidean).
//
// Lift A and b to integer representatives, take SNF over Z (U·A·V = D, both
// unimodular over Z and hence over Z/n), then reduce mod n.
//
//   A · v = b  (mod n)
//   ⇔  D · w = U·b  (mod n)   where w = V^{-1} · v
//   ⇔  d_i · w_i = (U·b)_i  (mod n)   for each diagonal i
//
// Solvable iff gcd(d_i, n) | (U·b)_i mod n for every i. For free rows
// (d_i = 0 or i past the diagonal), need (U·b)_i ≡ 0 (mod n). Coords
// w_i are recovered via the Bezout coefficient of d_i and n.
//
// Cokernel over Z/n: each Z summand of the integer cokernel becomes Z/n
// (R-free of rank 1); each Z/d_i becomes Z/gcd(d_i, n).

import { smithNormalForm } from "./snf";
import type { RingElement } from "./ring";

function intGcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b !== 0) [a, b] = [b, a % b];
  return a;
}

// Extended Euclidean: returns {g, s, t} with s·a + t·b = g, g = gcd(a, b).
function extGcd(a: number, b: number): { g: number; s: number; t: number } {
  let [oldR, r] = [a, b];
  let [oldS, s] = [1, 0];
  let [oldT, t] = [0, 1];
  while (r !== 0) {
    const q = Math.floor(oldR / r);
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
    [oldT, t] = [t, oldT - q * t];
  }
  return { g: oldR, s: oldS, t: oldT };
}

function mod(x: number, n: number): number {
  return ((x % n) + n) % n;
}

// Centered representative in (-n/2, n/2]. The SNF identity U·A^lift·V = D over
// Z is invariant under the choice of integer representative for each entry of
// A^lift; centering keeps |entries| ≤ n/2 so Euclidean SNF on lifted ±1
// coboundary matrices stays in the {-1, 0, 1} regime instead of mixing in n-1.
function centeredLift(x: number, n: number): number {
  return x > n / 2 ? x - n : x;
}

function liftMatrix(A: RingElement[][], n: number): number[][] {
  return A.map((row) => row.map((x) => centeredLift(x[0], n)));
}

function liftVector(b: RingElement[], n: number): number[] {
  return b.map((x) => centeredLift(x[0], n));
}

function matVec(M: number[][], v: number[], n: number): number[] {
  const rows = M.length;
  const out: number[] = new Array(rows).fill(0);
  for (let i = 0; i < rows; i++) {
    let acc = 0;
    for (let j = 0; j < v.length; j++) acc += M[i][j] * v[j];
    out[i] = mod(acc, n);
  }
  return out;
}

export function solveLinearZn(
  A: RingElement[][], b: RingElement[], n: number,
): RingElement[] | null {
  const m = A.length;
  const nCols = m === 0 ? 0 : A[0].length;
  if (m === 0) return b.length === 0 ? [] : null;
  if (nCols === 0) return b.every((x) => x[0] === 0) ? [] : null;
  const Aint = liftMatrix(A, n);
  const bint = liftVector(b, n);
  const snf = smithNormalForm(Aint);
  const Ub = matVec(snf.U, bint, n);
  const w: number[] = new Array(nCols).fill(0);
  const r = Math.min(m, nCols);
  for (let i = 0; i < r; i++) {
    const d = mod(snf.D[i][i], n);
    if (d === 0) {
      if (Ub[i] !== 0) return null;
    } else {
      const g = intGcd(d, n);
      if (Ub[i] % g !== 0) return null;
      const { s } = extGcd(d, n);
      // d·s ≡ g (mod n), so w_i = s · (Ub[i] / g) gives d · w_i ≡ Ub[i] (mod n).
      w[i] = mod(s * (Ub[i] / g), n);
    }
  }
  for (let i = r; i < m; i++) if (Ub[i] !== 0) return null;
  const v = matVec(snf.V, w, n);
  return v.map((x) => [x] as RingElement);
}

export function cokernelStructureZn(
  A: RingElement[][], n: number,
): { rank: number; torsion: number[] } {
  const m = A.length;
  const nCols = m === 0 ? 0 : A[0].length;
  if (m === 0 || nCols === 0) return { rank: m, torsion: [] };
  const snf = smithNormalForm(liftMatrix(A, n));
  const torsion: number[] = [];
  let p = 0;
  for (let k = 0; k < Math.min(m, nCols); k++) {
    const d = snf.D[k][k];
    if (d === 0) continue;
    p++;
    const g = intGcd(Math.abs(d), n);
    if (g > 1) torsion.push(g);
  }
  return { rank: m - p, torsion };
}

// ker(A) over Z/n. Use SNF: A·v ≡ 0 iff D·(V^{-1} v) ≡ 0 iff each component w_i
// satisfies d_i · w_i ≡ 0 (mod n), i.e., w_i ∈ (n/gcd(d_i,n)) · Z/n. Generators
// are V · e_i scaled by that minimal multiplier.
export function kernelBasisZn(
  A: RingElement[][], nCols: number, n: number,
): RingElement[][] {
  if (nCols === 0) return [];
  if (A.length === 0 || (A[0]?.length ?? 0) === 0) {
    return Array.from({ length: nCols }, (_, j) => {
      const v: RingElement[] = new Array(nCols).fill([0] as RingElement);
      v[j] = [1] as RingElement;
      return v;
    });
  }
  const m = A.length;
  const snf = smithNormalForm(liftMatrix(A, n));
  const basis: RingElement[][] = [];
  for (let i = 0; i < nCols; i++) {
    const d = i < Math.min(m, nCols) ? snf.D[i][i] : 0;
    const annihilator = d === 0 ? 1 : n / intGcd(Math.abs(d), n);
    if (annihilator === n) continue; // d is a unit mod n → no kernel contribution
    const col = snf.V.map((row) => mod(row[i] * annihilator, n));
    basis.push(col.map((x) => [x] as RingElement));
  }
  return basis;
}
