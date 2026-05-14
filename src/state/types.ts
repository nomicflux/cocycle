export type Space = "planar" | "torus" | "klein" | "projective";
export type Disc = { id: string; cx: number; cy: number; r: number; color: string };

export type Simplex = number[];

export type SimplexKey = string;

export type Nerve = { byDim: Simplex[][] };

export type Cochain = { degree: number; values: Map<SimplexKey, number> };

export const simplexKey = (s: Simplex): SimplexKey => s.join(",");
