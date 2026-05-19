export type Space = "planar" | "torus" | "klein" | "projective" | "wedge2";

export type DiscRegion = "left" | "sphere" | "right" | "basepoint";

export type Disc = {
  id: string;
  cx: number;
  cy: number;
  r: number;
  color: string;
  region?: DiscRegion;
};

export type Simplex = number[];

export type SimplexKey = string;

export type Nerve = { byDim: Simplex[][] };

import type { RingElement } from "../math/ring";

export type Cochain = { degree: number; values: Map<SimplexKey, RingElement> };

export const simplexKey = (s: Simplex): SimplexKey => s.join(",");
