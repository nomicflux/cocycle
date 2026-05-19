import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useStore } from "../state/store";
import { useNerve, useCupResult, useRing, applyCoboundary } from "../state/derived";
import { simplexKey } from "../state/types";
import { zToInt } from "../math/ring";
const CUP_COLOR = "#7c3aed";
const FRONT_COLOR = "#06b6d4";
const BACK_COLOR = "#fb7185";
const SPLIT_COLOR = "#f59e0b";
function FaceOverlay({ face, positions, color, k, }) {
    if (face.length === 1) {
        const [px, py] = positions[face[0]];
        return (_jsx("circle", { cx: px, cy: py, r: 22, fill: "none", stroke: color, strokeWidth: 4, strokeOpacity: 0.85, pointerEvents: "none" }, k));
    }
    if (face.length === 2) {
        const [a, b] = face.map((i) => positions[i]);
        return (_jsx("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: color, strokeWidth: 9, strokeOpacity: 0.55, pointerEvents: "none" }, k));
    }
    if (face.length === 3) {
        const pts = face.map((i) => positions[i]);
        return (_jsx("polygon", { points: pts.map((p) => `${p[0]},${p[1]}`).join(" "), fill: color, fillOpacity: 0.3, stroke: color, strokeWidth: 2.5, strokeOpacity: 0.85, pointerEvents: "none" }, k));
    }
    return null;
}
const W = 600;
const H = 600;
const CX = W / 2;
const CY = H / 2;
const LAYOUT_R = 220;
function vertexPos(i, n) {
    if (n === 1)
        return [CX, CY];
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return [CX + LAYOUT_R * Math.cos(angle), CY + LAYOUT_R * Math.sin(angle)];
}
const same = (sel, s) => sel !== null && simplexKey(sel) === simplexKey(s);
function centroid(points) {
    const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
    const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
    return [cx, cy];
}
function midpoint(a, b) {
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}
function isScreenClockwise(p) {
    const cross = (p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) -
        (p[1][1] - p[0][1]) * (p[2][0] - p[0][0]);
    return cross > 0;
}
function ArrowDefs() {
    return (_jsx("defs", { children: _jsx("marker", { id: "arrowhead", viewBox: "0 0 10 10", refX: "9", refY: "5", markerWidth: "6", markerHeight: "6", orient: "auto", children: _jsx("path", { d: "M0,0 L10,5 L0,10 z", fill: "#334155" }) }) }));
}
function EdgeArrow({ from, to }) {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const len = Math.hypot(dx, dy);
    if (len < 1)
        return null;
    const ux = dx / len;
    const uy = dy / len;
    const [mx, my] = midpoint(from, to);
    const L = 9;
    return (_jsx("line", { x1: mx - L * ux, y1: my - L * uy, x2: mx + L * ux, y2: my + L * uy, stroke: "#334155", strokeWidth: 2, markerEnd: "url(#arrowhead)", pointerEvents: "none" }));
}
function FaceArrow({ at, clockwise }) {
    const [cx, cy] = at;
    const r = 20;
    const endX = clockwise ? cx - r : cx + r;
    const d = `M ${cx},${cy - r} A ${r},${r} 0 1,${clockwise ? 1 : 0} ${endX},${cy}`;
    return (_jsx("path", { d: d, fill: "none", stroke: "#334155", strokeWidth: 2, markerEnd: "url(#arrowhead)", pointerEvents: "none" }));
}
function ValueBadge({ x, y, value }) {
    if (value === 0)
        return null;
    const text = value > 0 ? `+${value}` : `${value}`;
    const w = Math.max(22, 10 + text.length * 7);
    return (_jsxs("g", { pointerEvents: "none", children: [_jsx("rect", { x: x - w / 2, y: y - 9, width: w, height: 18, rx: 4, fill: "#fff", stroke: "#475569", strokeWidth: 1 }), _jsx("text", { x: x, y: y, textAnchor: "middle", dy: "0.32em", fontSize: "11", fontFamily: "ui-monospace, monospace", fill: "#0f172a", children: text })] }));
}
function ShadowBadge({ x, y, text }) {
    const w = Math.max(28, 10 + text.length * 7);
    return (_jsxs("g", { pointerEvents: "none", children: [_jsx("rect", { x: x - w / 2, y: y - 9, width: w, height: 18, rx: 4, fill: "#f1f5f9", stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "3 2" }), _jsx("text", { x: x, y: y, textAnchor: "middle", dy: "0.32em", fontSize: "11", fontFamily: "ui-monospace, monospace", fill: "#475569", fontStyle: "italic", children: text })] }));
}
function DDZeroBadge({ x, y }) {
    return (_jsxs("g", { pointerEvents: "none", children: [_jsx("rect", { x: x - 26, y: y - 9, width: 52, height: 18, rx: 4, fill: "#dcfce7", stroke: "#15803d", strokeWidth: 1 }), _jsx("text", { x: x, y: y, textAnchor: "middle", dy: "0.32em", fontSize: "10", fontFamily: "ui-monospace, monospace", fill: "#14532d", fontWeight: 600, children: "\u03B4\u00B2c = 0" })] }));
}
function trianglePresentation(sel, fail) {
    if (sel)
        return { fill: "#facc15", fillOpacity: 0.75, stroke: "#a16207" };
    if (fail)
        return { fill: "#fca5a5", fillOpacity: 0.7, stroke: "#dc2626" };
    return { fill: "#10b981", fillOpacity: 0.28, stroke: "#047857" };
}
function edgePresentation(sel, fail) {
    if (sel)
        return { stroke: "#eab308", strokeWidth: 6 };
    if (fail)
        return { stroke: "#dc2626", strokeWidth: 4 };
    return { stroke: "#475569", strokeWidth: 3 };
}
function tetraPresentation(sel, fail) {
    if (sel)
        return { fill: "#facc15", stroke: "#a16207" };
    if (fail)
        return { fill: "#fca5a5", stroke: "#dc2626" };
    return { fill: "#fbbf24", stroke: "#92400e" };
}
export default function NerveGeomPanel() {
    const nerve = useNerve();
    const selectedSimplex = useStore((s) => s.selectedSimplex);
    const selectSimplex = useStore((s) => s.selectSimplex);
    const cochainValues = useStore((s) => s.cochainValues);
    const showLabels = useStore((s) => s.showLabels);
    const showArrows = useStore((s) => s.showArrows);
    const setShowLabels = useStore((s) => s.setShowLabels);
    const setShowArrows = useStore((s) => s.setShowArrows);
    const showCupProduct = useStore((s) => s.showCupProduct);
    const cupPreviewRaw = useCupResult();
    const cupPreview = showCupProduct ? cupPreviewRaw : null;
    const [hovered, setHovered] = useState(null);
    const ring = useRing();
    const n = nerve.byDim[0]?.length ?? 0;
    const positions = Array.from({ length: n }, (_, i) => vertexPos(i, n));
    const deltaByK = [0, 1, 2].map((kk) => applyCoboundary(cochainValues, nerve, kk, ring));
    const toggle = (s) => selectSimplex(same(selectedSimplex, s) ? null : s);
    const failingAt = (kk, s) => (deltaByK[kk] ?? new Map()).has(simplexKey(s));
    const cVal = (s) => cochainValues.get(simplexKey(s)) ?? ring.zero;
    const dValAt = (kk, s) => (deltaByK[kk] ?? new Map()).get(simplexKey(s)) ?? ring.zero;
    const cupVal = (s) => cupPreview?.result.values.get(simplexKey(s)) ?? ring.zero;
    const cupResultDim = cupPreview?.result.degree ?? -1;
    const hoverIsCupSimplex = hovered !== null && hovered.length - 1 === cupResultDim && cupPreview !== null;
    const hoverFront = hoverIsCupSimplex && cupPreview
        ? hovered.slice(0, cupPreview.leftDegree + 1)
        : null;
    const hoverBack = hoverIsCupSimplex && cupPreview
        ? hovered.slice(cupPreview.leftDegree)
        : null;
    const splitVertex = hoverIsCupSimplex && cupPreview
        ? hovered[cupPreview.leftDegree]
        : null;
    const hoverIn = (s) => setHovered(s);
    const hoverOut = () => setHovered(null);
    return (_jsxs("div", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h2", { children: "Nerve (geometric)" }), _jsxs("div", { className: "panel-toggles", children: [_jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: showLabels, onChange: (e) => setShowLabels(e.target.checked) }), "labels"] }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: showArrows, onChange: (e) => setShowArrows(e.target.checked) }), "arrows"] })] })] }), _jsxs("svg", { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: "xMidYMid meet", children: [_jsx(ArrowDefs, {}), _jsx("rect", { width: W, height: H, fill: "#fafafa" }), (nerve.byDim[2] ?? []).map((t) => {
                        const pts = t.map((i) => positions[i]);
                        const ptsStr = pts.map((p) => `${p[0]},${p[1]}`).join(" ");
                        const p = trianglePresentation(same(selectedSimplex, t), failingAt(1, t));
                        return (_jsx("polygon", { points: ptsStr, fill: p.fill, fillOpacity: p.fillOpacity, stroke: p.stroke, strokeWidth: 2, style: { cursor: "pointer" }, onClick: () => toggle(t), onMouseEnter: () => hoverIn(t), onMouseLeave: hoverOut }, simplexKey(t)));
                    }), (nerve.byDim[1] ?? []).map((e) => {
                        const [a, b] = e.map((i) => positions[i]);
                        const p = edgePresentation(same(selectedSimplex, e), failingAt(0, e));
                        return (_jsx("line", { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: p.stroke, strokeWidth: p.strokeWidth, style: { cursor: "pointer" }, onClick: () => toggle(e), onMouseEnter: () => hoverIn(e), onMouseLeave: hoverOut }, simplexKey(e)));
                    }), positions.map((p, i) => {
                        const sigma = [i];
                        const sel = same(selectedSimplex, sigma);
                        const fill = sel ? "#eab308" : "#1e293b";
                        return (_jsxs("g", { onClick: () => toggle(sigma), style: { cursor: "pointer" }, onMouseEnter: () => hoverIn(sigma), onMouseLeave: hoverOut, children: [_jsx("circle", { cx: p[0], cy: p[1], r: 16, fill: fill, stroke: sel ? "#a16207" : "#0f172a", strokeWidth: 2 }), _jsx("text", { x: p[0], y: p[1], textAnchor: "middle", dy: "0.35em", fontSize: "13", fill: "#fff", pointerEvents: "none", children: i })] }, i));
                    }), (nerve.byDim[3] ?? []).map((t) => {
                        const [tx, ty] = centroid(t.map((i) => positions[i]));
                        const p = tetraPresentation(same(selectedSimplex, t), failingAt(2, t));
                        return (_jsxs("g", { onClick: () => toggle(t), style: { cursor: "pointer" }, onMouseEnter: () => hoverIn(t), onMouseLeave: hoverOut, children: [_jsx("rect", { x: tx - 36, y: ty - 11, width: 72, height: 22, rx: 4, fill: p.fill, fillOpacity: 0.9, stroke: p.stroke, strokeWidth: 1.5 }), _jsx("text", { x: tx, y: ty, textAnchor: "middle", dy: "0.35em", fontSize: "11", fill: "#451a03", pointerEvents: "none", children: `{${t.join(",")}}` })] }, simplexKey(t)));
                    }), showArrows && (nerve.byDim[1] ?? []).map((e) => {
                        const [a, b] = e.map((i) => positions[i]);
                        return _jsx(EdgeArrow, { from: a, to: b }, `arr-${simplexKey(e)}`);
                    }), showArrows && (nerve.byDim[2] ?? []).map((t) => {
                        const pts = t.map((i) => positions[i]);
                        return (_jsx(FaceArrow, { at: centroid(pts), clockwise: isScreenClockwise(pts) }, `farr-${simplexKey(t)}`));
                    }), showLabels && (nerve.byDim[0] ?? []).map((s) => {
                        const v = cVal(s);
                        if (ring.isZero(v))
                            return null;
                        const [px, py] = positions[s[0]];
                        return _jsx(ValueBadge, { x: px + 30, y: py - 16, value: zToInt(v) }, `v-${simplexKey(s)}`);
                    }), showLabels && (nerve.byDim[1] ?? []).map((e) => {
                        const v = cVal(e);
                        if (ring.isZero(v))
                            return null;
                        const [mx, my] = midpoint(positions[e[0]], positions[e[1]]);
                        return _jsx(ValueBadge, { x: mx, y: my - 20, value: zToInt(v) }, `v-${simplexKey(e)}`);
                    }), showLabels && (nerve.byDim[2] ?? []).map((t) => {
                        const v = cVal(t);
                        if (ring.isZero(v))
                            return null;
                        const [cx, cy] = centroid(t.map((i) => positions[i]));
                        return _jsx(ValueBadge, { x: cx, y: cy - 30, value: zToInt(v) }, `v-${simplexKey(t)}`);
                    }), showLabels && (nerve.byDim[1] ?? []).map((e) => {
                        const v = dValAt(0, e);
                        if (ring.isZero(v))
                            return null;
                        const [mx, my] = midpoint(positions[e[0]], positions[e[1]]);
                        return _jsx(ShadowBadge, { x: mx, y: my + 20, text: `δ ${ring.format(v)}` }, `d-${simplexKey(e)}`);
                    }), showLabels && (nerve.byDim[2] ?? []).map((t) => {
                        const v = dValAt(1, t);
                        if (ring.isZero(v))
                            return null;
                        const [cx, cy] = centroid(t.map((i) => positions[i]));
                        return _jsx(ShadowBadge, { x: cx, y: cy + 30, text: `δ ${ring.format(v)}` }, `d-${simplexKey(t)}`);
                    }), showLabels && (nerve.byDim[3] ?? []).map((t) => {
                        const v = dValAt(2, t);
                        if (ring.isZero(v))
                            return null;
                        const [tx, ty] = centroid(t.map((i) => positions[i]));
                        return _jsx(ShadowBadge, { x: tx + 60, y: ty, text: `δ ${ring.format(v)}` }, `d-${simplexKey(t)}`);
                    }), showLabels && deltaByK[0].size > 0 && (nerve.byDim[2] ?? []).map((t) => {
                        const [cx, cy] = centroid(t.map((i) => positions[i]));
                        return _jsx(DDZeroBadge, { x: cx, y: cy }, `dd-${simplexKey(t)}`);
                    }), showLabels && deltaByK[1].size > 0 && (nerve.byDim[3] ?? []).map((t) => {
                        const [tx, ty] = centroid(t.map((i) => positions[i]));
                        return _jsx(DDZeroBadge, { x: tx + 60, y: ty + 20 }, `dd-${simplexKey(t)}`);
                    }), cupPreview && (nerve.byDim[cupResultDim] ?? []).map((s) => {
                        const v = cupVal(s);
                        if (ring.isZero(v))
                            return null;
                        return (_jsx(FaceOverlay, { face: s, positions: positions, color: CUP_COLOR, k: `cup-${simplexKey(s)}` }, `cup-${simplexKey(s)}`));
                    }), hoverIsCupSimplex && hoverBack && (_jsx(FaceOverlay, { face: hoverBack, positions: positions, color: BACK_COLOR, k: "hover-back" })), hoverIsCupSimplex && hoverFront && (_jsx(FaceOverlay, { face: hoverFront, positions: positions, color: FRONT_COLOR, k: "hover-front" })), hoverIsCupSimplex && splitVertex !== null && (() => {
                        const [px, py] = positions[splitVertex];
                        return (_jsx("circle", { cx: px, cy: py, r: 28, fill: "none", stroke: SPLIT_COLOR, strokeWidth: 3, strokeDasharray: "3 3", pointerEvents: "none" }));
                    })(), showLabels && cupPreview && cupResultDim === 0 && (nerve.byDim[0] ?? []).map((s) => {
                        const v = cupVal(s);
                        if (ring.isZero(v))
                            return null;
                        const [px, py] = positions[s[0]];
                        return _jsx(ValueBadge, { x: px - 30, y: py + 22, value: zToInt(v) }, `cv-${simplexKey(s)}`);
                    }), showLabels && cupPreview && cupResultDim === 1 && (nerve.byDim[1] ?? []).map((e) => {
                        const v = cupVal(e);
                        if (ring.isZero(v))
                            return null;
                        const [mx, my] = midpoint(positions[e[0]], positions[e[1]]);
                        return _jsx(ValueBadge, { x: mx, y: my + 20, value: zToInt(v) }, `cv-${simplexKey(e)}`);
                    }), showLabels && cupPreview && cupResultDim === 2 && (nerve.byDim[2] ?? []).map((t) => {
                        const v = cupVal(t);
                        if (ring.isZero(v))
                            return null;
                        const [cx, cy] = centroid(t.map((i) => positions[i]));
                        return _jsx(ValueBadge, { x: cx, y: cy + 28, value: zToInt(v) }, `cv-${simplexKey(t)}`);
                    })] })] }));
}
