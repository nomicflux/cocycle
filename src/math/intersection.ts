import type { Disc } from "../state/types";

const EPS = 1e-9;

export function pointInDisc(x: number, y: number, d: Disc): boolean {
  const dx = x - d.cx;
  const dy = y - d.cy;
  return dx * dx + dy * dy <= d.r * d.r + EPS;
}

export function pairIntersects(a: Disc, b: Disc): boolean {
  const dx = a.cx - b.cx;
  const dy = a.cy - b.cy;
  const sum = a.r + b.r;
  return dx * dx + dy * dy <= sum * sum + EPS;
}

function circlePairPoints(a: Disc, b: Disc): Array<[number, number]> {
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const d2 = dx * dx + dy * dy;
  const d = Math.sqrt(d2);
  if (d < EPS) return [];
  if (d > a.r + b.r + EPS) return [];
  if (d + Math.min(a.r, b.r) < Math.max(a.r, b.r) - EPS) return [];
  const aDist = (d2 + a.r * a.r - b.r * b.r) / (2 * d);
  const hSq = Math.max(0, a.r * a.r - aDist * aDist);
  const h = Math.sqrt(hSq);
  const px = a.cx + (aDist * dx) / d;
  const py = a.cy + (aDist * dy) / d;
  const rx = (-dy * h) / d;
  const ry = (dx * h) / d;
  if (h < EPS) return [[px, py]];
  return [
    [px + rx, py + ry],
    [px - rx, py - ry],
  ];
}

function centerInBoth(target: Disc, a: Disc, b: Disc): boolean {
  return pointInDisc(target.cx, target.cy, a) && pointInDisc(target.cx, target.cy, b);
}

function pairPointInThird(a: Disc, b: Disc, third: Disc): boolean {
  for (const [x, y] of circlePairPoints(a, b)) {
    if (pointInDisc(x, y, third)) return true;
  }
  return false;
}

export function tripleIntersects(a: Disc, b: Disc, c: Disc): boolean {
  if (!pairIntersects(a, b) || !pairIntersects(a, c) || !pairIntersects(b, c)) return false;
  if (centerInBoth(a, b, c)) return true;
  if (centerInBoth(b, a, c)) return true;
  if (centerInBoth(c, a, b)) return true;
  if (pairPointInThird(a, b, c)) return true;
  if (pairPointInThird(a, c, b)) return true;
  if (pairPointInThird(b, c, a)) return true;
  return false;
}

export const TORUS_PERIOD = 12;
const TORUS_SHIFTS = [-TORUS_PERIOD, 0, TORUS_PERIOD] as const;

function translateDisc(d: Disc, dx: number, dy: number): Disc {
  return { ...d, cx: d.cx + dx, cy: d.cy + dy };
}

function discTranslates(d: Disc): Disc[] {
  const out: Disc[] = [];
  for (const dx of TORUS_SHIFTS) {
    for (const dy of TORUS_SHIFTS) {
      out.push(translateDisc(d, dx, dy));
    }
  }
  return out;
}

export function pairIntersectsTorus(a: Disc, b: Disc): boolean {
  return discTranslates(b).some((bt) => pairIntersects(a, bt));
}

export function tripleIntersectsTorus(a: Disc, b: Disc, c: Disc): boolean {
  const bs = discTranslates(b);
  const cs = discTranslates(c);
  for (const bt of bs) {
    for (const ct of cs) {
      if (tripleIntersects(a, bt, ct)) return true;
    }
  }
  return false;
}

function planarQuadNonEmpty(a: Disc, b: Disc, c: Disc, d: Disc): boolean {
  return (
    tripleIntersects(a, b, c) &&
    tripleIntersects(a, b, d) &&
    tripleIntersects(a, c, d) &&
    tripleIntersects(b, c, d)
  );
}

export function quadIntersectsTorus(a: Disc, b: Disc, c: Disc, d: Disc): boolean {
  const bs = discTranslates(b);
  const cs = discTranslates(c);
  const ds = discTranslates(d);
  for (const bt of bs) {
    for (const ct of cs) {
      for (const dt of ds) {
        if (planarQuadNonEmpty(a, bt, ct, dt)) return true;
      }
    }
  }
  return false;
}
