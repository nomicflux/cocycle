import type { Cochain, Nerve, SimplexKey } from "../state/types";
import { simplexKey } from "../state/types";
import type { Ring, RingElement } from "./ring";
import { ZRing } from "./ring";

export function cup(a: Cochain, b: Cochain, nerve: Nerve, ring: Ring = ZRing): Cochain {
  const p = a.degree;
  const q = b.degree;
  const out = new Map<SimplexKey, RingElement>();
  for (const tau of nerve.byDim[p + q] ?? []) {
    const front = tau.slice(0, p + 1);
    const back = tau.slice(p);
    const av = a.values.get(simplexKey(front)) ?? ring.zero;
    const bv = b.values.get(simplexKey(back)) ?? ring.zero;
    const prod = ring.mul(av, bv);
    if (!ring.isZero(prod)) out.set(simplexKey(tau), prod);
  }
  return { degree: p + q, values: out };
}
