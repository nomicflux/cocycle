import { create } from "zustand";
import type { Disc, Simplex, SimplexKey } from "./types";
import { simplexKey } from "./types";
import { TORUS_PERIOD } from "../math/intersection";

export type Snapshot = { id: string; name: string; discs: Disc[] };

export type CohomologyDegree = 0 | 1 | 2;

let nextDiscNum = 1;
let nextSnapshotNum = 1;
const makeDiscId = (): string => `d${nextDiscNum++}`;
const makeSnapshotId = (): string => `s${nextSnapshotNum++}`;

const PASTELS = [
  "#fecaca", "#fed7aa", "#fde68a", "#bbf7d0",
  "#a5f3fc", "#bfdbfe", "#c7d2fe", "#ddd6fe",
  "#f5d0fe", "#fbcfe8", "#fcd34d", "#86efac",
];
const randomPastel = (): string => PASTELS[Math.floor(Math.random() * PASTELS.length)];

const TORUS_MAX_R = TORUS_PERIOD / 2;
const clampR = (r: number, torus: boolean): number =>
  torus ? Math.min(r, TORUS_MAX_R) : r;
const wrapMod = (x: number, period: number): number => {
  const half = period / 2;
  return ((x + half) % period + period) % period - half;
};

type State = {
  discs: Disc[];
  selectedSimplex: Simplex | null;
  cohomologyDegree: CohomologyDegree;
  cochainValues: Map<SimplexKey, number>;
  snapshots: Snapshot[];
  compareWithSnapshot: string | null;
  basisCursor: number;
  showLabels: boolean;
  showArrows: boolean;
  torusMode: boolean;
};

type Actions = {
  addDisc: (cx: number, cy: number, r: number) => void;
  moveDisc: (id: string, cx: number, cy: number) => void;
  resizeDisc: (id: string, r: number) => void;
  removeDisc: (id: string) => void;
  clearDiscs: () => void;
  loadDiscs: (
    discs: Array<{ cx: number; cy: number; r: number; color?: string }>,
    torusMode?: boolean,
  ) => void;
  selectSimplex: (s: Simplex | null) => void;
  setCohomologyDegree: (d: CohomologyDegree) => void;
  setCochainValue: (s: Simplex, v: number) => void;
  clearCochain: () => void;
  applyCochain: (degree: CohomologyDegree, values: Map<SimplexKey, number>) => void;
  saveSnapshot: (name: string) => void;
  removeSnapshot: (id: string) => void;
  setCompareWith: (id: string | null) => void;
  setBasisCursor: (i: number) => void;
  setShowLabels: (v: boolean) => void;
  setShowArrows: (v: boolean) => void;
  setTorusMode: (v: boolean) => void;
};

export const useStore = create<State & Actions>((set) => ({
  discs: [],
  selectedSimplex: null,
  cohomologyDegree: 1,
  cochainValues: new Map(),
  snapshots: [],
  compareWithSnapshot: null,
  basisCursor: 0,
  showLabels: true,
  showArrows: true,
  torusMode: false,

  addDisc: (cx, cy, r) =>
    set((s) => ({
      discs: [
        ...s.discs,
        { id: makeDiscId(), cx, cy, r: clampR(r, s.torusMode), color: randomPastel() },
      ],
    })),
  moveDisc: (id, cx, cy) =>
    set((s) => ({
      discs: s.discs.map((d) =>
        d.id === id
          ? {
              ...d,
              cx: s.torusMode ? wrapMod(cx, TORUS_PERIOD) : cx,
              cy: s.torusMode ? wrapMod(cy, TORUS_PERIOD) : cy,
            }
          : d,
      ),
    })),
  resizeDisc: (id, r) =>
    set((s) => ({
      discs: s.discs.map((d) =>
        d.id === id ? { ...d, r: clampR(r, s.torusMode) } : d,
      ),
    })),
  removeDisc: (id) =>
    set((s) => ({
      discs: s.discs.filter((d) => d.id !== id),
      selectedSimplex: null,
      cochainValues: new Map(),
    })),
  clearDiscs: () =>
    set({ discs: [], selectedSimplex: null, cochainValues: new Map() }),
  loadDiscs: (discs, torusMode) =>
    set((s) => {
      const t = torusMode ?? s.torusMode;
      return {
        discs: discs.map((d) => ({
          ...d,
          id: makeDiscId(),
          r: clampR(d.r, t),
          color: d.color ?? randomPastel(),
        })),
        torusMode: t,
        selectedSimplex: null,
        cochainValues: new Map(),
        basisCursor: 0,
      };
    }),

  selectSimplex: (s) => set({ selectedSimplex: s }),
  setCohomologyDegree: (d) =>
    set({ cohomologyDegree: d, cochainValues: new Map(), basisCursor: 0 }),
  setCochainValue: (sigma, v) =>
    set((s) => {
      const key = simplexKey(sigma);
      const next = new Map(s.cochainValues);
      if (v === 0) next.delete(key);
      else next.set(key, v);
      return { cochainValues: next };
    }),
  clearCochain: () => set({ cochainValues: new Map() }),
  applyCochain: (degree, values) =>
    set({ cohomologyDegree: degree, cochainValues: new Map(values) }),

  saveSnapshot: (name) =>
    set((s) => ({
      snapshots: [
        ...s.snapshots,
        { id: makeSnapshotId(), name, discs: s.discs.map((d) => ({ ...d })) },
      ],
    })),
  removeSnapshot: (id) =>
    set((s) => ({
      snapshots: s.snapshots.filter((sn) => sn.id !== id),
      compareWithSnapshot: s.compareWithSnapshot === id ? null : s.compareWithSnapshot,
    })),
  setCompareWith: (id) => set({ compareWithSnapshot: id }),
  setBasisCursor: (i) => set({ basisCursor: i }),
  setShowLabels: (v) => set({ showLabels: v }),
  setShowArrows: (v) => set({ showArrows: v }),
  setTorusMode: (v) =>
    set((s) => ({
      torusMode: v,
      selectedSimplex: null,
      cochainValues: new Map(),
      basisCursor: 0,
      discs: v ? s.discs.map((d) => ({ ...d, r: clampR(d.r, true) })) : s.discs,
    })),
}));
