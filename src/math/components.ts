import type { Nerve } from "../state/types";

export function connectedComponents(nerve: Nerve): number[] {
  const n = nerve.byDim[0]?.length ?? 0;
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a: number, b: number): void => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  for (const edge of nerve.byDim[1] ?? []) union(edge[0], edge[1]);
  const ids = new Map<number, number>();
  const result: number[] = [];
  for (let i = 0; i < n; i++) {
    const r = find(i);
    if (!ids.has(r)) ids.set(r, ids.size);
    result.push(ids.get(r)!);
  }
  return result;
}
