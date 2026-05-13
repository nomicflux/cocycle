import type { Cochain, Nerve, SimplexKey } from "../state/types";
import { simplexKey } from "../state/types";

export function cup(a: Cochain, b: Cochain, nerve: Nerve): Cochain {
  const p = a.degree;
  const q = b.degree;
  const out = new Map<SimplexKey, number>();
  for (const tau of nerve.byDim[p + q] ?? []) {
    const front = tau.slice(0, p + 1);
    const back = tau.slice(p);
    const av = a.values.get(simplexKey(front)) ?? 0;
    const bv = b.values.get(simplexKey(back)) ?? 0;
    const prod = av * bv;
    if (prod !== 0) out.set(simplexKey(tau), prod);
  }
  return { degree: p + q, values: out };
}
