import { useMemo } from "react";
import { useStore } from "./store";
import { buildNerve } from "../math/nerve";
import { connectedComponents } from "../math/components";
import { classCoordinates, cohomology, isCoboundary } from "../math/cohomology";
import { faces } from "../math/coboundary";
import { cup } from "../math/cup";
import { coverComplete, pairComponentCount, tripleComponentCount, } from "../math/intersection";
import { simplexKey } from "./types";
import { ZRing, makeRing } from "../math/ring";
import { ALL_FEATURES } from "../tutorial/types";
import { CHAPTERS, cumulativeUnlocks } from "../tutorial/chapters";
export function useCoverStatus() {
    const discs = useStore((s) => s.discs);
    const space = useStore((s) => s.space);
    return useMemo(() => {
        if (discs.length === 0)
            return { state: "empty" };
        if (!coverComplete(discs, space))
            return { state: "incomplete" };
        for (let i = 0; i < discs.length; i++) {
            for (let j = i + 1; j < discs.length; j++) {
                const n = pairComponentCount(space, discs[i], discs[j]);
                if (n > 1)
                    return { state: "bad", witness: [i, j], components: n };
            }
        }
        for (let i = 0; i < discs.length; i++) {
            for (let j = i + 1; j < discs.length; j++) {
                for (let k = j + 1; k < discs.length; k++) {
                    const n = tripleComponentCount(space, discs[i], discs[j], discs[k]);
                    if (n > 1)
                        return { state: "bad", witness: [i, j, k], components: n };
                }
            }
        }
        return { state: "good" };
    }, [discs, space]);
}
export function useNerve() {
    const discs = useStore((s) => s.discs);
    const space = useStore((s) => s.space);
    return useMemo(() => buildNerve(discs, 3, { space }), [discs, space]);
}
export function useComponents() {
    const nerve = useNerve();
    return useMemo(() => connectedComponents(nerve), [nerve]);
}
export function useCohomology(k) {
    const nerve = useNerve();
    const ring = useRing();
    return useMemo(() => cohomology(nerve, k, ring), [nerve, k, ring]);
}
export function useBasisCochain() {
    const pickedDegree = useStore((s) => s.cupPickedDegree);
    const pickedIndex = useStore((s) => s.cupPickedIndex);
    const basisH = useCohomology(pickedDegree);
    return useMemo(() => {
        const gens = basisH.cocycleBasis.filter((c) => !c.isCoboundary);
        if (gens.length === 0)
            return null;
        const idx = Math.min(pickedIndex, gens.length - 1);
        return gens[idx].cochain;
    }, [basisH, pickedIndex]);
}
export function useCupResult() {
    const nerve = useNerve();
    const ring = useRing();
    const q = useStore((s) => s.cohomologyDegree);
    const currentValues = useStore((s) => s.cochainValues);
    const pickedDegree = useStore((s) => s.cupPickedDegree);
    const pickedIndex = useStore((s) => s.cupPickedIndex);
    const basisOnLeft = useStore((s) => s.cupBasisOnLeft);
    const basisH = useCohomology(pickedDegree);
    return useMemo(() => {
        if (pickedDegree + q > 2)
            return null;
        const gens = basisH.cocycleBasis.filter((c) => !c.isCoboundary);
        if (gens.length === 0)
            return null;
        const idx = Math.min(pickedIndex, gens.length - 1);
        const basis = gens[idx];
        const current = { degree: q, values: currentValues };
        const result = basisOnLeft
            ? cup(basis.cochain, current, nerve, ring)
            : cup(current, basis.cochain, nerve, ring);
        return {
            result,
            leftDegree: basisOnLeft ? pickedDegree : q,
            rightDegree: basisOnLeft ? q : pickedDegree,
        };
    }, [nerve, ring, q, currentValues, pickedDegree, pickedIndex, basisOnLeft, basisH]);
}
export function useDeltaShadow(k) {
    const nerve = useNerve();
    const ring = useRing();
    const cochainValues = useStore((s) => s.cochainValues);
    return useMemo(() => {
        if (k <= 0)
            return new Map();
        return applyCoboundary(cochainValues, nerve, k - 1, ring);
    }, [nerve, ring, cochainValues, k]);
}
export function useIsCoboundary(k) {
    const nerve = useNerve();
    const ring = useRing();
    const cochainValues = useStore((s) => s.cochainValues);
    return useMemo(() => isCoboundary(cochainValues, nerve, k, ring), [nerve, ring, cochainValues, k]);
}
export function useClassCoordinates(k) {
    const nerve = useNerve();
    const ring = useRing();
    const cochainValues = useStore((s) => s.cochainValues);
    return useMemo(() => classCoordinates(cochainValues, nerve, k, ring), [nerve, ring, cochainValues, k]);
}
export function applyCoboundary(values, nerve, k, ring = ZRing) {
    const result = new Map();
    const targets = nerve.byDim[k + 1] ?? [];
    for (const tau of targets) {
        let acc = ring.zero;
        for (const { face, sign } of faces(tau)) {
            const v = values.get(simplexKey(face)) ?? ring.zero;
            acc = ring.add(acc, ring.mul(ring.fromInt(sign), v));
        }
        if (!ring.isZero(acc))
            result.set(simplexKey(tau), acc);
    }
    return result;
}
export function useRing() {
    const spec = useStore((s) => s.ring);
    return useMemo(() => makeRing(spec), [spec]);
}
export function useUnlocked() {
    const mode = useStore((s) => s.tutorialMode);
    const step = useStore((s) => s.tutorialStep);
    return useMemo(() => {
        if (mode === "free")
            return new Set(ALL_FEATURES);
        return cumulativeUnlocks(step);
    }, [mode, step]);
}
export function useGoalReached() {
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
    const cupPickedDegree = useStore((s) => s.cupPickedDegree);
    const space = useStore((s) => s.space);
    const nerve = useNerve();
    const ring = useRing();
    return useMemo(() => {
        if (mode !== "tutorial")
            return false;
        const chap = CHAPTERS[step];
        if (!chap || !chap.goal)
            return true;
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
            cupPickedDegree,
            space,
            ring,
        });
    }, [
        mode, step, discs, nerve, cochainValues, cohomologyDegree,
        selectedSimplex, basisCursor, showArrows, showCupProduct, cupPickedIndex,
        cupPickedDegree, space, ring,
    ]);
}
