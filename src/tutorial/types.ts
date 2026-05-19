import type { Disc, DiscRegion, Nerve, Simplex, SimplexKey, Space } from "../state/types";
import type { Ring, RingElement } from "../math/ring";

export type TutorialMode = "free" | "tutorial";
export type Consent = "pending" | "accepted" | "declined";

export type Feature =
  | "drawing"
  | "nerve-set"
  | "nerve-geom"
  | "cohomology"
  | "orientation-arrows"
  | "cochain-editor"
  | "h1"
  | "h2"
  | "cocycle-basis"
  | "cup-product"
  | "space-selector"
  | "presets"
  | "snapshots"
  | "cover-status"
  | "align"
  | "ring-picker";

export const ALL_FEATURES: Feature[] = [
  "drawing",
  "nerve-set",
  "nerve-geom",
  "cohomology",
  "orientation-arrows",
  "cochain-editor",
  "h1",
  "h2",
  "cocycle-basis",
  "cup-product",
  "space-selector",
  "presets",
  "snapshots",
  "cover-status",
  "align",
  "ring-picker",
];

export type SceneSpec = {
  space?: Space;
  discs: Array<{
    cx: number;
    cy: number;
    r: number;
    color?: string;
    region?: DiscRegion;
  }>;
};

export type PredCtx = {
  discs: Disc[];
  nerve: Nerve;
  cochainValues: Map<SimplexKey, RingElement>;
  cohomologyDegree: 0 | 1 | 2;
  selectedSimplex: Simplex | null;
  basisCursor: number;
  showArrows: boolean;
  showCupProduct: boolean;
  cupPickedIndex: number;
  cupPickedDegree: 0 | 1 | 2;
  space: Space;
  ring: Ring;
};

export type Predicate = (ctx: PredCtx) => boolean;

export type Chapter = {
  id: string;
  title: string;
  prose: string;
  scene?: SceneSpec;
  unlocks: Feature[];
  goal?: Predicate;
  goalHint?: string;
};
