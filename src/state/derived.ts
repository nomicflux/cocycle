import { useMemo } from "react";
import { useStore } from "./store";
import { buildNerve } from "../math/nerve";
import { connectedComponents } from "../math/components";
import { cohomology, type CohomologyDim } from "../math/cohomology";
import { faces } from "../math/coboundary";
import type { Nerve, SimplexKey } from "./types";
import { simplexKey } from "./types";

export function useNerve(): Nerve {
  const discs = useStore((s) => s.discs);
  return useMemo(() => buildNerve(discs), [discs]);
}

export function useComponents(): number[] {
  const nerve = useNerve();
  return useMemo(() => connectedComponents(nerve), [nerve]);
}

export function useCohomology(k: 0 | 1 | 2): CohomologyDim {
  const nerve = useNerve();
  return useMemo(() => cohomology(nerve, k), [nerve, k]);
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
