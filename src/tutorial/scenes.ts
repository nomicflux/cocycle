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
  space: "torus",
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

// Same 3×3 grid as SCENE_TORUS_H1, but on projective space. The antipodal
// boundary identifications make this realize RP²: H¹(Z)=0, H²(Z)=Z/2.
export const SCENE_PROJECTIVE_RP2: SceneSpec = {
  space: "projective",
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

// SCENE_WEDGE2: good cover of S² ∨ S¹ ∨ S¹.
// - 3 left S¹ discs at cx=-4, cy=-4/0/4, r=2.5 (S¹ via cy-period-12 wrap)
// - 3 right S¹ discs mirrored
// - 4 sphere caps: hemispheres (r = π/2) centered at the rotated regular-tet
//   vertices on S². Canvas (cx, cy) = σ⁻¹(vertex) where σ has its south pole
//   at canvas (0, 3) with scale 3. Rotation Rz(45°) aligns the two
//   lower-hemisphere vertices along cx so all 4 canvas positions stay in the
//   viewbox.
// - 1 basepoint at (0, -3).
export const SCENE_WEDGE2: SceneSpec = {
  space: "wedge2",
  discs: [
    { cx: -4, cy: -4, r: 2.5, color: "#fecaca", region: "left" },
    { cx: -4, cy:  0, r: 2.5, color: "#fed7aa", region: "left" },
    { cx: -4, cy:  4, r: 2.5, color: "#fde68a", region: "left" },
    { cx:  4, cy: -4, r: 2.5, color: "#bbf7d0", region: "right" },
    { cx:  4, cy:  0, r: 2.5, color: "#a5f3fc", region: "right" },
    { cx:  4, cy:  4, r: 2.5, color: "#bfdbfe", region: "right" },
    { cx:  0,    cy: 4.553, r: Math.PI / 2, color: "#fbcfe8", region: "sphere" },
    { cx:  5.795, cy: 3,    r: Math.PI / 2, color: "#e9d5ff", region: "sphere" },
    { cx: -5.795, cy: 3,    r: Math.PI / 2, color: "#d9f99d", region: "sphere" },
    { cx:  0,    cy: 1.447, r: Math.PI / 2, color: "#c7d2fe", region: "sphere" },
    { cx:  0, cy: -3, r: 0.5, color: "#1f2937", region: "basepoint" },
  ],
};
