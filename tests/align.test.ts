import { describe, expect, it } from "vitest";
import type { Disc, Space } from "../src/state/types";
import { alignDiscsToGoodCover } from "../src/math/align";
import {
  coverComplete,
  pairComponentCount,
  tripleComponentCount,
} from "../src/math/intersection";
import { SCENE_BAD_COVER, SCENE_TORUS_H1 } from "../src/tutorial/scenes";

function withIds(discs: Array<Omit<Partial<Disc>, "id"> & Pick<Disc, "cx" | "cy" | "r">>): Disc[] {
  return discs.map((d, i) => ({
    ...d,
    id: `d${i}`,
    color: d.color ?? "#000",
  }));
}

function badPairs(discs: Disc[], space: Space): Array<[number, number, number]> {
  const out: Array<[number, number, number]> = [];
  for (let i = 0; i < discs.length; i++) {
    for (let j = i + 1; j < discs.length; j++) {
      const components = pairComponentCount(space, discs[i], discs[j]);
      if (components > 1) out.push([i, j, components]);
    }
  }
  return out;
}

function badTriples(discs: Disc[], space: Space): Array<[number, number, number, number]> {
  const out: Array<[number, number, number, number]> = [];
  for (let i = 0; i < discs.length; i++) {
    for (let j = i + 1; j < discs.length; j++) {
      for (let k = j + 1; k < discs.length; k++) {
        const components = tripleComponentCount(space, discs[i], discs[j], discs[k]);
        if (components > 1) out.push([i, j, k, components]);
      }
    }
  }
  return out;
}

function coveredGridPixels(discs: Disc[]): number {
  const min = -6;
  const max = 6;
  const n = 80;
  const step = (max - min) / n;
  let covered = 0;
  for (let ix = 0; ix < n; ix++) {
    const cx = min + (ix + 0.5) * step;
    for (let iy = 0; iy < n; iy++) {
      const cy = min + (iy + 0.5) * step;
      if (
        discs.some((d) => {
          for (let dx = -12; dx <= 12; dx += 12) {
            for (let dy = -12; dy <= 12; dy += 12) {
              const x = cx - (d.cx + dx);
              const y = cy - (d.cy + dy);
              if (x * x + y * y <= d.r * d.r) return true;
            }
          }
          return false;
        })
      ) {
        covered += 1;
      }
    }
  }
  return covered;
}

function uniqueGridPixelCounts(discs: Disc[]): number[] {
  const min = -6;
  const max = 6;
  const n = 80;
  const step = (max - min) / n;
  const unique = discs.map(() => 0);
  for (let ix = 0; ix < n; ix++) {
    const cx = min + (ix + 0.5) * step;
    for (let iy = 0; iy < n; iy++) {
      const cy = min + (iy + 0.5) * step;
      let count = 0;
      let onlyIdx = -1;
      for (let i = 0; i < discs.length; i++) {
        const d = discs[i];
        let covered = false;
        for (let dx = -12; dx <= 12 && !covered; dx += 12) {
          for (let dy = -12; dy <= 12; dy += 12) {
            const x = cx - (d.cx + dx);
            const y = cy - (d.cy + dy);
            if (x * x + y * y <= d.r * d.r) {
              covered = true;
              break;
            }
          }
        }
        if (covered) {
          count += 1;
          onlyIdx = i;
        }
      }
      if (count === 1) unique[onlyIdx] += 1;
    }
  }
  return unique;
}

describe("alignDiscsToGoodCover", () => {
  it("removes all disconnected pair/triple components from the initial 2x2 bad cover", () => {
    const initial = withIds(SCENE_BAD_COVER.discs);
    const aligned = alignDiscsToGoodCover(initial, "torus");

    expect(badPairs(aligned, "torus")).toEqual([]);
    expect(badTriples(aligned, "torus")).toEqual([]);
    if (!coverComplete(aligned, "torus")) {
      expect(uniqueGridPixelCounts(aligned).every((count) => count > 0)).toBe(true);
    }
  });

  it("uses a redundant disc to cover empty torus space without adding bad components", () => {
    const initial = withIds(SCENE_TORUS_H1.discs);
    initial[4] = { ...initial[4], cx: initial[0].cx, cy: initial[0].cy };
    const before = coveredGridPixels(initial);
    const aligned = alignDiscsToGoodCover(initial, "torus");

    expect(badPairs(aligned, "torus")).toEqual([]);
    expect(badTriples(aligned, "torus")).toEqual([]);
    expect(coveredGridPixels(aligned)).toBeGreaterThan(before);
    if (!coverComplete(aligned, "torus")) {
      expect(uniqueGridPixelCounts(aligned).every((count) => count > 0)).toBe(true);
    }
  });
});
