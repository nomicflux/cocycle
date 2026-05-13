import type { Disc, Nerve, Simplex } from "../state/types";
import { simplexKey } from "../state/types";
import { pairIntersects, tripleIntersects } from "./intersection";

function enumerateEdges(discs: Disc[]): Simplex[] {
  const edges: Simplex[] = [];
  for (let i = 0; i < discs.length; i++) {
    for (let j = i + 1; j < discs.length; j++) {
      if (pairIntersects(discs[i], discs[j])) edges.push([i, j]);
    }
  }
  return edges;
}

function enumerateTriangles(discs: Disc[], edgeSet: Set<string>): Simplex[] {
  const triangles: Simplex[] = [];
  const n = discs.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (!edgeSet.has(`${i},${j}`)) continue;
      for (let k = j + 1; k < n; k++) {
        if (!edgeSet.has(`${i},${k}`) || !edgeSet.has(`${j},${k}`)) continue;
        if (tripleIntersects(discs[i], discs[j], discs[k])) triangles.push([i, j, k]);
      }
    }
  }
  return triangles;
}

function enumerateTetrahedra(n: number, triangleSet: Set<string>): Simplex[] {
  const tetra: Simplex[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        if (!triangleSet.has(`${i},${j},${k}`)) continue;
        for (let l = k + 1; l < n; l++) {
          if (
            triangleSet.has(`${i},${j},${l}`) &&
            triangleSet.has(`${i},${k},${l}`) &&
            triangleSet.has(`${j},${k},${l}`)
          ) {
            tetra.push([i, j, k, l]);
          }
        }
      }
    }
  }
  return tetra;
}

export function buildNerve(discs: Disc[], maxDim: number = 3): Nerve {
  const n = discs.length;
  const byDim: Simplex[][] = [];
  byDim.push(Array.from({ length: n }, (_, i) => [i]));
  if (maxDim < 1) return { byDim };
  const edges = enumerateEdges(discs);
  byDim.push(edges);
  if (maxDim < 2) return { byDim };
  const edgeSet = new Set(edges.map(simplexKey));
  const triangles = enumerateTriangles(discs, edgeSet);
  byDim.push(triangles);
  if (maxDim < 3) return { byDim };
  const triangleSet = new Set(triangles.map(simplexKey));
  byDim.push(enumerateTetrahedra(n, triangleSet));
  return { byDim };
}
