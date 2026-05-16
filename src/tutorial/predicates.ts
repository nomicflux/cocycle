import type { Predicate } from "./types";
import type { Nerve, SimplexKey } from "../state/types";
import { simplexKey } from "../state/types";
import { faces } from "../math/coboundary";

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
