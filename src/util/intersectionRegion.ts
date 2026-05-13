import type { Disc } from "../state/types";
import { pointInDisc } from "../math/intersection";

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
