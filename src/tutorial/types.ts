import type { Disc, Nerve, Simplex, SimplexKey } from "../state/types";

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
  | "cover-status";

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
];

export type SceneSpec = {
  discs: Array<{ cx: number; cy: number; r: number; color?: string }>;
};

export type PredCtx = {
  discs: Disc[];
  nerve: Nerve;
  cochainValues: Map<SimplexKey, number>;
  cohomologyDegree: 0 | 1 | 2;
  selectedSimplex: Simplex | null;
  basisCursor: number;
  showArrows: boolean;
  showCupProduct: boolean;
  cupPickedIndex: number;
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
