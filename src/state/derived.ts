import { useMemo } from "react";
import { useStore } from "./store";
import { buildNerve } from "../math/nerve";
import { connectedComponents } from "../math/components";
import { cohomology, type CohomologyDim } from "../math/cohomology";
import { faces } from "../math/coboundary";
import { cup } from "../math/cup";
import type { Cochain, Nerve, SimplexKey } from "./types";
import { simplexKey } from "./types";

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
