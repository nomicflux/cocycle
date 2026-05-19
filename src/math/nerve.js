import { simplexKey } from "../state/types";
import { pairIntersects, tripleIntersects, pairIntersectsOn, tripleIntersectsOn, quadIntersectsOn, } from "./intersection";
function enumerateEdges(discs, pair) {
    const edges = [];
    for (let i = 0; i < discs.length; i++) {
        for (let j = i + 1; j < discs.length; j++) {
            if (pair(discs[i], discs[j]))
                edges.push([i, j]);
        }
    }
    return edges;
}
function enumerateTriangles(discs, edgeSet, triple) {
    const triangles = [];
    const n = discs.length;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (!edgeSet.has(`${i},${j}`))
                continue;
            for (let k = j + 1; k < n; k++) {
                if (!edgeSet.has(`${i},${k}`) || !edgeSet.has(`${j},${k}`))
                    continue;
                if (triple(discs[i], discs[j], discs[k]))
                    triangles.push([i, j, k]);
            }
        }
    }
    return triangles;
}
function allTriangleFaces(triangleSet, i, j, k, l) {
    return (triangleSet.has(`${i},${j},${k}`) &&
        triangleSet.has(`${i},${j},${l}`) &&
        triangleSet.has(`${i},${k},${l}`) &&
        triangleSet.has(`${j},${k},${l}`));
}
function enumerateTetrahedraPlanar(triangleSet, n) {
    const tetra = [];
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            for (let k = j + 1; k < n; k++) {
                for (let l = k + 1; l < n; l++) {
                    if (allTriangleFaces(triangleSet, i, j, k, l))
                        tetra.push([i, j, k, l]);
                }
            }
        }
    }
    return tetra;
}
function enumerateTetrahedraGeneric(discs, triangleSet, space) {
    const tetra = [];
    const n = discs.length;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            for (let k = j + 1; k < n; k++) {
                for (let l = k + 1; l < n; l++) {
                    if (!allTriangleFaces(triangleSet, i, j, k, l))
                        continue;
                    if (quadIntersectsOn(space, discs[i], discs[j], discs[k], discs[l])) {
                        tetra.push([i, j, k, l]);
                    }
                }
            }
        }
    }
    return tetra;
}
export function buildNerve(discs, maxDim = 3, opts) {
    const space = opts?.space ?? "planar";
    const pair = space === "planar" ? pairIntersects : (a, b) => pairIntersectsOn(space, a, b);
    const triple = space === "planar"
        ? tripleIntersects
        : (a, b, c) => tripleIntersectsOn(space, a, b, c);
    const n = discs.length;
    const byDim = [];
    byDim.push(Array.from({ length: n }, (_, i) => [i]));
    if (maxDim < 1)
        return { byDim };
    const edges = enumerateEdges(discs, pair);
    byDim.push(edges);
    if (maxDim < 2)
        return { byDim };
    const edgeSet = new Set(edges.map(simplexKey));
    const triangles = enumerateTriangles(discs, edgeSet, triple);
    byDim.push(triangles);
    if (maxDim < 3)
        return { byDim };
    const triangleSet = new Set(triangles.map(simplexKey));
    byDim.push(space === "planar"
        ? enumerateTetrahedraPlanar(triangleSet, n)
        : enumerateTetrahedraGeneric(discs, triangleSet, space));
    return { byDim };
}
