import { useMemo } from "react";
import { useStore } from "./store";
import { buildNerve } from "../math/nerve";
import { connectedComponents } from "../math/components";
import { classCoordinates, cohomology, isCoboundary, type CohomologyDim } from "../math/cohomology";
import { faces } from "../math/coboundary";
import { cup } from "../math/cup";
import {
  coverComplete,
  pairComponentCount,
  tripleComponentCount,
} from "../math/intersection";
import type { Cochain, Nerve, SimplexKey } from "./types";
import { simplexKey } from "./types";
import type { Feature } from "../tutorial/types";
import { ALL_FEATURES } from "../tutorial/types";
import { CHAPTERS, cumulativeUnlocks } from "../tutorial/chapters";

export type CoverStatus =
  | { state: "empty" }
  | { state: "incomplete" }
  | { state: "good" }
  | { state: "bad"; witness: number[]; components: number };

export function useCoverStatus(): CoverStatus {
  const discs = useStore((s) => s.discs);
  const space = useStore((s) => s.space);
  return useMemo<CoverStatus>(() => {
    if (discs.length === 0) return { state: "empty" };
    if (!coverComplete(discs, space)) return { state: "incomplete" };
    for (let i = 0; i < discs.length; i++) {
      for (let j = i + 1; j < discs.length; j++) {
        const n = pairComponentCount(space, discs[i], discs[j]);
        if (n > 1) return { state: "bad", witness: [i, j], components: n };
      }
    }
    for (let i = 0; i < discs.length; i++) {
      for (let j = i + 1; j < discs.length; j++) {
        for (let k = j + 1; k < discs.length; k++) {
          const n = tripleComponentCount(space, discs[i], discs[j], discs[k]);
          if (n > 1) return { state: "bad", witness: [i, j, k], components: n };
        }
      }
    }
    return { state: "good" };
  }, [discs, space]);
}

export function useNerve(): Nerve {
  const discs = useStore((s) => s.discs);
  const space = useStore((s) => s.space);
  return useMemo(() => buildNerve(discs, 3, { space }), [discs, space]);
}

export function useComponents(): number[] {
  const nerve = useNerve();
  return useMemo(() => connectedComponents(nerve), [nerve]);
}

export function useCohomology(k: 0 | 1 | 2): CohomologyDim {
  const nerve = useNerve();
  return useMemo(() => cohomology(nerve, k), [nerve, k]);
}

export type CupPreview = {
  result: Cochain;
  leftDegree: number;
  rightDegree: number;
};

export function useBasisCochain(): Cochain | null {
  const pickedDegree = useStore((s) => s.cupPickedDegree);
  const pickedIndex = useStore((s) => s.cupPickedIndex);
  const basisH = useCohomology(pickedDegree);
  return useMemo(() => {
    const gens = basisH.cocycleBasis.filter((c) => !c.isCoboundary);
    if (gens.length === 0) return null;
    const idx = Math.min(pickedIndex, gens.length - 1);
    return gens[idx].cochain;
  }, [basisH, pickedIndex]);
}

export function useCupResult(): CupPreview | null {
  const nerve = useNerve();
  const q = useStore((s) => s.cohomologyDegree);
  const currentValues = useStore((s) => s.cochainValues);
  const pickedDegree = useStore((s) => s.cupPickedDegree);
  const pickedIndex = useStore((s) => s.cupPickedIndex);
  const basisOnLeft = useStore((s) => s.cupBasisOnLeft);
  const basisH = useCohomology(pickedDegree);
  return useMemo(() => {
    if (pickedDegree + q > 2) return null;
    const gens = basisH.cocycleBasis.filter((c) => !c.isCoboundary);
    if (gens.length === 0) return null;
    const idx = Math.min(pickedIndex, gens.length - 1);
    const basis = gens[idx];
    const current: Cochain = { degree: q, values: currentValues };
    const result = basisOnLeft
      ? cup(basis.cochain, current, nerve)
      : cup(current, basis.cochain, nerve);
    return {
      result,
      leftDegree: basisOnLeft ? pickedDegree : q,
      rightDegree: basisOnLeft ? q : pickedDegree,
    };
  }, [nerve, q, currentValues, pickedDegree, pickedIndex, basisOnLeft, basisH]);
}

export function useDeltaShadow(k: number): Map<SimplexKey, number> {
  const nerve = useNerve();
  const cochainValues = useStore((s) => s.cochainValues);
  return useMemo(() => {
    if (k <= 0) return new Map();
    return applyCoboundary(cochainValues, nerve, k - 1);
  }, [nerve, cochainValues, k]);
}

export function useIsCoboundary(k: number): boolean {
  const nerve = useNerve();
  const cochainValues = useStore((s) => s.cochainValues);
  return useMemo(
    () => isCoboundary(cochainValues, nerve, k),
    [nerve, cochainValues, k],
  );
}

export function useClassCoordinates(k: 0 | 1 | 2): number[] | null {
  const nerve = useNerve();
  const cochainValues = useStore((s) => s.cochainValues);
  return useMemo(
    () => classCoordinates(cochainValues, nerve, k),
    [nerve, cochainValues, k],
  );
}

export function applyCoboundary(
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

export function useUnlocked(): Set<Feature> {
  const mode = useStore((s) => s.tutorialMode);
  const step = useStore((s) => s.tutorialStep);
  return useMemo(() => {
    if (mode === "free") return new Set(ALL_FEATURES);
    return cumulativeUnlocks(step);
  }, [mode, step]);
}

export function useGoalReached(): boolean {
  const mode = useStore((s) => s.tutorialMode);
  const step = useStore((s) => s.tutorialStep);
  const discs = useStore((s) => s.discs);
  const cochainValues = useStore((s) => s.cochainValues);
  const cohomologyDegree = useStore((s) => s.cohomologyDegree);
  const selectedSimplex = useStore((s) => s.selectedSimplex);
  const basisCursor = useStore((s) => s.basisCursor);
  const showArrows = useStore((s) => s.showArrows);
  const showCupProduct = useStore((s) => s.showCupProduct);
  const cupPickedIndex = useStore((s) => s.cupPickedIndex);
  const nerve = useNerve();
  return useMemo(() => {
    if (mode !== "tutorial") return false;
    const chap = CHAPTERS[step];
    if (!chap || !chap.goal) return true;
    return chap.goal({
      discs,
      nerve,
      cochainValues,
      cohomologyDegree,
      selectedSimplex,
      basisCursor,
      showArrows,
      showCupProduct,
      cupPickedIndex,
    });
  }, [
    mode, step, discs, nerve, cochainValues, cohomologyDegree,
    selectedSimplex, basisCursor, showArrows, showCupProduct, cupPickedIndex,
  ]);
}
