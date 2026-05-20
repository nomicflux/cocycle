import type { Predicate, PredCtx } from "./types";
import type { Cochain, Disc, SimplexKey } from "../state/types";
import type { Ring } from "../math/ring";
import { classCoordinates, cohomology, isCoboundary } from "../math/cohomology";
import { cup } from "../math/cup";
import { applyCoboundary } from "../state/derived";
import { coverComplete, pairComponentCount, tripleComponentCount } from "../math/intersection";

const keyDim = (k: SimplexKey): number => k.split(",").length - 1;

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
  ring,
}) => {
  if (cohomologyDegree !== 0) return false;
  for (const [key, v] of cochainValues) {
    if (!ring.isZero(v) && keyDim(key) === 0) return true;
  }
  return false;
};

export const sawDelta: Predicate = ({
  cochainValues,
  nerve,
  cohomologyDegree,
  ring,
}) => {
  if (cohomologyDegree !== 0) return false;
  let nonzeroVertex = false;
  for (const [key, v] of cochainValues) {
    if (!ring.isZero(v) && keyDim(key) === 0) {
      nonzeroVertex = true;
      break;
    }
  }
  if (!nonzeroVertex) return false;
  return applyCoboundary(cochainValues, nerve, 0, ring).size > 0;
};

export const hasH1Cocycle: Predicate = ({
  nerve,
  cochainValues,
  ring,
}) => {
  let nonzero = false;
  for (const [key, v] of cochainValues) {
    if (!ring.isZero(v) && keyDim(key) === 1) {
      nonzero = true;
      break;
    }
  }
  if (!nonzero) return false;
  return applyCoboundary(cochainValues, nerve, 1, ring).size === 0;
};

export const hasNonCocycle: Predicate = ({
  nerve,
  cochainValues,
  ring,
}) => applyCoboundary(cochainValues, nerve, 1, ring).size > 0;

export const onH1Tab: Predicate = ({ cohomologyDegree }) =>
  cohomologyDegree === 1;

export const visitedSecondBasis: Predicate = ({ basisCursor }) =>
  basisCursor >= 1;

const cochainIsNonzero = (c: Cochain, ring: Ring): boolean =>
  [...c.values.values()].some((v) => !ring.isZero(v));

// Cup A ⌣ B when both stored factors are nonzero degree-1 cocycles
// (i.e. genuine H¹ classes); null when they are not a valid H¹⌣H¹ pair.
function cupOfH1Classes(ctx: PredCtx): Cochain | null {
  const { cupA, cupB, nerve, ring } = ctx;
  if (!cupA || !cupB) return null;
  if (cupA.degree !== 1 || cupB.degree !== 1) return null;
  if (!cochainIsNonzero(cupA, ring) || !cochainIsNonzero(cupB, ring)) return null;
  if (applyCoboundary(cupA.values, nerve, 1, ring).size > 0) return null;
  if (applyCoboundary(cupB.values, nerve, 1, ring).size > 0) return null;
  return cup(cupA, cupB, nerve, ring);
}

export const usedCupProduct: Predicate = (ctx) => {
  const res = cupOfH1Classes(ctx);
  return res !== null && !isCoboundary(res.values, ctx.nerve, 2, ctx.ring);
};

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

export const equivalentTorusCover: Predicate = ({ discs, nerve, ring }) => {
  if (torusCoverChangeCount(discs) < 1) return false;
  const h0 = cohomology(nerve, 0, ring);
  const h1 = cohomology(nerve, 1, ring);
  const h2 = cohomology(nerve, 2, ring);
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

export const sawCupVanishOnWedge: Predicate = (ctx) => {
  if (ctx.space !== "wedge2") return false;
  const res = cupOfH1Classes(ctx);
  return res !== null && isCoboundary(res.values, ctx.nerve, 2, ctx.ring);
};

export const ringIsZ2: Predicate = ({ ring }) =>
  ring.spec.kind === "Zp" && ring.spec.p === 2;

export const sawCupSquareOnRP2: Predicate = (ctx) => {
  const { space, ring } = ctx;
  if (space !== "projective") return false;
  if (ring.spec.kind !== "Zp" || ring.spec.p !== 2) return false;
  const res = cupOfH1Classes(ctx);
  return res !== null && !isCoboundary(res.values, ctx.nerve, 2, ring);
};

export const addedDifferentCoboundary: Predicate = ({ nerve, cochainValues, ring }) => {
  const shadow = applyCoboundary(cochainValues, nerve, 0, ring);
  if (shadow.size === 0) return false;
  const v01 = shadow.get("0,1");
  const v02 = shadow.get("0,2");
  const v12 = shadow.get("1,2");
  const is01Zero = v01 === undefined || ring.isZero(v01);
  const is02One = v02 !== undefined && ring.eq(v02, ring.one);
  const is12One = v12 !== undefined && ring.eq(v12, ring.one);
  if (is01Zero && is02One && is12One) return false;
  const coords = classCoordinates(cochainValues, nerve, 1, ring);
  return coords !== null && coords.length === 1 && ring.eq(coords[0], ring.one);
};
