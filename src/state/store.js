import { create } from "zustand";
import { simplexKey } from "./types";
import { makeRing } from "../math/ring";
import { TORUS_PERIOD, normalizePosition } from "../math/intersection";
import { alignDiscsToGoodCover } from "../math/align";
import { loadFromStorage, saveConsent, saveTutorialState, markVisited as markVisitedStorage, } from "../tutorial/persistence";
import { CHAPTERS } from "../tutorial/chapters";
let nextDiscNum = 1;
let nextSnapshotNum = 1;
const makeDiscId = () => `d${nextDiscNum++}`;
const makeSnapshotId = () => `s${nextSnapshotNum++}`;
const PASTELS = [
    "#fecaca", "#fed7aa", "#fde68a", "#bbf7d0",
    "#a5f3fc", "#bfdbfe", "#c7d2fe", "#ddd6fe",
    "#f5d0fe", "#fbcfe8", "#fcd34d", "#86efac",
];
const randomPastel = () => PASTELS[Math.floor(Math.random() * PASTELS.length)];
const MAX_R_QUOTIENT = TORUS_PERIOD / 2;
const clampR = (r, space) => space === "planar" ? r : Math.min(r, MAX_R_QUOTIENT);
const keyDim = (k) => k.split(",").length - 1;
function discsFromScene(scene, space) {
    return scene.discs.map((d) => {
        if (space === "wedge2" && d.region) {
            return {
                id: makeDiscId(),
                cx: d.cx,
                cy: d.cy,
                r: clampR(d.r, space),
                color: d.color ?? randomPastel(),
                region: d.region,
            };
        }
        const norm = normalizePosition(d.cx, d.cy, space);
        return {
            id: makeDiscId(),
            cx: norm.cx,
            cy: norm.cy,
            r: clampR(d.r, space),
            color: d.color ?? randomPastel(),
            region: space === "wedge2" ? norm.region : undefined,
        };
    });
}
const persisted = loadFromStorage();
const initialTutorialMode = persisted.tutorialMode;
const initialTutorialStep = Math.min(Math.max(0, persisted.tutorialStep), CHAPTERS.length - 1);
const initialSceneAtBoot = initialTutorialMode === "tutorial"
    ? CHAPTERS[initialTutorialStep]?.scene
    : undefined;
const initialSpace = initialTutorialMode === "tutorial"
    ? (initialSceneAtBoot?.space ?? "torus")
    : "planar";
const initialDiscs = initialSceneAtBoot
    ? discsFromScene(initialSceneAtBoot, initialSpace)
    : [];
export const useStore = create((set, get) => ({
    discs: initialDiscs,
    selectedSimplex: null,
    cohomologyDegree: initialTutorialMode === "tutorial" ? 0 : 1,
    cochainValues: new Map(),
    ring: { kind: "Z" },
    snapshots: [],
    compareWithSnapshot: null,
    basisCursor: 0,
    showLabels: true,
    showArrows: initialTutorialMode === "tutorial" ? false : true,
    space: initialSpace,
    cupPickedDegree: 0,
    cupPickedIndex: 0,
    cupBasisOnLeft: true,
    showCupProduct: false,
    showEmptyCoverHighlight: false,
    tutorialMode: initialTutorialMode,
    tutorialStep: initialTutorialStep,
    consent: persisted.consent,
    visited: persisted.visited,
    glossaryOpen: false,
    addDisc: (cx, cy, r) => set((s) => {
        const norm = normalizePosition(cx, cy, s.space);
        return {
            discs: [
                ...s.discs,
                {
                    id: makeDiscId(),
                    cx: norm.cx,
                    cy: norm.cy,
                    r: clampR(r, s.space),
                    color: randomPastel(),
                    region: s.space === "wedge2" ? norm.region : undefined,
                },
            ],
        };
    }),
    moveDisc: (id, cx, cy) => set((s) => ({
        discs: s.discs.map((d) => d.id === id ? { ...d, ...normalizePosition(cx, cy, s.space) } : d),
    })),
    resizeDisc: (id, r) => set((s) => ({
        discs: s.discs.map((d) => d.id === id ? { ...d, r: clampR(r, s.space) } : d),
    })),
    removeDisc: (id) => set((s) => ({
        discs: s.discs.filter((d) => d.id !== id),
        selectedSimplex: null,
        cochainValues: new Map(),
    })),
    clearDiscs: () => set({ discs: [], selectedSimplex: null, cochainValues: new Map() }),
    alignDiscs: () => set((s) => ({ discs: alignDiscsToGoodCover(s.discs, s.space) })),
    loadDiscs: (discs, space) => set((s) => {
        const sp = space ?? s.space;
        return {
            discs: discs.map((d) => {
                const norm = normalizePosition(d.cx, d.cy, sp);
                return {
                    id: makeDiscId(),
                    cx: norm.cx,
                    cy: norm.cy,
                    r: clampR(d.r, sp),
                    color: d.color ?? randomPastel(),
                    region: sp === "wedge2" ? norm.region : undefined,
                };
            }),
            space: sp,
            selectedSimplex: null,
            cochainValues: new Map(),
            basisCursor: 0,
        };
    }),
    selectSimplex: (s) => set({ selectedSimplex: s }),
    setCohomologyDegree: (d) => set({ cohomologyDegree: d, basisCursor: 0 }),
    setCochainValue: (sigma, v) => set((s) => {
        const key = simplexKey(sigma);
        const next = new Map(s.cochainValues);
        const ring = makeRing(s.ring);
        if (ring.isZero(v))
            next.delete(key);
        else
            next.set(key, v);
        return { cochainValues: next };
    }),
    clearCochain: () => set((s) => {
        const next = new Map(s.cochainValues);
        for (const key of [...next.keys()]) {
            if (keyDim(key) === s.cohomologyDegree)
                next.delete(key);
        }
        return { cochainValues: next };
    }),
    applyCochain: (degree, values) => set((s) => {
        const next = new Map(s.cochainValues);
        for (const key of [...next.keys()]) {
            if (keyDim(key) === degree)
                next.delete(key);
        }
        for (const [k, v] of values)
            next.set(k, v);
        return { cohomologyDegree: degree, cochainValues: next };
    }),
    saveSnapshot: (name) => set((s) => ({
        snapshots: [
            ...s.snapshots,
            { id: makeSnapshotId(), name, discs: s.discs.map((d) => ({ ...d })) },
        ],
    })),
    removeSnapshot: (id) => set((s) => ({
        snapshots: s.snapshots.filter((sn) => sn.id !== id),
        compareWithSnapshot: s.compareWithSnapshot === id ? null : s.compareWithSnapshot,
    })),
    setCompareWith: (id) => set({ compareWithSnapshot: id }),
    setBasisCursor: (i) => set({ basisCursor: i }),
    setShowLabels: (v) => set({ showLabels: v }),
    setShowArrows: (v) => set({ showArrows: v }),
    setCupPickedDegree: (d) => set({ cupPickedDegree: d, cupPickedIndex: 0 }),
    setCupPickedIndex: (i) => set({ cupPickedIndex: i }),
    setCupBasisOnLeft: (v) => set({ cupBasisOnLeft: v }),
    setShowCupProduct: (v) => set({ showCupProduct: v }),
    setShowEmptyCoverHighlight: (v) => set({ showEmptyCoverHighlight: v }),
    setSpace: (sp) => set((state) => ({
        space: sp,
        selectedSimplex: null,
        cochainValues: new Map(),
        basisCursor: 0,
        discs: state.discs.map((d) => {
            const r = clampR(d.r, sp);
            const norm = normalizePosition(d.cx, d.cy, sp);
            const region = sp === "wedge2" ? norm.region : undefined;
            return { ...d, r, cx: norm.cx, cy: norm.cy, region };
        }),
    })),
    enterTutorial: () => {
        const s = get();
        const step = Math.min(s.tutorialStep, CHAPTERS.length - 1);
        const scene = CHAPTERS[step]?.scene;
        const space = scene?.space ?? "torus";
        saveTutorialState(s.consent, "tutorial", step);
        set({
            tutorialMode: "tutorial",
            tutorialStep: step,
            space,
            selectedSimplex: null,
            cochainValues: new Map(),
            basisCursor: 0,
            cohomologyDegree: 0,
            showCupProduct: false,
            showArrows: false,
            discs: scene ? discsFromScene(scene, space) : s.discs,
        });
    },
    exitTutorial: () => {
        const s = get();
        saveTutorialState(s.consent, "free", s.tutorialStep);
        set({ tutorialMode: "free" });
    },
    nextStep: () => {
        const s = get();
        const last = CHAPTERS.length - 1;
        const newStep = Math.min(s.tutorialStep + 1, last);
        if (newStep === s.tutorialStep)
            return;
        const prevScene = CHAPTERS[s.tutorialStep]?.scene;
        const newScene = CHAPTERS[newStep]?.scene;
        saveTutorialState(s.consent, "tutorial", newStep);
        const update = { tutorialStep: newStep };
        if (newScene && newScene !== prevScene) {
            const newSpace = newScene.space ?? "torus";
            update.space = newSpace;
            update.discs = discsFromScene(newScene, newSpace);
            update.selectedSimplex = null;
            update.cochainValues = new Map();
            update.basisCursor = 0;
        }
        set(update);
    },
    prevStep: () => {
        const s = get();
        const newStep = Math.max(0, s.tutorialStep - 1);
        if (newStep === s.tutorialStep)
            return;
        const prevScene = CHAPTERS[s.tutorialStep]?.scene;
        const newScene = CHAPTERS[newStep]?.scene;
        saveTutorialState(s.consent, "tutorial", newStep);
        const update = { tutorialStep: newStep };
        if (newScene && newScene !== prevScene) {
            const newSpace = newScene.space ?? "torus";
            update.space = newSpace;
            update.discs = discsFromScene(newScene, newSpace);
            update.selectedSimplex = null;
            update.cochainValues = new Map();
            update.basisCursor = 0;
        }
        set(update);
    },
    jumpToStep: (n) => {
        const s = get();
        const step = Math.min(Math.max(0, n), CHAPTERS.length - 1);
        if (step === s.tutorialStep)
            return;
        const scene = CHAPTERS[step]?.scene;
        const newSpace = scene?.space ?? s.space;
        saveTutorialState(s.consent, "tutorial", step);
        set({
            tutorialStep: step,
            space: newSpace,
            discs: scene ? discsFromScene(scene, newSpace) : s.discs,
            selectedSimplex: null,
            cochainValues: new Map(),
            basisCursor: 0,
        });
    },
    setConsent: (c) => {
        saveConsent(c);
        const s = get();
        if (c === "accepted") {
            saveTutorialState(c, s.tutorialMode, s.tutorialStep);
        }
        set({ consent: c });
    },
    markVisited: () => {
        const s = get();
        markVisitedStorage(s.consent);
        set({ visited: true });
    },
    setGlossaryOpen: (v) => set({ glossaryOpen: v }),
    setRing: (spec) => set({
        ring: spec,
        cochainValues: new Map(),
        basisCursor: 0,
    }),
}));
