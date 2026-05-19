function triangleHole(cx, cy, scale) {
    const r = 1.1 * scale;
    return [
        { cx: cx + 0, cy: cy + 0, r },
        { cx: cx + 2 * scale, cy: cy + 0, r },
        { cx: cx + 1 * scale, cy: cy + Math.sqrt(3) * scale, r },
    ];
}
export const presets = [
    {
        id: "contractible",
        name: "Contractible (one disc)",
        description: "H⁰ = ℤ; everything else trivial.",
        discs: [{ cx: 0, cy: 0, r: 1.5 }],
    },
    {
        id: "two-points",
        name: "Two disjoint discs",
        description: "H⁰ = ℤ²; everything else trivial.",
        discs: [
            { cx: -2.2, cy: 0, r: 1 },
            { cx: 2.2, cy: 0, r: 1 },
        ],
    },
    {
        id: "circle",
        name: "Circle S¹ (three arcs)",
        description: "Three discs pairwise overlapping but missing a common point. H⁰ = ℤ, H¹ = ℤ.",
        discs: triangleHole(-1, -0.9, 1),
    },
    {
        id: "filled-triangle",
        name: "Filled triangle",
        description: "Three discs with full triple overlap → 2-simplex; contractible.",
        discs: [
            { cx: 0, cy: 0, r: 2 },
            { cx: 0.6, cy: 0, r: 2 },
            { cx: 0.3, cy: 0.6, r: 2 },
        ],
    },
    {
        id: "two-circles",
        name: "Two circles (S¹ ⊔ S¹)",
        description: "Two triangle-hole configurations. H⁰ = ℤ², H¹ = ℤ².",
        discs: [...triangleHole(-3.5, -0.9, 0.9), ...triangleHole(1, -0.9, 0.9)],
    },
    {
        id: "torus-t2",
        name: "Torus T² (Möbius 7-disc triangulation)",
        description: "Seven discs at Heawood-embedding positions on the torus, realizing the minimal simplicial T² (V=7, E=21, F=14). H⁰ = ℤ, H¹ = ℤ², H² = ℤ. Toggle Cup product on, click the basis cursor ›/‹ to load an H¹ generator as the current cochain (cyan arrows), pick the other H¹ generator as the basis class (rose arrows). If no violet dots appear, flip 'current ∪ basis' — cup at cochain level is order-dependent. The violet dots in triple-intersection regions are the geometric statement of the H¹ × H¹ → H² pairing on T².",
        discs: [
            { cx: 0, cy: 0, r: 3.2 },
            { cx: 12 / 7, cy: 36 / 7, r: 3.2 },
            { cx: 24 / 7, cy: 72 / 7 - 12, r: 3.2 },
            { cx: 36 / 7, cy: 108 / 7 - 12, r: 3.2 },
            { cx: 48 / 7 - 12, cy: 144 / 7 - 24, r: 3.2 },
            { cx: 60 / 7 - 12, cy: 180 / 7 - 24, r: 3.2 },
            { cx: 72 / 7 - 12, cy: 216 / 7 - 36, r: 3.2 },
        ],
        space: "torus",
    },
    {
        id: "torus-loop",
        name: "Torus loop (wraparound S¹)",
        description: "Four discs evenly spaced; needs torus mode. Wraparound creates a 1-cycle. H⁰ = ℤ, H¹ = ℤ (vs. H¹ = 0 in planar mode).",
        discs: [
            { cx: -4.5, cy: 0, r: 1.6 },
            { cx: -1.5, cy: 0, r: 1.6 },
            { cx: 1.5, cy: 0, r: 1.6 },
            { cx: 4.5, cy: 0, r: 1.6 },
        ],
        space: "torus",
    },
    {
        id: "klein-twist",
        name: "Klein twist test (vertical chain)",
        description: "Four discs at x = 2 along the y-axis. In Torus mode the vertical wrap closes a 1-cycle; in Klein bottle the twisted y-wrap flips x, so the wrap intersection is broken — H¹ drops from ℤ to 0.",
        discs: [
            { cx: 2, cy: -4.5, r: 1.6 },
            { cx: 2, cy: -1.5, r: 1.6 },
            { cx: 2, cy: 1.5, r: 1.6 },
            { cx: 2, cy: 4.5, r: 1.6 },
        ],
        space: "klein",
    },
    {
        id: "rp2-twist",
        name: "Projective twist test (off-axis chain)",
        description: "Four discs at y = 1 across the x-axis. Torus/Klein keep the horizontal wrap and give H¹ = ℤ; in Projective the x-wrap flips y, the wrap intersection is broken — H¹ = 0.",
        discs: [
            { cx: -4.5, cy: 1, r: 1.6 },
            { cx: -1.5, cy: 1, r: 1.6 },
            { cx: 1.5, cy: 1, r: 1.6 },
            { cx: 4.5, cy: 1, r: 1.6 },
        ],
        space: "projective",
    },
];
