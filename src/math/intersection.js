import { deckApplyDisc, deckElements } from "./deck";
const EPS = 1e-9;
export function pointInDisc(x, y, d) {
    const dx = x - d.cx;
    const dy = y - d.cy;
    return dx * dx + dy * dy <= d.r * d.r + EPS;
}
export function pairIntersects(a, b) {
    const dx = a.cx - b.cx;
    const dy = a.cy - b.cy;
    const sum = a.r + b.r;
    return dx * dx + dy * dy <= sum * sum + EPS;
}
function circlePairPoints(a, b) {
    const dx = b.cx - a.cx;
    const dy = b.cy - a.cy;
    const d2 = dx * dx + dy * dy;
    const d = Math.sqrt(d2);
    if (d < EPS)
        return [];
    if (d > a.r + b.r + EPS)
        return [];
    if (d + Math.min(a.r, b.r) < Math.max(a.r, b.r) - EPS)
        return [];
    const aDist = (d2 + a.r * a.r - b.r * b.r) / (2 * d);
    const hSq = Math.max(0, a.r * a.r - aDist * aDist);
    const h = Math.sqrt(hSq);
    const px = a.cx + (aDist * dx) / d;
    const py = a.cy + (aDist * dy) / d;
    const rx = (-dy * h) / d;
    const ry = (dx * h) / d;
    if (h < EPS)
        return [[px, py]];
    return [
        [px + rx, py + ry],
        [px - rx, py - ry],
    ];
}
function centerInBoth(target, a, b) {
    return pointInDisc(target.cx, target.cy, a) && pointInDisc(target.cx, target.cy, b);
}
function pairPointInThird(a, b, third) {
    for (const [x, y] of circlePairPoints(a, b)) {
        if (pointInDisc(x, y, third))
            return true;
    }
    return false;
}
export function tripleIntersects(a, b, c) {
    if (!pairIntersects(a, b) || !pairIntersects(a, c) || !pairIntersects(b, c))
        return false;
    if (centerInBoth(a, b, c))
        return true;
    if (centerInBoth(b, a, c))
        return true;
    if (centerInBoth(c, a, b))
        return true;
    if (pairPointInThird(a, b, c))
        return true;
    if (pairPointInThird(a, c, b))
        return true;
    if (pairPointInThird(b, c, a))
        return true;
    return false;
}
export const TORUS_PERIOD = 12;
const componentDeckElementsCache = new Map();
function componentDeckElements(space) {
    const cached = componentDeckElementsCache.get(space);
    if (cached !== undefined)
        return cached;
    const elements = deckElements(space);
    componentDeckElementsCache.set(space, elements);
    return elements;
}
// Helly's theorem in R²: a finite family of convex sets has a common point iff
// every triple does. For discs (convex), this exactly characterizes non-empty
// k-fold intersection from the existing 2- and 3-disc tests.
function planarConvexNonEmpty(discs) {
    if (discs.length === 0)
        return false;
    if (discs.length === 1)
        return true;
    if (discs.length === 2)
        return pairIntersects(discs[0], discs[1]);
    for (let i = 0; i < discs.length; i++) {
        for (let j = i + 1; j < discs.length; j++) {
            for (let k = j + 1; k < discs.length; k++) {
                if (!tripleIntersects(discs[i], discs[j], discs[k]))
                    return false;
            }
        }
    }
    return true;
}
// Count components of (d_1)_X ∩ … ∩ (d_k)_X in a quotient X = R² / Γ.
//
// Math: components of the intersection in X correspond to Γ-orbits of
// connected components of π⁻¹(d_1∩…∩d_k) in R². Pick any disc whose lifts
// are pairwise planarly disjoint as an *anchor*. Then:
//   1. Each cover-component is contained in exactly one anchor-lift (a
//      connected planar region lies in one connected piece of π⁻¹(anchor),
//      and disjoint anchor-lifts ARE those pieces).
//   2. Γ acts transitively on anchor-lifts, so each Γ-orbit of
//      cover-components meets the central anchor-lift (γ = e) exactly once.
// Therefore, fixing the anchor's transform to e and counting connected
// components of the union of pieces touching the central anchor-lift gives
// the exact count of components in the quotient.
//
// Any disc with radius < (period / 2) has pairwise disjoint lifts (lifts at
// distinct deck centers are ≥ TORUS_PERIOD apart; sum of radii < period).
// Pick the smallest-radius disc as anchor.
function deckComponentCount(space, discs) {
    let anchorIdx = 0;
    for (let i = 1; i < discs.length; i++) {
        if (discs[i].r < discs[anchorIdx].r)
            anchorIdx = i;
    }
    const elements = componentDeckElements(space);
    const others = [];
    for (let i = 0; i < discs.length; i++)
        if (i !== anchorIdx)
            others.push(discs[i]);
    const pieces = [];
    const stack = [discs[anchorIdx]];
    const recur = (depth) => {
        if (depth === others.length) {
            pieces.push(stack.slice());
            return;
        }
        for (const g of elements) {
            const lifted = deckApplyDisc(g, others[depth]);
            stack.push(lifted);
            if (planarConvexNonEmpty(stack))
                recur(depth + 1);
            stack.pop();
        }
    };
    recur(0);
    const n = pieces.length;
    if (n === 0)
        return 0;
    const parent = Array.from({ length: n }, (_, i) => i);
    const find = (i) => parent[i] === i ? i : (parent[i] = find(parent[i]));
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (planarConvexNonEmpty([...pieces[i], ...pieces[j]])) {
                const ri = find(i), rj = find(j);
                if (ri !== rj)
                    parent[ri] = rj;
            }
        }
    }
    const roots = new Set();
    for (let i = 0; i < n; i++)
        roots.add(find(i));
    return roots.size;
}
export function pairComponentCount(space, a, b) {
    if (space === "wedge2")
        return wedge2PairComponentCount(a, b);
    return deckComponentCount(space, [a, b]);
}
export function tripleComponentCount(space, a, b, c) {
    if (space === "wedge2")
        return wedge2TripleComponentCount(a, b, c);
    return deckComponentCount(space, [a, b, c]);
}
function addEvent(events, x, minX, maxX) {
    if (x < minX - EPS || x > maxX + EPS)
        return;
    events.push(Math.max(minX, Math.min(maxX, x)));
}
function circleCircleIntersectionXs(events, a, b, minX, maxX) {
    const dx = b.cx - a.cx;
    const dy = b.cy - a.cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < EPS * EPS)
        return;
    const d = Math.sqrt(d2);
    if (d > a.r + b.r + EPS)
        return;
    if (d < Math.abs(a.r - b.r) - EPS)
        return;
    const along = (d2 + a.r * a.r - b.r * b.r) / (2 * d);
    const h2 = a.r * a.r - along * along;
    if (h2 < -EPS)
        return;
    const h = Math.sqrt(Math.max(0, h2));
    const ux = dx / d;
    const uy = dy / d;
    const px = a.cx + along * ux;
    addEvent(events, px - uy * h, minX, maxX);
    addEvent(events, px + uy * h, minX, maxX);
}
function circleHorizontalEdgeIntersectionXs(events, d, y, minX, maxX) {
    const dy = y - d.cy;
    const h2 = d.r * d.r - dy * dy;
    if (h2 < -EPS)
        return;
    const h = Math.sqrt(Math.max(0, h2));
    addEvent(events, d.cx - h, minX, maxX);
    addEvent(events, d.cx + h, minX, maxX);
}
function verticalLineCoveredByDiscs(discs, x, minY, maxY) {
    const intervals = [];
    for (const d of discs) {
        const dx = x - d.cx;
        const h2 = d.r * d.r - dx * dx;
        if (h2 < -EPS)
            continue;
        const h = Math.sqrt(Math.max(0, h2));
        const lo = Math.max(minY, d.cy - h);
        const hi = Math.min(maxY, d.cy + h);
        if (hi >= minY - EPS && lo <= maxY + EPS)
            intervals.push([lo, hi]);
    }
    if (intervals.length === 0)
        return false;
    intervals.sort((a, b) => a[0] - b[0] || b[1] - a[1]);
    let coveredTo = minY;
    for (const [lo, hi] of intervals) {
        if (lo > coveredTo + EPS)
            return false;
        if (hi > coveredTo)
            coveredTo = hi;
        if (coveredTo >= maxY - EPS)
            return true;
    }
    return coveredTo >= maxY - EPS;
}
function exactRectCoveredByDiscs(discs, minX, maxX, minY, maxY) {
    if (discs.length === 0)
        return false;
    const relevant = discs.filter((d) => d.cx + d.r >= minX - EPS && d.cx - d.r <= maxX + EPS &&
        d.cy + d.r >= minY - EPS && d.cy - d.r <= maxY + EPS);
    if (relevant.length === 0)
        return false;
    const events = [minX, maxX];
    for (const d of relevant) {
        addEvent(events, d.cx - d.r, minX, maxX);
        addEvent(events, d.cx + d.r, minX, maxX);
        circleHorizontalEdgeIntersectionXs(events, d, minY, minX, maxX);
        circleHorizontalEdgeIntersectionXs(events, d, maxY, minX, maxX);
    }
    for (let i = 0; i < relevant.length; i++) {
        for (let j = i + 1; j < relevant.length; j++) {
            circleCircleIntersectionXs(events, relevant[i], relevant[j], minX, maxX);
        }
    }
    events.sort((a, b) => a - b);
    const xs = [];
    for (const x of events) {
        if (xs.length === 0 || Math.abs(x - xs[xs.length - 1]) > 1e-7)
            xs.push(x);
    }
    for (const x of xs) {
        if (!verticalLineCoveredByDiscs(relevant, x, minY, maxY))
            return false;
    }
    for (let i = 0; i + 1 < xs.length; i++) {
        const a = xs[i];
        const b = xs[i + 1];
        if (b - a <= 1e-7)
            continue;
        if (!verticalLineCoveredByDiscs(relevant, (a + b) / 2, minY, maxY))
            return false;
    }
    return true;
}
export function coverComplete(discs, space) {
    if (space === "planar")
        return true;
    if (space === "wedge2")
        return coverCompleteWedge2(discs);
    if (discs.length === 0)
        return false;
    const P = TORUS_PERIOD;
    const HALF = P / 2;
    return exactRectCoveredByDiscs(discs.flatMap((d) => spaceTranslates(d, space)), -HALF, HALF, -HALF, HALF);
}
function planarQuadNonEmpty(a, b, c, d) {
    return (tripleIntersects(a, b, c) &&
        tripleIntersects(a, b, d) &&
        tripleIntersects(a, c, d) &&
        tripleIntersects(b, c, d));
}
// ============================================================================
// wedge2: S² ∨ S¹ ∨ S¹
// ============================================================================
const WEDGE_LEFT_CX_MIN = -6;
const WEDGE_LEFT_CX_MAX = -2;
const WEDGE_RIGHT_CX_MIN = 2;
const WEDGE_RIGHT_CX_MAX = 6;
const WEDGE_SPHERE_CX = 0;
const WEDGE_SPHERE_CY = 3;
const WEDGE_SPHERE_ZONE_R = 3;
const WEDGE_SPHERE_SCALE = 3;
const WEDGE_BASEPOINT_CX = 0;
const WEDGE_BASEPOINT_CY = -3;
const WEDGE_BASEPOINT_ZONE_R = 0.8;
const WEDGE_STRIP_PERIOD = TORUS_PERIOD;
const BASEPOINT_SHADOW_LEFT_CX = (WEDGE_LEFT_CX_MIN + WEDGE_LEFT_CX_MAX) / 2;
const BASEPOINT_SHADOW_LEFT_CY = 0;
const BASEPOINT_SHADOW_RIGHT_CX = (WEDGE_RIGHT_CX_MIN + WEDGE_RIGHT_CX_MAX) / 2;
const BASEPOINT_SHADOW_RIGHT_CY = 0;
const BASEPOINT_SHADOW_SPHERE_CX = WEDGE_SPHERE_CX;
const BASEPOINT_SHADOW_SPHERE_CY = WEDGE_SPHERE_CY;
export function regionForPosition(cx, cy) {
    const dxB = cx - WEDGE_BASEPOINT_CX;
    const dyB = cy - WEDGE_BASEPOINT_CY;
    if (dxB * dxB + dyB * dyB <= WEDGE_BASEPOINT_ZONE_R * WEDGE_BASEPOINT_ZONE_R) {
        return "basepoint";
    }
    const dxS = cx - WEDGE_SPHERE_CX;
    const dyS = cy - WEDGE_SPHERE_CY;
    if (dxS * dxS + dyS * dyS <= WEDGE_SPHERE_ZONE_R * WEDGE_SPHERE_ZONE_R) {
        return "sphere";
    }
    if (cx <= WEDGE_LEFT_CX_MAX)
        return "left";
    if (cx >= WEDGE_RIGHT_CX_MIN)
        return "right";
    return cx < 0 ? "left" : "right";
}
function sphereProject(cx, cy) {
    const u = (cx - WEDGE_SPHERE_CX) / WEDGE_SPHERE_SCALE;
    const v = (cy - WEDGE_SPHERE_CY) / WEDGE_SPHERE_SCALE;
    const u2v2 = u * u + v * v;
    const denom = u2v2 + 1;
    return [(2 * u) / denom, (2 * v) / denom, (u2v2 - 1) / denom];
}
function sphereCapCenter(d) {
    return sphereProject(d.cx, d.cy);
}
function sphereCapRadius(d) {
    return Math.min(d.r, Math.PI - 1e-6);
}
function dot3(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function pointInSphereCap(p, center, radius) {
    return dot3(p, center) >= Math.cos(radius) - EPS;
}
function normalize3(v) {
    const n = Math.hypot(v[0], v[1], v[2]);
    if (n < EPS)
        return [0, 0, 1];
    return [v[0] / n, v[1] / n, v[2] / n];
}
function cross3(a, b) {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ];
}
function capBoundaryIntersections(c1, r1, c2, r2) {
    const cosR1 = Math.cos(r1);
    const cosR2 = Math.cos(r2);
    const d = dot3(c1, c2);
    const denom = 1 - d * d;
    if (denom < EPS)
        return [];
    const alpha = (cosR1 - d * cosR2) / denom;
    const beta = (cosR2 - d * cosR1) / denom;
    const ax = cross3(c1, c2);
    const crossN2 = dot3(ax, ax);
    if (crossN2 < EPS)
        return [];
    const base = [
        alpha * c1[0] + beta * c2[0],
        alpha * c1[1] + beta * c2[1],
        alpha * c1[2] + beta * c2[2],
    ];
    const baseN2 = dot3(base, base);
    const gammaSq = (1 - baseN2) / crossN2;
    if (gammaSq < -EPS)
        return [];
    const gamma = Math.sqrt(Math.max(0, gammaSq));
    const p1 = [
        base[0] + gamma * ax[0],
        base[1] + gamma * ax[1],
        base[2] + gamma * ax[2],
    ];
    if (gamma < EPS)
        return [p1];
    const p2 = [
        base[0] - gamma * ax[0],
        base[1] - gamma * ax[1],
        base[2] - gamma * ax[2],
    ];
    return [p1, p2];
}
export function spherePairIntersects(a, b) {
    const ca = sphereCapCenter(a);
    const cb = sphereCapCenter(b);
    const ra = sphereCapRadius(a);
    const rb = sphereCapRadius(b);
    const sum = ra + rb;
    if (sum >= Math.PI)
        return true;
    return dot3(ca, cb) >= Math.cos(sum) - EPS;
}
function sphereCapsCommon(caps) {
    const candidates = [];
    for (const cap of caps)
        candidates.push(cap.c);
    for (let i = 0; i < caps.length; i++) {
        for (let j = i + 1; j < caps.length; j++) {
            const pts = capBoundaryIntersections(caps[i].c, caps[i].r, caps[j].c, caps[j].r);
            for (const p of pts)
                candidates.push(p);
        }
    }
    const sum = [0, 0, 0];
    for (const cap of caps) {
        sum[0] += cap.c[0];
        sum[1] += cap.c[1];
        sum[2] += cap.c[2];
    }
    candidates.push(normalize3(sum));
    for (const p of candidates) {
        let inside = true;
        for (const cap of caps) {
            if (!pointInSphereCap(p, cap.c, cap.r)) {
                inside = false;
                break;
            }
        }
        if (inside)
            return true;
    }
    return false;
}
export function sphereTripleIntersects(a, b, c) {
    if (!spherePairIntersects(a, b))
        return false;
    if (!spherePairIntersects(a, c))
        return false;
    if (!spherePairIntersects(b, c))
        return false;
    return sphereCapsCommon([
        { c: sphereCapCenter(a), r: sphereCapRadius(a) },
        { c: sphereCapCenter(b), r: sphereCapRadius(b) },
        { c: sphereCapCenter(c), r: sphereCapRadius(c) },
    ]);
}
export function sphereQuadIntersects(a, b, c, d) {
    if (!sphereTripleIntersects(a, b, c))
        return false;
    if (!sphereTripleIntersects(a, b, d))
        return false;
    if (!sphereTripleIntersects(a, c, d))
        return false;
    if (!sphereTripleIntersects(b, c, d))
        return false;
    return sphereCapsCommon([
        { c: sphereCapCenter(a), r: sphereCapRadius(a) },
        { c: sphereCapCenter(b), r: sphereCapRadius(b) },
        { c: sphereCapCenter(c), r: sphereCapRadius(c) },
        { c: sphereCapCenter(d), r: sphereCapRadius(d) },
    ]);
}
function basepointShadow(d, region) {
    switch (region) {
        case "left":
            return { ...d, cx: BASEPOINT_SHADOW_LEFT_CX, cy: BASEPOINT_SHADOW_LEFT_CY, region: "left" };
        case "right":
            return { ...d, cx: BASEPOINT_SHADOW_RIGHT_CX, cy: BASEPOINT_SHADOW_RIGHT_CY, region: "right" };
        case "sphere":
            return { ...d, cx: BASEPOINT_SHADOW_SPHERE_CX, cy: BASEPOINT_SHADOW_SPHERE_CY, region: "sphere" };
        case "basepoint":
            return d;
    }
}
function discRegion(d) {
    return d.region ?? "basepoint";
}
// A disc D in chart c covers the basepoint iff D's chart-image contains the
// basepoint's shadow in c. Strip charts: the strip is y-periodic, the
// basepoint sits at y = 0, and stripPairIntersects already treats stripped
// discs as y-intervals, so we mirror that 1-D containment test. Sphere chart:
// the basepoint's shadow is at the south pole of the unit sphere; the disc's
// spherical cap contains it iff the south pole is within the cap.
function wedge2ReachesBasepoint(d, region) {
    switch (region) {
        case "basepoint": return true;
        case "left":
        case "right": {
            const P = WEDGE_STRIP_PERIOD;
            const dy = d.cy;
            const wrapped = Math.min(Math.abs(dy), P - Math.abs(((dy % P) + P) % P));
            return wrapped <= d.r + EPS;
        }
        case "sphere": {
            const south = sphereProject(BASEPOINT_SHADOW_SPHERE_CX, BASEPOINT_SHADOW_SPHERE_CY);
            return pointInSphereCap(south, sphereCapCenter(d), sphereCapRadius(d));
        }
    }
}
// Wedge2 = (sphere) ∨ (left S¹) ∨ (right S¹) glued at one basepoint. For
// non-basepoint disc images in DIFFERENT charts, the only point they can
// share is the basepoint; they do iff every disc reaches it. For basepoint
// discs the image extends into every chart, so a basepoint disc + chart disc
// is handled by shadowing the basepoint disc into the chart. Two basepoint
// discs share the basepoint regardless of id.
function wedge2CommonChart(regions) {
    let target = null;
    for (const r of regions) {
        if (r === "basepoint")
            continue;
        if (target === null)
            target = r;
        else if (target !== r)
            return null;
    }
    return target;
}
function stripPairIntersects(a, b) {
    const P = WEDGE_STRIP_PERIOD;
    for (const dy of [-P, 0, P]) {
        if (Math.abs(a.cy - (b.cy + dy)) <= a.r + b.r + EPS)
            return true;
    }
    return false;
}
function stripPairComponents(a, b) {
    const P = WEDGE_STRIP_PERIOD;
    let n = 0;
    for (const dy of [-P, 0, P]) {
        if (Math.abs(a.cy - (b.cy + dy)) <= a.r + b.r + EPS)
            n++;
    }
    return n;
}
function stripTranslatesOf(d) {
    const P = WEDGE_STRIP_PERIOD;
    return [-P, 0, P].map((dy) => ({ ...d, cy: d.cy + dy }));
}
function stripTripleIntersects(a, b, c) {
    for (const bt of stripTranslatesOf(b)) {
        for (const ct of stripTranslatesOf(c)) {
            if (tripleIntersects(a, bt, ct))
                return true;
        }
    }
    return false;
}
function stripTripleComponents(a, b, c) {
    let n = 0;
    for (const bt of stripTranslatesOf(b)) {
        for (const ct of stripTranslatesOf(c)) {
            if (tripleIntersects(a, bt, ct))
                n++;
        }
    }
    return n;
}
function stripQuadIntersects(a, b, c, d) {
    for (const bt of stripTranslatesOf(b)) {
        for (const ct of stripTranslatesOf(c)) {
            for (const dt of stripTranslatesOf(d)) {
                if (planarQuadNonEmpty(a, bt, ct, dt))
                    return true;
            }
        }
    }
    return false;
}
// Lift the {basepoint, sphere, left, right} regions to a common chart when
// possible, then apply chart-geometric intersection. If no common chart
// exists (mixed non-basepoint regions), the only shared point is the
// basepoint — present iff every disc reaches it.
function wedge2IntersectsK(discs) {
    const regions = discs.map(discRegion);
    const target = wedge2CommonChart(regions);
    if (target === null) {
        return discs.every((d, i) => wedge2ReachesBasepoint(d, regions[i]));
    }
    const cast = discs.map((d, i) => regions[i] === "basepoint" ? basepointShadow(d, target) : d);
    if (target === "left" || target === "right") {
        if (cast.length === 2)
            return stripPairIntersects(cast[0], cast[1]);
        if (cast.length === 3)
            return stripTripleIntersects(cast[0], cast[1], cast[2]);
        return stripQuadIntersects(cast[0], cast[1], cast[2], cast[3]);
    }
    // target === "sphere"
    if (cast.length === 2)
        return spherePairIntersects(cast[0], cast[1]);
    if (cast.length === 3)
        return sphereTripleIntersects(cast[0], cast[1], cast[2]);
    return sphereQuadIntersects(cast[0], cast[1], cast[2], cast[3]);
}
function wedge2PairIntersects(a, b) {
    return wedge2IntersectsK([a, b]);
}
function wedge2TripleIntersects(a, b, c) {
    return wedge2IntersectsK([a, b, c]);
}
function wedge2QuadIntersects(a, b, c, d) {
    return wedge2IntersectsK([a, b, c, d]);
}
function wedge2PairComponentCount(a, b) {
    const regions = [discRegion(a), discRegion(b)];
    const target = wedge2CommonChart(regions);
    if (target === null) {
        return wedge2IntersectsK([a, b]) ? 1 : 0;
    }
    const aa = regions[0] === "basepoint" ? basepointShadow(a, target) : a;
    const bb = regions[1] === "basepoint" ? basepointShadow(b, target) : b;
    if (target === "left" || target === "right")
        return stripPairComponents(aa, bb);
    return spherePairIntersects(aa, bb) ? 1 : 0;
}
function wedge2TripleComponentCount(a, b, c) {
    const regions = [discRegion(a), discRegion(b), discRegion(c)];
    const target = wedge2CommonChart(regions);
    if (target === null) {
        return wedge2IntersectsK([a, b, c]) ? 1 : 0;
    }
    const aa = regions[0] === "basepoint" ? basepointShadow(a, target) : a;
    const bb = regions[1] === "basepoint" ? basepointShadow(b, target) : b;
    const cc = regions[2] === "basepoint" ? basepointShadow(c, target) : c;
    if (target === "left" || target === "right")
        return stripTripleComponents(aa, bb, cc);
    return sphereTripleIntersects(aa, bb, cc) ? 1 : 0;
}
function wedge2Translates(d) {
    const r = discRegion(d);
    if (r === "left" || r === "right")
        return stripTranslatesOf(d);
    return [d];
}
function coverStrip(stripDiscs, bpShadow) {
    const all = [bpShadow, ...stripDiscs];
    const P = WEDGE_STRIP_PERIOD;
    const N = 80;
    for (let i = 0; i < N; i++) {
        const y = -P / 2 + (i + 0.5) * (P / N);
        let covered = false;
        for (const d of all) {
            for (const dy of [-P, 0, P]) {
                if (Math.abs(y - (d.cy + dy)) <= d.r + EPS) {
                    covered = true;
                    break;
                }
            }
            if (covered)
                break;
        }
        if (!covered)
            return false;
    }
    return true;
}
function coverSphere(sphereDiscs, bpShadow) {
    const all = [bpShadow, ...sphereDiscs];
    const N = 300;
    const phi = Math.PI * (Math.sqrt(5) - 1);
    for (let i = 0; i < N; i++) {
        const y = 1 - (i / Math.max(1, N - 1)) * 2;
        const ringR = Math.sqrt(Math.max(0, 1 - y * y));
        const theta = phi * i;
        const p = [Math.cos(theta) * ringR, y, Math.sin(theta) * ringR];
        let covered = false;
        for (const d of all) {
            if (pointInSphereCap(p, sphereCapCenter(d), sphereCapRadius(d))) {
                covered = true;
                break;
            }
        }
        if (!covered)
            return false;
    }
    return true;
}
function coverCompleteWedge2(discs) {
    const bp = discs.find((d) => d.region === "basepoint");
    if (!bp)
        return false;
    const lefts = discs.filter((d) => d.region === "left");
    if (!coverStrip(lefts, basepointShadow(bp, "left")))
        return false;
    const rights = discs.filter((d) => d.region === "right");
    if (!coverStrip(rights, basepointShadow(bp, "right")))
        return false;
    const spheres = discs.filter((d) => d.region === "sphere");
    if (!coverSphere(spheres, basepointShadow(bp, "sphere")))
        return false;
    return true;
}
function normalizeWedge2(cx, cy) {
    const region = regionForPosition(cx, cy);
    const P = WEDGE_STRIP_PERIOD;
    if (region === "left") {
        const ny = ((cy + P / 2) % P + P) % P - P / 2;
        const nx = Math.max(WEDGE_LEFT_CX_MIN, Math.min(WEDGE_LEFT_CX_MAX, cx));
        return { cx: nx, cy: ny, region };
    }
    if (region === "right") {
        const ny = ((cy + P / 2) % P + P) % P - P / 2;
        const nx = Math.max(WEDGE_RIGHT_CX_MIN, Math.min(WEDGE_RIGHT_CX_MAX, cx));
        return { cx: nx, cy: ny, region };
    }
    if (region === "basepoint") {
        return { cx: WEDGE_BASEPOINT_CX, cy: WEDGE_BASEPOINT_CY, region };
    }
    return { cx, cy, region };
}
// ============================================================================
// Space dispatch
// ============================================================================
export function spaceTranslates(d, space) {
    if (space === "wedge2")
        return wedge2Translates(d);
    return deckElements(space).map((g) => deckApplyDisc(g, d));
}
export function pairIntersectsOn(space, a, b) {
    if (space === "wedge2")
        return wedge2PairIntersects(a, b);
    for (const bt of spaceTranslates(b, space)) {
        if (pairIntersects(a, bt))
            return true;
    }
    return false;
}
export function tripleIntersectsOn(space, a, b, c) {
    if (space === "wedge2")
        return wedge2TripleIntersects(a, b, c);
    for (const bt of spaceTranslates(b, space)) {
        for (const ct of spaceTranslates(c, space)) {
            if (tripleIntersects(a, bt, ct))
                return true;
        }
    }
    return false;
}
export function quadIntersectsOn(space, a, b, c, d) {
    if (space === "wedge2")
        return wedge2QuadIntersects(a, b, c, d);
    for (const bt of spaceTranslates(b, space)) {
        for (const ct of spaceTranslates(c, space)) {
            for (const dt of spaceTranslates(d, space)) {
                if (planarQuadNonEmpty(a, bt, ct, dt))
                    return true;
            }
        }
    }
    return false;
}
export function normalizePosition(cx, cy, space) {
    const P = TORUS_PERIOD;
    const HALF = P / 2;
    if (space === "wedge2")
        return normalizeWedge2(cx, cy);
    if (space === "planar")
        return { cx, cy };
    if (space === "torus") {
        return {
            cx: ((cx + HALF) % P + P) % P - HALF,
            cy: ((cy + HALF) % P + P) % P - HALF,
        };
    }
    let x = cx;
    let y = cy;
    for (let i = 0; i < 8; i++) {
        if (y > HALF) {
            y -= P;
            x = space === "klein" ? -x : -x;
            continue;
        }
        if (y < -HALF) {
            y += P;
            x = space === "klein" ? -x : -x;
            continue;
        }
        if (x > HALF) {
            x -= P;
            if (space === "projective")
                y = -y;
            continue;
        }
        if (x < -HALF) {
            x += P;
            if (space === "projective")
                y = -y;
            continue;
        }
        break;
    }
    return { cx: x, cy: y };
}
