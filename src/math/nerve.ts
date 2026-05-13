import type { Disc, Nerve, Simplex } from "../state/types";
import { simplexKey } from "../state/types";
import {
  pairIntersects,
  tripleIntersects,
  pairIntersectsTorus,
  tripleIntersectsTorus,
  quadIntersectsTorus,
} from "./intersection";

type PairFn = (a: Disc, b: Disc) => boolean;
type TripleFn = (a: Disc, b: Disc, c: Disc) => boolean;

function enumerateEdges(discs: Disc[], pair: PairFn): Simplex[] {
  const edges: Simplex[] = [];
  for (let i = 0; i < discs.length; i++) {
    for (let j = i + 1; j < discs.length; j++) {
      if (pair(discs[i], discs[j])) edges.push([i, j]);
    }
  }
  return edges;
}

function enumerateTriangles(
  discs: Disc[],
  edgeSet: Set<string>,
  triple: TripleFn,
): Simplex[] {
  const triangles: Simplex[] = [];
  const n = discs.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (!edgeSet.has(`${i},${j}`)) continue;
      for (let k = j + 1; k < n; k++) {
        if (!edgeSet.has(`${i},${k}`) || !edgeSet.has(`${j},${k}`)) continue;
        if (triple(discs[i], discs[j], discs[k])) triangles.push([i, j, k]);
      }
    }
  }
  return triangles;
}

function allTriangleFaces(
  triangleSet: Set<string>,
  i: number,
  j: number,
  k: number,
  l: number,
): boolean {
  return (
    triangleSet.has(`${i},${j},${k}`) &&
    triangleSet.has(`${i},${j},${l}`) &&
    triangleSet.has(`${i},${k},${l}`) &&
    triangleSet.has(`${j},${k},${l}`)
  );
}

function enumerateTetrahedraPlanar(triangleSet: Set<string>, n: number): Simplex[] {
  const tetra: Simplex[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        for (let l = k + 1; l < n; l++) {
          if (allTriangleFaces(triangleSet, i, j, k, l)) tetra.push([i, j, k, l]);
        }
      }
    }
  }
  return tetra;
}

function enumerateTetrahedraTorus(discs: Disc[], triangleSet: Set<string>): Simplex[] {
  const tetra: Simplex[] = [];
  const n = discs.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        for (let l = k + 1; l < n; l++) {
          if (!allTriangleFaces(triangleSet, i, j, k, l)) continue;
          if (quadIntersectsTorus(discs[i], discs[j], discs[k], discs[l])) {
            tetra.push([i, j, k, l]);
          }
        }
      }
    }
  }
  return tetra;
}

export function buildNerve(
  discs: Disc[],
  maxDim: number = 3,
  opts?: { torus?: boolean },
): Nerve {
  const torus = opts?.torus ?? false;
  const pair = torus ? pairIntersectsTorus : pairIntersects;
  const triple = torus ? tripleIntersectsTorus : tripleIntersects;
  const n = discs.length;
  const byDim: Simplex[][] = [];
  byDim.push(Array.from({ length: n }, (_, i) => [i]));
  if (maxDim < 1) return { byDim };
  const edges = enumerateEdges(discs, pair);
  byDim.push(edges);
  if (maxDim < 2) return { byDim };
  const edgeSet = new Set(edges.map(simplexKey));
  const triangles = enumerateTriangles(discs, edgeSet, triple);
  byDim.push(triangles);
  if (maxDim < 3) return { byDim };
  const triangleSet = new Set(triangles.map(simplexKey));
  byDim.push(
    torus
      ? enumerateTetrahedraTorus(discs, triangleSet)
      : enumerateTetrahedraPlanar(triangleSet, n),
  );
  return { byDim };
}
