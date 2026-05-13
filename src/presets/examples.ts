type PresetDisc = { cx: number; cy: number; r: number };

export type Preset = {
  id: string;
  name: string;
  description: string;
  discs: PresetDisc[];
};

function triangleHole(cx: number, cy: number, scale: number): PresetDisc[] {
  const r = 1.1 * scale;
  return [
    { cx: cx + 0, cy: cy + 0, r },
    { cx: cx + 2 * scale, cy: cy + 0, r },
    { cx: cx + 1 * scale, cy: cy + Math.sqrt(3) * scale, r },
  ];
}

export const presets: Preset[] = [
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
];
