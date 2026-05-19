// Coefficient ring abstraction.
//
// Implemented rings: Z, Z/n (n ≥ 2; field structure when n is prime),
// Q (rationals), Z[i] (Gaussian integers), Z[ω] (Eisenstein integers, ω² = -1-ω).
//
// A `RingElement` is a small immutable tuple of numbers. Each Ring knows its
// own element shape:
//   Z:  [n]
//   Q:  [num, den]  with den > 0, gcd(|num|, den) = 1
//   Zp: [n]         with 0 <= n < p
//   Zi: [a, b]      a + bi
//   Zw: [a, b]      a + bω,  ω² + ω + 1 = 0
//
// Each Ring also carries the linear-algebra primitives the cohomology code
// needs (one statement of math, dispatched once here): solveLinearSystem,
// cokernelStructure, kernelBasis. Plus the Euclidean primitives quotRem and
// norm consumed by snf-generic (trivial for fields).

import {
  solveLinearEuclidean,
  cokernelStructureEuclidean,
  kernelBasisEuclidean,
} from "./linalg-euclidean";
import {
  solveLinearOverField,
  cokernelStructureOverField,
  kernelBasisOverField,
} from "./rank";
import {
  solveLinearZn,
  cokernelStructureZn,
  kernelBasisZn,
} from "./linalg-zn";

export type RingSpec =
  | { kind: "Z" }
  | { kind: "Q" }
  | { kind: "Zp"; p: number }
  | { kind: "Zi" }
  | { kind: "Zw" };

export type RingElement = readonly number[];

// Drives the per-ring renderer in the cochain input UI. The math layer
// declares the input shape; the UI dispatches.
export type InputShape =
  | { kind: "integer" }                            // Z
  | { kind: "fraction" }                           // Q
  | { kind: "mod-cycle"; p: number }               // Z/p
  | { kind: "complex"; imagSymbol: "i" | "ω" };    // Z[i], Z[ω]

export interface Ring {
  spec: RingSpec;
  zero: RingElement;
  one: RingElement;
  isZero(x: RingElement): boolean;
  eq(x: RingElement, y: RingElement): boolean;
  add(x: RingElement, y: RingElement): RingElement;
  neg(x: RingElement): RingElement;
  mul(x: RingElement, y: RingElement): RingElement;
  fromInt(n: number): RingElement;
  parse(s: string): RingElement | null;
  format(x: RingElement): string;
  isPositive(x: RingElement): boolean;
  inputShape(): InputShape;
  // Euclidean primitives. Fields return {q = x·y⁻¹, r = 0}; non-Euclidean
  // PIRs (composite Z/n) provide stubs — they never reach snf-generic.
  quotRem(a: RingElement, b: RingElement): { q: RingElement; r: RingElement };
  norm(x: RingElement): number;
  // Particular solution v of A · v = b over R, or null if no solution.
  solveLinearSystem(A: RingElement[][], b: RingElement[]): RingElement[] | null;
  // R-module structure of R^m / col(A): R-free rank + invariant-factor sizes.
  cokernelStructure(A: RingElement[][]): { rank: number; torsion: number[] };
  // Generators of ker(A: R^nCols → R^m) as a sub-R-module of R^nCols.
  kernelBasis(A: RingElement[][], nCols: number): RingElement[][];
  // Universal Coefficient Theorem applied to this ring.
  //   H^k(C; R) = H^k(C; Z) ⊗ R ⊕ Tor(H^{k+1}(C; Z), R)
  // Given the integer rank/torsion of H^k(Z) and the integer torsion of
  // H^{k+1}(Z), return the R-module decomposition: R-free rank and
  // invariant-factor sizes (each ≥ 2).
  applyUCT(
    intHk: { rank: number; torsion: number[] },
    nextIntegerTorsion: number[],
  ): { rank: number; torsion: number[] };
}

// ------------------------ Z ------------------------

const Z_ZERO: RingElement = [0];
const Z_ONE: RingElement = [1];

export const ZRing: Ring = {
  spec: { kind: "Z" },
  zero: Z_ZERO,
  one: Z_ONE,
  isZero: (x) => x[0] === 0,
  eq: (x, y) => x[0] === y[0],
  add: (x, y) => [x[0] + y[0]],
  neg: (x) => [-x[0]],
  mul: (x, y) => [x[0] * y[0]],
  fromInt: (n) => [n],
  parse: (s) => {
    const v = parseInt(s.trim(), 10);
    return Number.isFinite(v) ? [v] : null;
  },
  format: (x) => String(x[0]),
  isPositive: (x) => x[0] > 0,
  inputShape: () => ({ kind: "integer" }),
  quotRem: (a, b) => {
    if (b[0] === 0) throw new Error("Z: quotRem by zero");
    const q = Math.trunc(a[0] / b[0]);
    return { q: [q], r: [a[0] - q * b[0]] };
  },
  norm: (x) => Math.abs(x[0]),
  solveLinearSystem: (A, b) => solveLinearEuclidean(A, b, ZRing),
  cokernelStructure: (A) => cokernelStructureEuclidean(A, ZRing),
  kernelBasis: (A, nCols) => kernelBasisEuclidean(A, nCols, ZRing),
  applyUCT: (intHk) => ({ rank: intHk.rank, torsion: [...intHk.torsion] }),
};

// ------------------------ Z/p ------------------------

function intGcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b !== 0) [a, b] = [b, a % b];
  return a;
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n < 4) return true;
  if (n % 2 === 0) return false;
  for (let i = 3; i * i <= n; i += 2) if (n % i === 0) return false;
  return true;
}

// Modular inverse via extended Euclidean. Requires gcd(x, p) = 1.
function modInv(x: number, p: number): number {
  let [oldR, r] = [x, p];
  let [oldS, s] = [1, 0];
  while (r !== 0) {
    const q = Math.floor(oldR / r);
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  if (oldR !== 1 && oldR !== -1) {
    throw new Error(`Z/${p}: ${x} has no inverse (not coprime to ${p})`);
  }
  return ((oldS * oldR) % p + p) % p;
}

export function ZpRing(p: number): Ring {
  if (!Number.isInteger(p) || p < 2) {
    throw new Error("Z/p requires integer p >= 2");
  }
  const isField = isPrime(p);
  const mod = (n: number): number => ((n % p) + p) % p;
  const r: Ring = {
    spec: { kind: "Zp", p },
    zero: [0],
    one: [mod(1)],
    isZero: (x) => x[0] === 0,
    eq: (x, y) => x[0] === y[0],
    add: (x, y) => [mod(x[0] + y[0])],
    neg: (x) => [mod(-x[0])],
    mul: (x, y) => [mod(x[0] * y[0])],
    fromInt: (n) => [mod(n)],
    parse: (s) => {
      const v = parseInt(s.trim(), 10);
      return Number.isFinite(v) ? [mod(v)] : null;
    },
    format: (x) => String(x[0]),
    isPositive: () => false,
    inputShape: () => ({ kind: "mod-cycle", p }),
    quotRem: isField
      ? (a, b) => {
          if (b[0] === 0) throw new Error(`Z/${p}: quotRem by zero`);
          return { q: [mod(a[0] * modInv(b[0], p))], r: [0] };
        }
      : (a, _b) => ({ q: [0], r: a }),
    norm: (x) => (x[0] === 0 ? 0 : 1),
    solveLinearSystem: isField
      ? (A, b) => solveLinearOverField(A, b, r)
      : (A, b) => solveLinearZn(A, b, p),
    cokernelStructure: isField
      ? (A) => cokernelStructureOverField(A, r)
      : (A) => cokernelStructureZn(A, p),
    kernelBasis: isField
      ? (A, nCols) => kernelBasisOverField(A, nCols, r)
      : (A, nCols) => kernelBasisZn(A, nCols, p),
    applyUCT: isField
      ? (intHk, tNext) => {
          // Field of char p: Z/d ⊗ R = R iff p|d else 0; Tor(Z/e, R) = R iff p|e else 0.
          const fromTor = intHk.torsion.filter((d) => d % p === 0).length;
          const fromNext = tNext.filter((e) => e % p === 0).length;
          return { rank: intHk.rank + fromTor + fromNext, torsion: [] };
        }
      : (intHk, tNext) => {
          let rank = intHk.rank;
          const torsion: number[] = [];
          const fold = (d: number): void => {
            const g = intGcd(d, p);
            if (g === p) rank++;
            else if (g > 1) torsion.push(g);
          };
          for (const d of intHk.torsion) fold(d);
          for (const e of tNext) fold(e);
          return { rank, torsion };
        },
  };
  return r;
}

// Returns true iff p is prime (so Z/p is a field). cohomology() uses this
// to choose between the field path and the unimplemented composite path.
export function isZpField(spec: RingSpec): boolean {
  return spec.kind === "Zp" && isPrime(spec.p);
}

// Inverse of x in Z/p (p prime). Used by rank.ts when normalizing pivots.
export function zpInv(spec: { kind: "Zp"; p: number }, x: RingElement): RingElement {
  return [modInv(x[0], spec.p)];
}

// ------------------------ Q ------------------------

function canonicalQ(n: number, d: number): RingElement {
  if (d === 0) throw new Error("Q: zero denominator");
  if (n === 0) return [0, 1];
  if (d < 0) { n = -n; d = -d; }
  const g = intGcd(n, d);
  return [n / g, d / g];
}

export const QRing: Ring = {
  spec: { kind: "Q" },
  zero: [0, 1],
  one: [1, 1],
  isZero: (x) => x[0] === 0,
  eq: (x, y) => x[0] * y[1] === y[0] * x[1],
  add: (x, y) => canonicalQ(x[0] * y[1] + y[0] * x[1], x[1] * y[1]),
  neg: (x) => [-x[0], x[1]],
  mul: (x, y) => canonicalQ(x[0] * y[0], x[1] * y[1]),
  fromInt: (n) => [n, 1],
  parse: (s) => {
    const t = s.trim();
    if (t.includes("/")) {
      const idx = t.indexOf("/");
      const ni = parseInt(t.slice(0, idx), 10);
      const di = parseInt(t.slice(idx + 1), 10);
      if (!Number.isFinite(ni) || !Number.isFinite(di) || di === 0) return null;
      return canonicalQ(ni, di);
    }
    const v = parseInt(t, 10);
    return Number.isFinite(v) ? [v, 1] : null;
  },
  format: (x) => (x[1] === 1 ? String(x[0]) : `${x[0]}/${x[1]}`),
  isPositive: (x) => x[0] > 0,
  inputShape: () => ({ kind: "fraction" }),
  quotRem: (a, b) => {
    if (b[0] === 0) throw new Error("Q: quotRem by zero");
    return { q: canonicalQ(a[0] * b[1], a[1] * b[0]), r: [0, 1] };
  },
  norm: (x) => (x[0] === 0 ? 0 : 1),
  solveLinearSystem: (A, b) => solveLinearOverField(A, b, QRing),
  cokernelStructure: (A) => cokernelStructureOverField(A, QRing),
  kernelBasis: (A, nCols) => kernelBasisOverField(A, nCols, QRing),
  applyUCT: (intHk) => ({ rank: intHk.rank, torsion: [] }),
};

// Inverse in Q. Used by rank.ts.
export function qInv(x: RingElement): RingElement {
  if (x[0] === 0) throw new Error("Q: division by zero");
  return canonicalQ(x[1], x[0]);
}

// ------------------------ Z[i] ------------------------

function ziMul(x: RingElement, y: RingElement): RingElement {
  return [x[0] * y[0] - x[1] * y[1], x[0] * y[1] + x[1] * y[0]];
}

function nearestInt(x: number): number {
  return Math.round(x);
}

// Gaussian-integer division. q ≈ a/b in C, rounded to nearest Z[i] element;
// r = a - q·b satisfies N(r) < N(b).
function ziQuotRem(a: RingElement, b: RingElement): { q: RingElement; r: RingElement } {
  const [a1, a2] = a;
  const [b1, b2] = b;
  const nb = b1 * b1 + b2 * b2;
  if (nb === 0) throw new Error("Z[i]: quotRem by zero");
  const qr = nearestInt((a1 * b1 + a2 * b2) / nb);
  const qi = nearestInt((a2 * b1 - a1 * b2) / nb);
  const q: RingElement = [qr, qi];
  const qb = ziMul(q, b);
  return { q, r: [a1 - qb[0], a2 - qb[1]] };
}

function parseSignedTerm(t: string): { coef: number; symbol: "" | "i" | "w" } | null {
  // Parses a single signed term like "3", "-2", "+i", "-i", "5i", "3w", etc.
  // For coefficient-only terms returns symbol "". Returns null on parse error.
  if (t.length === 0) return null;
  let sign = 1;
  let s = t;
  if (s[0] === "+") { s = s.slice(1); }
  else if (s[0] === "−" || s[0] === "-") { sign = -1; s = s.slice(1); }
  if (s.length === 0) return null;
  const lastChar = s[s.length - 1];
  const symbol: "" | "i" | "w" =
    lastChar === "i" ? "i"
    : (lastChar === "w" || lastChar === "ω") ? "w"
    : "";
  const numPart = symbol === "" ? s : s.slice(0, -1);
  let coef: number;
  if (numPart.length === 0) coef = 1;
  else {
    const v = parseInt(numPart, 10);
    if (!Number.isFinite(v)) return null;
    coef = v;
  }
  return { coef: sign * coef, symbol };
}

function parseComplex(s: string, imagSym: "i" | "w"): RingElement | null {
  let t = s.trim().replace(/\s+/g, "");
  if (t.length === 0) return null;
  const splitIdx: number[] = [];
  for (let i = 1; i < t.length; i++) {
    if (t[i] === "+" || t[i] === "-" || t[i] === "−") splitIdx.push(i);
  }
  let pieces: string[];
  if (splitIdx.length === 0) pieces = [t];
  else if (splitIdx.length === 1) pieces = [t.slice(0, splitIdx[0]), t.slice(splitIdx[0])];
  else return null;
  let a = 0, b = 0;
  for (const p of pieces) {
    const term = parseSignedTerm(p);
    if (term === null) return null;
    if (term.symbol === "") a += term.coef;
    else if (term.symbol === imagSym) b += term.coef;
    else return null;
  }
  return [a, b];
}

function formatComplex(x: RingElement, sym: string): string {
  const [a, b] = x;
  if (b === 0) return String(a);
  const bAbs = Math.abs(b);
  const bStr = bAbs === 1 ? sym : `${bAbs}${sym}`;
  if (a === 0) return b > 0 ? bStr : `-${bStr}`;
  const op = b > 0 ? "+" : "-";
  return `${a}${op}${bStr}`;
}

export const ZiRing: Ring = {
  spec: { kind: "Zi" },
  zero: [0, 0],
  one: [1, 0],
  isZero: (x) => x[0] === 0 && x[1] === 0,
  eq: (x, y) => x[0] === y[0] && x[1] === y[1],
  add: (x, y) => [x[0] + y[0], x[1] + y[1]],
  neg: (x) => [-x[0], -x[1]],
  mul: ziMul,
  fromInt: (n) => [n, 0],
  parse: (s) => parseComplex(s, "i"),
  format: (x) => formatComplex(x, "i"),
  isPositive: () => false,
  inputShape: () => ({ kind: "complex", imagSymbol: "i" }),
  quotRem: ziQuotRem,
  norm: (x) => x[0] * x[0] + x[1] * x[1],
  solveLinearSystem: (A, b) => solveLinearEuclidean(A, b, ZiRing),
  cokernelStructure: (A) => cokernelStructureEuclidean(A, ZiRing),
  kernelBasis: (A, nCols) => kernelBasisEuclidean(A, nCols, ZiRing),
  applyUCT: (intHk) => ({ rank: intHk.rank, torsion: [...intHk.torsion] }),
};

// ------------------------ Z[ω] ------------------------
// ω² + ω + 1 = 0, so ω² = -1 - ω.
// (a + bω)(c + dω) = ac + (ad + bc)ω + bd ω²
//                  = (ac - bd) + (ad + bc - bd) ω
// Conjugate: bar(a + bω) = a + b·bar(ω) = (a - b) - bω
// Norm: N(a + bω) = (a + bω)·bar(a + bω) = a² - ab + b²

function zwMul(x: RingElement, y: RingElement): RingElement {
  const [a, b] = x;
  const [c, d] = y;
  return [a * c - b * d, a * d + b * c - b * d];
}

// Eisenstein division. q ≈ a / b in Q[ω], rounded coordinate-wise.
function zwQuotRem(a: RingElement, b: RingElement): { q: RingElement; r: RingElement } {
  const [a1, a2] = a;
  const [b1, b2] = b;
  const nb = b1 * b1 - b1 * b2 + b2 * b2;
  if (nb === 0) throw new Error("Z[ω]: quotRem by zero");
  // a · bar(b) = (a1·(b1 - b2) + a2·b2) + (a2·b1 - a1·b2)·ω
  const numR = a1 * (b1 - b2) + a2 * b2;
  const numW = a2 * b1 - a1 * b2;
  const qr = nearestInt(numR / nb);
  const qw = nearestInt(numW / nb);
  const q: RingElement = [qr, qw];
  const qb = zwMul(q, b);
  return { q, r: [a1 - qb[0], a2 - qb[1]] };
}

export const ZwRing: Ring = {
  spec: { kind: "Zw" },
  zero: [0, 0],
  one: [1, 0],
  isZero: (x) => x[0] === 0 && x[1] === 0,
  eq: (x, y) => x[0] === y[0] && x[1] === y[1],
  add: (x, y) => [x[0] + y[0], x[1] + y[1]],
  neg: (x) => [-x[0], -x[1]],
  mul: zwMul,
  fromInt: (n) => [n, 0],
  parse: (s) => parseComplex(s.replace(/ω/g, "w"), "w"),
  format: (x) => formatComplex(x, "ω"),
  isPositive: () => false,
  inputShape: () => ({ kind: "complex", imagSymbol: "ω" }),
  quotRem: zwQuotRem,
  norm: (x) => x[0] * x[0] - x[0] * x[1] + x[1] * x[1],
  solveLinearSystem: (A, b) => solveLinearEuclidean(A, b, ZwRing),
  cokernelStructure: (A) => cokernelStructureEuclidean(A, ZwRing),
  kernelBasis: (A, nCols) => kernelBasisEuclidean(A, nCols, ZwRing),
  applyUCT: (intHk) => ({ rank: intHk.rank, torsion: [...intHk.torsion] }),
};

// ------------------------ Dispatch ------------------------

export function makeRing(spec: RingSpec): Ring {
  switch (spec.kind) {
    case "Z": return ZRing;
    case "Zp": return ZpRing(spec.p);
    case "Q":  return QRing;
    case "Zi": return ZiRing;
    case "Zw": return ZwRing;
  }
}

// ------------------------ Helpers ------------------------

// Extract the integer value of a Z element. Used at narrow boundaries where
// the Z path falls back to numeric arithmetic.
export function zToInt(x: RingElement): number {
  return x[0];
}

// Display a ring element with a leading "+" if positive (Z, Q).
export function signedFormat(ring: Ring, x: RingElement): string {
  if (ring.isPositive(x)) return `+${ring.format(x)}`;
  return ring.format(x);
}

// Inverse over a field ring. Throws on non-field or on dividing by zero.
export function fieldInv(ring: Ring, x: RingElement): RingElement {
  if (ring.spec.kind === "Q") return qInv(x);
  if (ring.spec.kind === "Zp" && isPrime(ring.spec.p)) return zpInv(ring.spec, x);
  throw new Error(`fieldInv: ${ring.spec.kind} is not a (supported) field`);
}
