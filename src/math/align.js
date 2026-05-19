import { TORUS_PERIOD, normalizePosition, pairIntersects, tripleIntersects, pairComponentCount, tripleComponentCount, coverComplete, } from "./intersection";
import { deckApplyDisc, deckElements, DECK_ID } from "./deck";
const STEPS = 30;
const GRID_N = 60;
const TEMP_INIT = 1.0;
const COOLING = 0.85;
const CONVERGENCE_TEMP = 0.05;
const TANGENT_MARGIN = 0.05;
// Squared shortest distance on the torus between two positions. Used only as
// a deterministic Phase-1 tiebreaker between already-valid component-reducing
// moves; Phase 2's objective never depends on centre distance.
function torusDist2(x1, y1, x2, y2) {
    let dx = Math.abs(x1 - x2);
    let dy = Math.abs(y1 - y2);
    dx = Math.min(dx, TORUS_PERIOD - dx);
    dy = Math.min(dy, TORUS_PERIOD - dy);
    return dx * dx + dy * dy;
}
// ============================================================================
// Phase 1 — bad-cover surgery
//   For each pair / triple in the quotient with >1 component, translate one
//   disc just past tangent with the offending deck image. Topological move;
//   not an optimisation.
// ============================================================================
function diff(a, b) {
    return { x: a.x - b.x, y: a.y - b.y };
}
function norm(v) {
    return Math.hypot(v.x, v.y);
}
function escapeDelta(c_i, gSrc, sum, g) {
    const v = diff(c_i, gSrc);
    const d = norm(v);
    if (d < 1e-9)
        return { x: g.sx * (sum + TANGENT_MARGIN), y: 0 };
    const eps = sum - d + TANGENT_MARGIN;
    return { x: -g.sx * eps * v.x / d, y: -g.sy * eps * v.y / d };
}
function applyMove(d, dx, dy, space) {
    const np = normalizePosition(d.cx + dx, d.cy + dy, space);
    return { ...d, cx: np.cx, cy: np.cy, region: np.region ?? d.region };
}
const FIX_MAX_ITERS = 8;
function considerMove(best, discs, idx, cand, count) {
    const dist2 = torusDist2(discs[idx].cx, discs[idx].cy, cand.cx, cand.cy);
    if (best === null ||
        count < best.count ||
        (count === best.count && dist2 < best.dist2)) {
        return { idx, disc: cand, count, dist2 };
    }
    return best;
}
function pairEscapeMoves(discs, fixedIdx, movingIdx, elements, space) {
    const fixed = discs[fixedIdx];
    const moving = discs[movingIdx];
    const fixedCenter = { x: fixed.cx, y: fixed.cy };
    const sum = fixed.r + moving.r;
    const out = [];
    for (const g of elements) {
        const lifted = deckApplyDisc(g, moving);
        if (!pairIntersects(fixed, lifted))
            continue;
        const delta = escapeDelta(fixedCenter, { x: lifted.cx, y: lifted.cy }, sum, g);
        out.push(applyMove(moving, delta.x, delta.y, space));
    }
    return out;
}
function fixPair(discs, i, j, elements, space) {
    for (let it = 0; it < FIX_MAX_ITERS; it++) {
        const before = pairComponentCount(space, discs[i], discs[j]);
        if (before <= 1)
            return false;
        let best = null;
        for (const [fixedIdx, movingIdx] of [[i, j], [j, i]]) {
            for (const cand of pairEscapeMoves(discs, fixedIdx, movingIdx, elements, space)) {
                const a = movingIdx === i ? cand : discs[i];
                const b = movingIdx === j ? cand : discs[j];
                const count = pairComponentCount(space, a, b);
                if (count < before)
                    best = considerMove(best, discs, movingIdx, cand, count);
            }
        }
        if (best === null)
            return false;
        discs[best.idx] = best.disc;
        if (best.count <= 1)
            return true;
    }
    return true;
}
function pushEscapeMove(out, discs, idx, fixed, lifted, sum, g, space) {
    const delta = escapeDelta(fixed, lifted, sum, g);
    out.push({ idx, disc: applyMove(discs[idx], delta.x, delta.y, space) });
}
function tripleEscapeMovesForAnchor(discs, anchorIdx, bIdx, cIdx, elements, space) {
    const out = [];
    const anchor = discs[anchorIdx];
    const b = discs[bIdx];
    const c = discs[cIdx];
    const aCenter = { x: anchor.cx, y: anchor.cy };
    for (const gb of elements) {
        const lb = deckApplyDisc(gb, b);
        const lbCenter = { x: lb.cx, y: lb.cy };
        for (const gc of elements) {
            const lc = deckApplyDisc(gc, c);
            if (!tripleIntersects(anchor, lb, lc))
                continue;
            const lcCenter = { x: lc.cx, y: lc.cy };
            pushEscapeMove(out, discs, anchorIdx, lbCenter, aCenter, anchor.r + b.r, DECK_ID, space);
            pushEscapeMove(out, discs, bIdx, aCenter, lbCenter, anchor.r + b.r, gb, space);
            pushEscapeMove(out, discs, anchorIdx, lcCenter, aCenter, anchor.r + c.r, DECK_ID, space);
            pushEscapeMove(out, discs, cIdx, aCenter, lcCenter, anchor.r + c.r, gc, space);
            pushEscapeMove(out, discs, bIdx, lcCenter, lbCenter, b.r + c.r, gb, space);
            pushEscapeMove(out, discs, cIdx, lbCenter, lcCenter, b.r + c.r, gc, space);
        }
    }
    return out;
}
function fixTriple(discs, i, j, k, elements, space) {
    for (let it = 0; it < FIX_MAX_ITERS; it++) {
        const before = tripleComponentCount(space, discs[i], discs[j], discs[k]);
        if (before <= 1)
            return false;
        let best = null;
        const anchorOrders = [
            [i, j, k],
            [j, i, k],
            [k, i, j],
        ];
        for (const [anchorIdx, bIdx, cIdx] of anchorOrders) {
            for (const { idx, disc } of tripleEscapeMovesForAnchor(discs, anchorIdx, bIdx, cIdx, elements, space)) {
                const a = idx === i ? disc : discs[i];
                const b = idx === j ? disc : discs[j];
                const c = idx === k ? disc : discs[k];
                const count = tripleComponentCount(space, a, b, c);
                if (count < before)
                    best = considerMove(best, discs, idx, disc, count);
            }
        }
        if (best === null)
            return false;
        discs[best.idx] = best.disc;
        if (best.count <= 1)
            return true;
    }
    return true;
}
const PHASE1_MAX_PASSES = 40;
function phase1Pass(discs, space, elements) {
    let touched = false;
    const n = discs.length;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (pairComponentCount(space, discs[i], discs[j]) > 1) {
                touched = fixPair(discs, i, j, elements, space) || touched;
            }
        }
    }
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            for (let k = j + 1; k < n; k++) {
                if (tripleComponentCount(space, discs[i], discs[j], discs[k]) > 1) {
                    touched = fixTriple(discs, i, j, k, elements, space) || touched;
                }
            }
        }
    }
    return touched;
}
function phase1Sweep(discs, space) {
    const out = discs.map((d) => ({ ...d }));
    const elements = deckElements(space);
    let changed = false;
    for (let pass = 0; pass < PHASE1_MAX_PASSES; pass++) {
        const passChanged = phase1Pass(out, space, elements);
        changed = changed || passChanged;
        if (!passChanged)
            break;
    }
    return { discs: out, changed };
}
// ============================================================================
// Phase 2 — binary repulsion onto empty pixels.
//   For each disc i, scan all GRID_N×GRID_N candidate positions. At each
//   candidate, score pixels covered by disc_i as binary overlap with OTHER
//   discs: a pixel covered by one other disc and a pixel covered by five other
//   discs both count as "on another disc" once. Pick the minimum-overlap /
//   maximum-empty candidate. Interpolate from current toward it by T.
//
//   No function of centroid distance enters the objective. Distances appear
//   only to test pixel-in-disc, which is a geometric primitive of the disc
//   itself, not a metric between disc centers.
// ============================================================================
const PIXELS = GRID_N * GRID_N;
const STEP = TORUS_PERIOD / GRID_N;
const HALF = TORUS_PERIOD / 2;
function pixelIdx(ix, iy) {
    const wx = ((ix % GRID_N) + GRID_N) % GRID_N;
    const wy = ((iy % GRID_N) + GRID_N) % GRID_N;
    return wx * GRID_N + wy;
}
function pixelXY(ix, iy) {
    return { x: -HALF + (ix + 0.5) * STEP, y: -HALF + (iy + 0.5) * STEP };
}
function nearestGridIdx(c) {
    const ix = Math.round((c + HALF) / STEP - 0.5);
    return ((ix % GRID_N) + GRID_N) % GRID_N;
}
const footprintCache = new Map();
const footprintSpanCache = new Map();
function discFootprint(r) {
    const key = Math.round(r * 1e4);
    const hit = footprintCache.get(key);
    if (hit)
        return hit;
    const max = Math.ceil(r / STEP) + 1;
    const r2 = r * r;
    const out = [];
    for (let dx = -max; dx <= max; dx++) {
        for (let dy = -max; dy <= max; dy++) {
            if ((dx * STEP) ** 2 + (dy * STEP) ** 2 <= r2)
                out.push([dx, dy]);
        }
    }
    footprintCache.set(key, out);
    return out;
}
function discFootprintSpans(r) {
    const key = Math.round(r * 1e4);
    const hit = footprintSpanCache.get(key);
    if (hit)
        return hit;
    const max = Math.ceil(r / STEP) + 1;
    const r2 = r * r;
    const spans = [];
    let area = 0;
    let wraps = max * 2 + 1 > GRID_N;
    for (let dy = -max; dy <= max; dy++) {
        let minDx = Infinity;
        let maxDx = -Infinity;
        for (let dx = -max; dx <= max; dx++) {
            if ((dx * STEP) ** 2 + (dy * STEP) ** 2 <= r2) {
                minDx = Math.min(minDx, dx);
                maxDx = Math.max(maxDx, dx);
            }
        }
        if (minDx !== Infinity) {
            const width = maxDx - minDx + 1;
            wraps = wraps || width > GRID_N;
            spans.push({ dy, minDx, maxDx });
            area += width;
        }
    }
    const out = { spans, area, wraps };
    footprintSpanCache.set(key, out);
    return out;
}
// Cover-bitmap of disc d in the quotient: 1 if pixel is inside any deck image
// of d, else 0.
function paintFootprint(bm, fp, cxIdx, cyIdx) {
    for (const [dx, dy] of fp) {
        bm[pixelIdx(cxIdx + dx, cyIdx + dy)] = 1;
    }
}
function coverBitmap(d, elements, space) {
    const bm = new Uint8Array(PIXELS);
    const fp = discFootprint(d.r);
    if (space === "torus") {
        paintFootprint(bm, fp, nearestGridIdx(d.cx), nearestGridIdx(d.cy));
        return bm;
    }
    for (const g of elements) {
        const cx_idx = nearestGridIdx(g.sx * d.cx + g.tx);
        const cy_idx = nearestGridIdx(g.sy * d.cy + g.ty);
        paintFootprint(bm, fp, cx_idx, cy_idx);
    }
    return bm;
}
function computeCoverage(discs, space) {
    const elements = deckElements(space);
    const perDisc = [];
    const total = new Uint16Array(PIXELS);
    for (const d of discs) {
        const bm = coverBitmap(d, elements, space);
        perDisc.push(bm);
        for (let p = 0; p < PIXELS; p++)
            total[p] += bm[p];
    }
    return { perDisc, total };
}
function scoreCandidateBitmap(bm, total, selfBm) {
    let overlap = 0;
    let empty = 0;
    for (let p = 0; p < PIXELS; p++) {
        if (bm[p] === 0)
            continue;
        if (total[p] - selfBm[p] > 0)
            overlap += 1;
        else
            empty += 1;
    }
    return { overlap, empty };
}
function scoreTorusCandidate(ix, iy, footprint, total, selfBm) {
    let overlap = 0;
    let empty = 0;
    for (const [dx, dy] of footprint) {
        const p = pixelIdx(ix + dx, iy + dy);
        if (total[p] - selfBm[p] > 0)
            overlap += 1;
        else
            empty += 1;
    }
    return { overlap, empty };
}
function buildOtherCoverageRowPrefix(total, selfBm) {
    const prefix = new Uint16Array(GRID_N * (GRID_N + 1));
    for (let y = 0; y < GRID_N; y++) {
        const row = y * (GRID_N + 1);
        let acc = 0;
        prefix[row] = 0;
        for (let x = 0; x < GRID_N; x++) {
            const p = pixelIdx(x, y);
            if (total[p] - selfBm[p] > 0)
                acc += 1;
            prefix[row + x + 1] = acc;
        }
    }
    return prefix;
}
function rowPrefixRange(prefix, y, minX, maxX) {
    const rowY = ((y % GRID_N) + GRID_N) % GRID_N;
    const base = rowY * (GRID_N + 1);
    const start = ((minX % GRID_N) + GRID_N) % GRID_N;
    const end = ((maxX % GRID_N) + GRID_N) % GRID_N;
    if (start <= end)
        return prefix[base + end + 1] - prefix[base + start];
    return prefix[base + GRID_N] - prefix[base + start] + prefix[base + end + 1];
}
function scoreTorusCandidateByRows(ix, iy, footprint, otherPrefix) {
    let overlap = 0;
    for (const span of footprint.spans) {
        overlap += rowPrefixRange(otherPrefix, iy + span.dy, ix + span.minDx, ix + span.maxDx);
    }
    return { overlap, empty: footprint.area - overlap };
}
function stepTowardTarget(space, disc, target, T) {
    const np = normalizePosition(disc.cx + T * wrappedStep(disc.cx, target.x), disc.cy + T * wrappedStep(disc.cy, target.y), space);
    return { ...disc, cx: np.cx, cy: np.cy, region: np.region ?? disc.region };
}
function bestLegalGridMove(discs, idx, total, selfBm, elements, space, T, allowedExcess) {
    const disc = discs[idx];
    const previousLocalExcess = movedDiscComponentExcess(discs, space, idx);
    const candidates = [];
    const torusFootprint = space === "torus" ? discFootprint(disc.r) : null;
    const torusSpans = space === "torus" ? discFootprintSpans(disc.r) : null;
    const otherPrefix = torusSpans !== null && !torusSpans.wraps
        ? buildOtherCoverageRowPrefix(total, selfBm)
        : null;
    for (let ix = 0; ix < GRID_N; ix++) {
        for (let iy = 0; iy < GRID_N; iy++) {
            let score;
            if (otherPrefix !== null && torusSpans !== null) {
                score = scoreTorusCandidateByRows(ix, iy, torusSpans, otherPrefix);
            }
            else if (torusFootprint !== null) {
                score = scoreTorusCandidate(ix, iy, torusFootprint, total, selfBm);
            }
            else {
                const xy = pixelXY(ix, iy);
                const bm = coverBitmap({ ...disc, cx: xy.x, cy: xy.y }, elements, space);
                score = scoreCandidateBitmap(bm, total, selfBm);
            }
            if (score.empty === 0)
                continue;
            candidates.push({ ix, iy, overlap: score.overlap, empty: score.empty });
        }
    }
    candidates.sort((a, b) => {
        if (a.overlap !== b.overlap)
            return a.overlap - b.overlap;
        return b.empty - a.empty;
    });
    for (const scored of candidates) {
        const target = pixelXY(scored.ix, scored.iy);
        let localT = T;
        let candidate = stepTowardTarget(space, disc, target, localT);
        let candidateLocalExcess = movedDiscComponentExcess(discs, space, idx, candidate, previousLocalExcess);
        while (candidateLocalExcess > previousLocalExcess && localT > CONVERGENCE_TEMP) {
            localT *= COOLING;
            candidate = stepTowardTarget(space, disc, target, localT);
            candidateLocalExcess = movedDiscComponentExcess(discs, space, idx, candidate, previousLocalExcess);
        }
        const nextExcess = allowedExcess - previousLocalExcess + candidateLocalExcess;
        if (nextExcess > allowedExcess)
            continue;
        const candidateBitmap = coverBitmap(candidate, elements, space);
        const candidateScore = scoreCandidateBitmap(candidateBitmap, total, selfBm);
        if (candidateScore.empty === 0)
            continue;
        return {
            disc: candidate,
            excess: nextExcess,
            bitmap: candidateBitmap,
        };
    }
    return null;
}
function componentExcess(discs, space) {
    let excess = 0;
    const n = discs.length;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            excess += Math.max(0, pairComponentCount(space, discs[i], discs[j]) - 1);
        }
    }
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            for (let k = j + 1; k < n; k++) {
                excess += Math.max(0, tripleComponentCount(space, discs[i], discs[j], discs[k]) - 1);
            }
        }
    }
    return excess;
}
function movedDiscComponentExcess(discs, space, idx, disc = discs[idx], cap = Infinity) {
    let excess = 0;
    const n = discs.length;
    for (let j = 0; j < n; j++) {
        if (j === idx)
            continue;
        excess += Math.max(0, pairComponentCount(space, disc, discs[j]) - 1);
        if (excess > cap)
            return excess;
    }
    for (let j = 0; j < n; j++) {
        if (j === idx)
            continue;
        for (let k = j + 1; k < n; k++) {
            if (k === idx)
                continue;
            excess += Math.max(0, tripleComponentCount(space, disc, discs[j], discs[k]) - 1);
            if (excess > cap)
                return excess;
        }
    }
    return excess;
}
function wrappedStep(from, to) {
    let delta = to - from;
    if (delta > HALF)
        delta -= TORUS_PERIOD;
    if (delta < -HALF)
        delta += TORUS_PERIOD;
    return delta;
}
function phase2Lloyd(discs, space, T) {
    const out = discs.map((d) => ({ ...d }));
    const elements = deckElements(space);
    let cov = computeCoverage(out, space);
    let allowedExcess = componentExcess(out, space);
    let changed = false;
    for (let i = 0; i < out.length; i++) {
        const best = bestLegalGridMove(out, i, cov.total, cov.perDisc[i], elements, space, T, allowedExcess);
        if (best === null)
            continue;
        const candidate = best.disc;
        const newBm = best.bitmap;
        for (let p = 0; p < PIXELS; p++) {
            cov.total[p] = cov.total[p] - cov.perDisc[i][p] + newBm[p];
        }
        cov.perDisc[i] = newBm;
        changed = changed || torusDist2(out[i].cx, out[i].cy, candidate.cx, candidate.cy) > 1e-12;
        out[i] = candidate;
        allowedExcess = best.excess;
    }
    return { discs: out, changed };
}
// ============================================================================
// Main loop
// ============================================================================
function isGood(discs, space) {
    if (!coverComplete(discs, space))
        return false;
    const n = discs.length;
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (pairComponentCount(space, discs[i], discs[j]) > 1)
                return false;
        }
    }
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            for (let k = j + 1; k < n; k++) {
                if (tripleComponentCount(space, discs[i], discs[j], discs[k]) > 1)
                    return false;
            }
        }
    }
    return true;
}
export function alignDiscsToGoodCover(initial, space) {
    if (initial.length <= 1)
        return initial;
    if (space === "planar" || space === "wedge2")
        return initial;
    let cur = initial.map((d) => ({ ...d }));
    cur = phase1Sweep(cur, space).discs;
    let T = TEMP_INIT;
    for (let step = 0; step < STEPS; step++) {
        const phase2 = phase2Lloyd(cur, space, T);
        cur = phase2.discs;
        const phase1 = phase1Sweep(cur, space);
        cur = phase1.discs;
        if (isGood(cur, space))
            return cur;
        if (!phase2.changed && !phase1.changed)
            break;
        T *= COOLING;
        if (T < CONVERGENCE_TEMP)
            break;
    }
    return phase1Sweep(cur, space).discs;
}
