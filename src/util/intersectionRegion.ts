import type { Disc, Space } from "../state/types";
import { pointInDisc, spaceTranslates } from "../math/intersection";

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

export function intersectionComponents(
  space: Space,
  simDiscs: Disc[],
): Array<Array<[number, number]>> {
  if (simDiscs.length === 0) return [];
  if (simDiscs.length === 1) return [intersectionPolygon(simDiscs)];
  const base = simDiscs[0];
  const restTranslates = simDiscs.slice(1).map((d) => spaceTranslates(d, space));
  const out: Array<Array<[number, number]>> = [];
  for (const combo of cartesian(restTranslates)) {
    const poly = intersectionPolygon([base, ...combo]);
    if (poly.length > 2) out.push(poly);
  }
  return out;
}
