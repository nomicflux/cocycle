import type { Disc, Space } from "../state/types";

// ============================================================================
// DeckElem: affine map (x, y) → (sx·x + tx, sy·y + ty) with sx, sy ∈ {±1}.
// ============================================================================
//
// This represents the four-class affine action used by torus / klein / projective
// quotients of R². Composition law:
//
//   (g1 ∘ g2)(x, y) = g1(sx2·x + tx2, sy2·y + ty2)
//                   = (sx1·sx2·x + sx1·tx2 + tx1,
//                      sy1·sy2·y + sy1·ty2 + ty1).
//
// Inverse: x' = sx·x + tx ⟹ x = sx·(x' − tx) = sx·x' − sx·tx, so
//   g⁻¹ = (sx, sy, −sx·tx, −sy·ty).

export type Sign = 1 | -1;

export type DeckElem = {
  sx: Sign;
  sy: Sign;
  tx: number;
  ty: number;
};

export const DECK_ID: DeckElem = { sx: 1, sy: 1, tx: 0, ty: 0 };

export function deckCompose(g1: DeckElem, g2: DeckElem): DeckElem {
  return {
    sx: (g1.sx * g2.sx) as Sign,
    sy: (g1.sy * g2.sy) as Sign,
    tx: g1.sx * g2.tx + g1.tx,
    ty: g1.sy * g2.ty + g1.ty,
  };
}

export function deckInverse(g: DeckElem): DeckElem {
  return { sx: g.sx, sy: g.sy, tx: -g.sx * g.tx, ty: -g.sy * g.ty };
}

export function deckApplyDisc(g: DeckElem, d: Disc): Disc {
  const out: Disc = {
    id: d.id,
    cx: g.sx * d.cx + g.tx,
    cy: g.sy * d.cy + g.ty,
    r: d.r,
    color: d.color,
  };
  if (d.region !== undefined) out.region = d.region;
  return out;
}

export function deckEq(a: DeckElem, b: DeckElem): boolean {
  return a.sx === b.sx && a.sy === b.sy &&
    Math.abs(a.tx - b.tx) < 1e-6 && Math.abs(a.ty - b.ty) < 1e-6;
}

export function deckKey(g: DeckElem): string {
  return `${g.sx},${g.sy},${Math.round(g.tx * 1e6)},${Math.round(g.ty * 1e6)}`;
}

// ============================================================================
// Enumeration windows for each deck-group quotient.
// ============================================================================
//
// torus:      Γ = ⟨T_(P,0), T_(0,P)⟩, abelian.
// klein:      Γ = ⟨α = T_(P,0),  β: (x,y)↦(−x, y+P)⟩, with β² = T_(0, 2P).
// projective: Γ = ⟨ε₁: (x,y)↦(x+P, −y),  ε₂: (x,y)↦(−x, y+P)⟩,
//             with ε₁² = T_(2P, 0), ε₂² = T_(0, 2P).
//
// For component-counting we need a finite set of deck elements that covers
// every lift within reach of a disc of bounded radius placed inside the
// fundamental polygon [−P/2, P/2]². The window {sx,sy} × {translation by
// k·2P in each axis, k ∈ {−1,0,1}} suffices for the radii used in the app
// (≤ TORUS_PERIOD) — and is the same window the previous heuristic used.

export const TORUS_PERIOD = 12;

function torusDeckElements(): DeckElem[] {
  const out: DeckElem[] = [];
  const P = TORUS_PERIOD;
  for (const i of [-1, 0, 1]) {
    for (const j of [-1, 0, 1]) {
      out.push({ sx: 1, sy: 1, tx: i * P, ty: j * P });
    }
  }
  return out;
}

const KLEIN_COSET_REPS: DeckElem[] = [
  { sx: 1, sy: 1, tx: 0, ty: 0 },               // e
  { sx: 1, sy: 1, tx: TORUS_PERIOD, ty: 0 },    // α = T_(P,0)
  { sx: -1, sy: 1, tx: 0, ty: TORUS_PERIOD },   // β: (x,y)↦(−x, y+P)
  { sx: -1, sy: 1, tx: TORUS_PERIOD, ty: TORUS_PERIOD }, // αβ
];

const PROJECTIVE_COSET_REPS: DeckElem[] = [
  { sx: 1, sy: 1, tx: 0, ty: 0 },                          // e
  { sx: 1, sy: -1, tx: TORUS_PERIOD, ty: 0 },              // ε₁: (x,y)↦(x+P, −y)
  { sx: -1, sy: 1, tx: 0, ty: TORUS_PERIOD },              // ε₂: (x,y)↦(−x, y+P)
  { sx: -1, sy: -1, tx: TORUS_PERIOD, ty: -TORUS_PERIOD }, // ε₁ε₂
];

function twistedDeckElements(cosets: DeckElem[]): DeckElem[] {
  const out: DeckElem[] = [];
  const L = 2 * TORUS_PERIOD;
  for (const c of cosets) {
    for (const dx of [-L, 0, L]) {
      for (const dy of [-L, 0, L]) {
        out.push({ sx: c.sx, sy: c.sy, tx: c.tx + dx, ty: c.ty + dy });
      }
    }
  }
  return out;
}

export function deckElements(space: Space): DeckElem[] {
  switch (space) {
    case "planar": return [DECK_ID];
    case "torus": return torusDeckElements();
    case "klein": return twistedDeckElements(KLEIN_COSET_REPS);
    case "projective": return twistedDeckElements(PROJECTIVE_COSET_REPS);
    case "wedge2":
      throw new Error("wedge2 has no deck group; use the wedge2 Topology instance");
  }
}
