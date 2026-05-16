import type { SceneSpec } from "./types";

export const SCENE_EMPTY: SceneSpec = { discs: [] };

export const SCENE_TWO_NEAR: SceneSpec = {
  discs: [
    { cx: -2.5, cy: 0, r: 1.6, color: "#bbf7d0" },
    { cx: 2.5, cy: 0, r: 1.6, color: "#bfdbfe" },
  ],
};

export const SCENE_THREE_PARTIAL: SceneSpec = {
  discs: [
    { cx: -2.2, cy: -1.2, r: 2.0, color: "#fecaca" },
    { cx: 2.2, cy: -1.2, r: 2.0, color: "#bbf7d0" },
    { cx: 0, cy: 2.4, r: 2.0, color: "#bfdbfe" },
  ],
};

export const SCENE_FOUR_SQUARE: SceneSpec = {
  discs: [
    { cx: -2.2, cy: -2.2, r: 2.0, color: "#fecaca" },
    { cx: 2.2, cy: -2.2, r: 2.0, color: "#bbf7d0" },
    { cx: 2.2, cy: 2.2, r: 2.0, color: "#bfdbfe" },
    { cx: -2.2, cy: 2.2, r: 2.0, color: "#fed7aa" },
  ],
};

export const SCENE_TORUS_RING: SceneSpec = {
  discs: [
    { cx: -4, cy: 0, r: 1.8, color: "#fecaca" },
    { cx: 0, cy: 0, r: 1.8, color: "#bbf7d0" },
    { cx: 4, cy: 0, r: 1.8, color: "#bfdbfe" },
  ],
};

export const SCENE_TORUS_H1: SceneSpec = {
  discs: [
    { cx: -3, cy: -3, r: 2.6, color: "#fecaca" },
    { cx: 3, cy: -3, r: 2.6, color: "#bbf7d0" },
    { cx: 3, cy: 3, r: 2.6, color: "#bfdbfe" },
    { cx: -3, cy: 3, r: 2.6, color: "#fed7aa" },
  ],
};
