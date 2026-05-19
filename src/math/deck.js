export const DECK_ID = { sx: 1, sy: 1, tx: 0, ty: 0 };
export function deckCompose(g1, g2) {
    return {
        sx: (g1.sx * g2.sx),
        sy: (g1.sy * g2.sy),
        tx: g1.sx * g2.tx + g1.tx,
        ty: g1.sy * g2.ty + g1.ty,
    };
}
export function deckInverse(g) {
    return { sx: g.sx, sy: g.sy, tx: -g.sx * g.tx, ty: -g.sy * g.ty };
}
export function deckApplyDisc(g, d) {
    const out = {
        id: d.id,
        cx: g.sx * d.cx + g.tx,
        cy: g.sy * d.cy + g.ty,
        r: d.r,
        color: d.color,
    };
    if (d.region !== undefined)
        out.region = d.region;
    return out;
}
export function deckEq(a, b) {
    return a.sx === b.sx && a.sy === b.sy &&
        Math.abs(a.tx - b.tx) < 1e-6 && Math.abs(a.ty - b.ty) < 1e-6;
}
export function deckKey(g) {
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
function torusDeckElements() {
    const out = [];
    const P = TORUS_PERIOD;
    for (const i of [-1, 0, 1]) {
        for (const j of [-1, 0, 1]) {
            out.push({ sx: 1, sy: 1, tx: i * P, ty: j * P });
        }
    }
    return out;
}
const KLEIN_COSET_REPS = [
    { sx: 1, sy: 1, tx: 0, ty: 0 }, // e
    { sx: 1, sy: 1, tx: TORUS_PERIOD, ty: 0 }, // α = T_(P,0)
    { sx: -1, sy: 1, tx: 0, ty: TORUS_PERIOD }, // β: (x,y)↦(−x, y+P)
    { sx: -1, sy: 1, tx: TORUS_PERIOD, ty: TORUS_PERIOD }, // αβ
];
const PROJECTIVE_COSET_REPS = [
    { sx: 1, sy: 1, tx: 0, ty: 0 }, // e
    { sx: 1, sy: -1, tx: TORUS_PERIOD, ty: 0 }, // ε₁: (x,y)↦(x+P, −y)
    { sx: -1, sy: 1, tx: 0, ty: TORUS_PERIOD }, // ε₂: (x,y)↦(−x, y+P)
    { sx: -1, sy: -1, tx: TORUS_PERIOD, ty: -TORUS_PERIOD }, // ε₁ε₂
];
function twistedDeckElements(cosets) {
    const out = [];
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
export function deckElements(space) {
    switch (space) {
        case "planar": return [DECK_ID];
        case "torus": return torusDeckElements();
        case "klein": return twistedDeckElements(KLEIN_COSET_REPS);
        case "projective": return twistedDeckElements(PROJECTIVE_COSET_REPS);
        case "wedge2":
            throw new Error("wedge2 has no deck group; use the wedge2 Topology instance");
    }
}
