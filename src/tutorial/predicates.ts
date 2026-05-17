import type { Predicate } from "./types";
import type { Disc, Nerve, SimplexKey } from "../state/types";
import { simplexKey } from "../state/types";
import { faces } from "../math/coboundary";
import { classCoordinates, cohomology } from "../math/cohomology";
import { coverComplete, pairComponentCount, tripleComponentCount } from "../math/intersection";

const keyDim = (k: SimplexKey): number => k.split(",").length - 1;

function applyCoboundary(
  values: Map<SimplexKey, number>,
  nerve: Nerve,
  k: number,
): Map<SimplexKey, number> {
  const result = new Map<SimplexKey, number>();
  const targets = nerve.byDim[k + 1] ?? [];
  for (const tau of targets) {
    let acc = 0;
    for (const { face, sign } of faces(tau)) {
      const v = values.get(simplexKey(face)) ?? 0;
      acc += sign * v;
    }
    if (acc !== 0) result.set(simplexKey(tau), acc);
  }
  return result;
}

export const always: Predicate = () => true;

export const hasEdge: Predicate = ({ nerve }) =>
  (nerve.byDim[1]?.length ?? 0) > 0;

export const hasTriangle: Predicate = ({ nerve }) =>
  (nerve.byDim[2]?.length ?? 0) > 0;

export const hasSelectedEdge: Predicate = ({ selectedSimplex, showArrows }) =>
  showArrows && selectedSimplex != null && selectedSimplex.length === 2;

export const hasNonzeroVertexCochain: Predicate = ({
  cochainValues,
  cohomologyDegree,
}) => {
  if (cohomologyDegree !== 0) return false;
  for (const [key, v] of cochainValues) {
    if (v !== 0 && keyDim(key) === 0) return true;
  }
  return false;
};

export const sawDelta: Predicate = ({
  cochainValues,
  nerve,
  cohomologyDegree,
}) => {
  if (cohomologyDegree !== 0) return false;
  let nonzeroVertex = false;
  for (const [key, v] of cochainValues) {
    if (v !== 0 && keyDim(key) === 0) {
      nonzeroVertex = true;
      break;
    }
  }
  if (!nonzeroVertex) return false;
  return applyCoboundary(cochainValues, nerve, 0).size > 0;
};

export const hasH1Cocycle: Predicate = ({
  nerve,
  cochainValues,
  cohomologyDegree,
}) => {
  if (cohomologyDegree !== 1) return false;
  let nonzero = false;
  for (const [key, v] of cochainValues) {
    if (v !== 0 && keyDim(key) === 1) {
      nonzero = true;
      break;
    }
  }
  if (!nonzero) return false;
  return applyCoboundary(cochainValues, nerve, 1).size === 0;
};

export const hasNonCocycle: Predicate = ({
  nerve,
  cochainValues,
  cohomologyDegree,
}) => {
  if (cohomologyDegree < 1) return false;
  return applyCoboundary(cochainValues, nerve, cohomologyDegree).size > 0;
};

export const onH1Tab: Predicate = ({ cohomologyDegree }) =>
  cohomologyDegree === 1;

export const visitedSecondBasis: Predicate = ({ basisCursor }) =>
  basisCursor >= 1;

export const usedCupProduct: Predicate = ({ showCupProduct, cohomologyDegree }) =>
  showCupProduct && cohomologyDegree === 1;

const INITIAL_TORUS_H1: Array<[number, number]> = [
  [-4, -4], [0, -4], [4, -4],
  [-4, 0],  [0, 0],  [4, 0],
  [-4, 4],  [0, 4],  [4, 4],
];

function torusCoverChangeCount(discs: Disc[]): number {
  const tolerance = 1.0;
  const used = new Set<number>();
  let matched = 0;
  for (const d of discs) {
    let bestI = -1, bestD = Infinity;
    for (let i = 0; i < INITIAL_TORUS_H1.length; i++) {
      if (used.has(i)) continue;
      const dx = d.cx - INITIAL_TORUS_H1[i][0];
      const dy = d.cy - INITIAL_TORUS_H1[i][1];
      const dist = Math.hypot(dx, dy);
      if (dist < bestD) { bestD = dist; bestI = i; }
    }
    if (bestI >= 0 && bestD < tolerance) {
      matched++;
      used.add(bestI);
    }
  }
  return (discs.length - matched) + (INITIAL_TORUS_H1.length - matched);
}

export const equivalentTorusCover: Predicate = ({ discs, nerve }) => {
  if (torusCoverChangeCount(discs) < 3) return false;
  const h0 = cohomology(nerve, 0);
  const h1 = cohomology(nerve, 1);
  const h2 = cohomology(nerve, 2);
  const torsionFree = (t: number[]) => t.length === 0;
  return h0.rank === 1 && torsionFree(h0.torsion)
    && h1.rank === 2 && torsionFree(h1.torsion)
    && h2.rank === 1 && torsionFree(h2.torsion);
};

export const isGoodCover: Predicate = ({ discs }) => {
  if (discs.length === 0) return false;
  if (!coverComplete(discs, "torus")) return false;
  for (let i = 0; i < discs.length; i++) {
    for (let j = i + 1; j < discs.length; j++) {
      if (pairComponentCount("torus", discs[i], discs[j]) > 1) return false;
    }
  }
  for (let i = 0; i < discs.length; i++) {
    for (let j = i + 1; j < discs.length; j++) {
      for (let k = j + 1; k < discs.length; k++) {
        if (tripleComponentCount("torus", discs[i], discs[j], discs[k]) > 1) return false;
      }
    }
  }
  return true;
};

export const addedDifferentCoboundary: Predicate = ({ nerve, cochainValues }) => {
  const shadow = applyCoboundary(cochainValues, nerve, 0);
  if (shadow.size === 0) return false;
  const v01 = shadow.get("0,1") ?? 0;
  const v02 = shadow.get("0,2") ?? 0;
  const v12 = shadow.get("1,2") ?? 0;
  if (v01 === 0 && v02 === 1 && v12 === 1) return false;
  const coords = classCoordinates(cochainValues, nerve, 1);
  return coords !== null && coords.length === 1 && coords[0] === 1;
};
