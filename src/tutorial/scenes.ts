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

export const SCENE_BAD_COVER: SceneSpec = {
  discs: [
    { cx: -3, cy: -3, r: 4.3, color: "#fecaca" },
    { cx: 3, cy: -3, r: 4.3, color: "#bbf7d0" },
    { cx: -3, cy: 3, r: 4.3, color: "#bfdbfe" },
    { cx: 3, cy: 3, r: 4.3, color: "#fed7aa" },
  ],
};

export const SCENE_CIRCLE_TRIANGLE: SceneSpec = {
  discs: [
    { cx: 0, cy: 1.732, r: 1.6, color: "#fecaca" },
    { cx: 1.5, cy: -0.866, r: 1.6, color: "#bbf7d0" },
    { cx: -1.5, cy: -0.866, r: 1.6, color: "#bfdbfe" },
  ],
};

export const SCENE_TORUS_H1: SceneSpec = {
  discs: [
    { cx: -4, cy: -4, r: 3.2, color: "#fecaca" },
    { cx: 0, cy: -4, r: 3.2, color: "#bbf7d0" },
    { cx: 4, cy: -4, r: 3.2, color: "#bfdbfe" },
    { cx: -4, cy: 0, r: 3.2, color: "#fed7aa" },
    { cx: 0, cy: 0, r: 3.2, color: "#fde68a" },
    { cx: 4, cy: 0, r: 3.2, color: "#e9d5ff" },
    { cx: -4, cy: 4, r: 3.2, color: "#fbcfe8" },
    { cx: 0, cy: 4, r: 3.2, color: "#a5f3fc" },
    { cx: 4, cy: 4, r: 3.2, color: "#d9f99d" },
  ],
};
