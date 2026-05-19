import type { Disc, Space } from "../state/types";
import { pairIntersects, pointInDisc, spaceTranslates, tripleIntersects } from "../math/intersection";
import { deckApplyDisc, deckElements } from "../math/deck";

function sampleCircle(d: Disc, n: number): Array<[number, number]> {
  const points: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * 2 * Math.PI;
    points.push([d.cx + d.r * Math.cos(t), d.cy + d.r * Math.sin(t)]);
  }
  return points;
}

function inAllOthers(simDiscs: Disc[], skip: number, p: [number, number]): boolean {
  for (let j = 0; j < simDiscs.length; j++) {
    if (j === skip) continue;
    if (!pointInDisc(p[0], p[1], simDiscs[j])) return false;
  }
  return true;
}

function sortByAngle(points: Array<[number, number]>): Array<[number, number]> {
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  return [...points].sort(
    (a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx),
  );
}

export function intersectionPolygon(simDiscs: Disc[]): Array<[number, number]> {
  if (simDiscs.length === 0) return [];
  if (simDiscs.length === 1) return sampleCircle(simDiscs[0], 60);
  const collected: Array<[number, number]> = [];
  simDiscs.forEach((d, i) => {
    for (const p of sampleCircle(d, 80)) {
      if (inAllOthers(simDiscs, i, p)) collected.push(p);
    }
  });
  if (collected.length === 0) return [];
  return sortByAngle(collected);
}

export function intersectionCentroid(simDiscs: Disc[]): [number, number] | null {
  const poly = intersectionPolygon(simDiscs);
  if (poly.length === 0) return null;
  const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length;
  const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
  return [cx, cy];
}

function cartesian<T>(arrs: T[][]): T[][] {
  if (arrs.length === 0) return [[]];
  const rest = cartesian(arrs.slice(1));
  const out: T[][] = [];
  for (const v of arrs[0]) {
    for (const r of rest) out.push([v, ...r]);
  }
  return out;
}

// Helly in R² for discs: k ≥ 3 convex sets have a common point iff every 3 do.
function planarConvexNonEmpty(discs: Disc[]): boolean {
  if (discs.length === 0) return false;
  if (discs.length === 1) return true;
  if (discs.length === 2) return pairIntersects(discs[0], discs[1]);
  for (let i = 0; i < discs.length; i++) {
    for (let j = i + 1; j < discs.length; j++) {
      for (let k = j + 1; k < discs.length; k++) {
        if (!tripleIntersects(discs[i], discs[j], discs[k])) return false;
      }
    }
  }
  return true;
}

// One polygon per cover-component of (d_1)_X ∩ … ∩ (d_k)_X. Anchor on the
// smallest-radius disc (lifts are pairwise disjoint), enumerate lifts of the
// others, union-find by 2k-disc Helly, and emit a single representative
// polygon per UF component (the first-discovered constituent piece).
// Wedge2 keeps its existing route — its non-deck-group gluing isn't a
// DeckElem action and is left for a follow-up Topology instance.
export function intersectionComponents(
  space: Space,
  simDiscs: Disc[],
): Array<Array<[number, number]>> {
  if (simDiscs.length === 0) return [];
  if (simDiscs.length === 1) return [intersectionPolygon(simDiscs)];
  if (space === "wedge2") {
    const base = simDiscs[0];
    const restTranslates = simDiscs.slice(1).map((d) => spaceTranslates(d, space));
    const out: Array<Array<[number, number]>> = [];
    for (const combo of cartesian(restTranslates)) {
      const poly = intersectionPolygon([base, ...combo]);
      if (poly.length > 2) out.push(poly);
    }
    return out;
  }

  let anchorIdx = 0;
  for (let i = 1; i < simDiscs.length; i++) {
    if (simDiscs[i].r < simDiscs[anchorIdx].r) anchorIdx = i;
  }
  const elements = deckElements(space);
  const others: Disc[] = [];
  for (let i = 0; i < simDiscs.length; i++) if (i !== anchorIdx) others.push(simDiscs[i]);
  const pieces: Disc[][] = [];
  const stack: Disc[] = [simDiscs[anchorIdx]];
  const recur = (depth: number): void => {
    if (depth === others.length) {
      pieces.push(stack.slice());
      return;
    }
    for (const g of elements) {
      const lifted = deckApplyDisc(g, others[depth]);
      stack.push(lifted);
      if (planarConvexNonEmpty(stack)) recur(depth + 1);
      stack.pop();
    }
  };
  recur(0);

  const n = pieces.length;
  if (n === 0) return [];
  const parent = Array.from({ length: n }, (_, i) => i);
  const find = (i: number): number =>
    parent[i] === i ? i : (parent[i] = find(parent[i]));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (planarConvexNonEmpty([...pieces[i], ...pieces[j]])) {
        const ri = find(i), rj = find(j);
        if (ri !== rj) parent[ri] = rj;
      }
    }
  }
  const seenRoot = new Set<number>();
  const out: Array<Array<[number, number]>> = [];
  for (let i = 0; i < n; i++) {
    const r = find(i);
    if (seenRoot.has(r)) continue;
    seenRoot.add(r);
    const poly = intersectionPolygon(pieces[i]);
    if (poly.length > 2) out.push(poly);
  }
  return out;
}
