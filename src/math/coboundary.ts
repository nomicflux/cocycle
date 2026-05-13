import type { Nerve, Simplex } from "../state/types";
import { simplexKey } from "../state/types";

export type FaceWithSign = { face: Simplex; sign: number };

export function faces(tau: Simplex): FaceWithSign[] {
  return tau.map((_, j) => ({
    face: tau.slice(0, j).concat(tau.slice(j + 1)),
    sign: j % 2 === 0 ? 1 : -1,
  }));
}

// Cofaces of σ within the nerve at dimension dim(σ)+1, each with the sign that
// shows up in (δc)(τ) attached to c(σ). The sign is (-1)^j where j is the
// position at which σ's missing vertex sits in τ.
export function cofacesInNerve(sigma: Simplex, nerve: Nerve): FaceWithSign[] {
  const higher = nerve.byDim[sigma.length] ?? [];
  const sigmaSet = new Set(sigma);
  const result: FaceWithSign[] = [];
  for (const tau of higher) {
    let missingIdx = -1;
    let containsAll = true;
    for (let i = 0; i < tau.length; i++) {
      if (!sigmaSet.has(tau[i])) {
        if (missingIdx !== -1) { containsAll = false; break; }
        missingIdx = i;
      }
    }
    if (containsAll && missingIdx !== -1) {
      result.push({ face: tau, sign: missingIdx % 2 === 0 ? 1 : -1 });
    }
  }
  return result;
}

// δ^k as an integer matrix. Rows index (k+1)-simplices (in order of nerve.byDim[k+1]),
// columns index k-simplices. Entry (τ, σ) = (-1)^j if σ = τ minus its j-th vertex.
export function coboundaryMatrix(nerve: Nerve, k: number): number[][] {
  const sources = nerve.byDim[k] ?? [];
  const targets = nerve.byDim[k + 1] ?? [];
  const sourceIndex = new Map<string, number>();
  sources.forEach((s, i) => sourceIndex.set(simplexKey(s), i));
  return targets.map((tau) => {
    const row = new Array(sources.length).fill(0);
    for (const { face, sign } of faces(tau)) {
      const col = sourceIndex.get(simplexKey(face));
      if (col !== undefined) row[col] = sign;
    }
    return row;
  });
}
