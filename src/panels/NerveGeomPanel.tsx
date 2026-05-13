import { useStore } from "../state/store";
import { useNerve, applyCoboundary } from "../state/derived";
import type { Simplex } from "../state/types";
import { simplexKey } from "../state/types";

const W = 600;
const H = 600;
const CX = W / 2;
const CY = H / 2;
const LAYOUT_R = 220;

function vertexPos(i: number, n: number): [number, number] {
  if (n === 1) return [CX, CY];
  const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
  return [CX + LAYOUT_R * Math.cos(angle), CY + LAYOUT_R * Math.sin(angle)];
}

const same = (sel: Simplex | null, s: Simplex): boolean =>
  sel !== null && simplexKey(sel) === simplexKey(s);

function centroid(points: [number, number][]): [number, number] {
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  return [cx, cy];
}

function midpoint(a: [number, number], b: [number, number]): [number, number] {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

function isScreenClockwise(p: [number, number][]): boolean {
  const cross =
    (p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) -
    (p[1][1] - p[0][1]) * (p[2][0] - p[0][0]);
  return cross > 0;
}

function ArrowDefs() {
  return (
    <defs>
      <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5"
        markerWidth="6" markerHeight="6" orient="auto">
        <path d="M0,0 L10,5 L0,10 z" fill="#334155" />
      </marker>
    </defs>
  );
}

function EdgeArrow({ from, to }: { from: [number, number]; to: [number, number] }) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy);
  if (len < 1) return null;
  const ux = dx / len;
  const uy = dy / len;
  const [mx, my] = midpoint(from, to);
  const L = 9;
  return (
    <line
      x1={mx - L * ux} y1={my - L * uy}
      x2={mx + L * ux} y2={my + L * uy}
      stroke="#334155" strokeWidth={2}
      markerEnd="url(#arrowhead)"
      pointerEvents="none"
    />
  );
}

function FaceArrow({ at, clockwise }: { at: [number, number]; clockwise: boolean }) {
  const [cx, cy] = at;
  const r = 20;
  const endX = clockwise ? cx - r : cx + r;
  const d = `M ${cx},${cy - r} A ${r},${r} 0 1,${clockwise ? 1 : 0} ${endX},${cy}`;
  return (
    <path d={d} fill="none" stroke="#334155" strokeWidth={2}
      markerEnd="url(#arrowhead)" pointerEvents="none" />
  );
}

function ValueBadge({ x, y, value }: { x: number; y: number; value: number }) {
  if (value === 0) return null;
  const text = value > 0 ? `+${value}` : `${value}`;
  const w = Math.max(22, 10 + text.length * 7);
  return (
    <g pointerEvents="none">
      <rect x={x - w / 2} y={y - 9} width={w} height={18} rx={4}
        fill="#fff" stroke="#475569" strokeWidth={1} />
      <text x={x} y={y} textAnchor="middle" dy="0.32em"
        fontSize="11" fontFamily="ui-monospace, monospace" fill="#0f172a">
        {text}
      </text>
    </g>
  );
}

function trianglePresentation(sel: boolean, fail: boolean) {
  if (sel) return { fill: "#facc15", fillOpacity: 0.75, stroke: "#a16207" };
  if (fail) return { fill: "#fca5a5", fillOpacity: 0.7, stroke: "#dc2626" };
  return { fill: "#10b981", fillOpacity: 0.28, stroke: "#047857" };
}

function edgePresentation(sel: boolean, fail: boolean) {
  if (sel) return { stroke: "#eab308", strokeWidth: 6 };
  if (fail) return { stroke: "#dc2626", strokeWidth: 4 };
  return { stroke: "#475569", strokeWidth: 3 };
}

function tetraPresentation(sel: boolean, fail: boolean) {
  if (sel) return { fill: "#facc15", stroke: "#a16207" };
  if (fail) return { fill: "#fca5a5", stroke: "#dc2626" };
  return { fill: "#fbbf24", stroke: "#92400e" };
}

export default function NerveGeomPanel() {
  const nerve = useNerve();
  const selectedSimplex = useStore((s) => s.selectedSimplex);
  const selectSimplex = useStore((s) => s.selectSimplex);
  const k = useStore((s) => s.cohomologyDegree);
  const cochainValues = useStore((s) => s.cochainValues);
  const showLabels = useStore((s) => s.showLabels);
  const showArrows = useStore((s) => s.showArrows);
  const setShowLabels = useStore((s) => s.setShowLabels);
  const setShowArrows = useStore((s) => s.setShowArrows);

  const n = nerve.byDim[0]?.length ?? 0;
  const positions = Array.from({ length: n }, (_, i) => vertexPos(i, n));
  const delta = applyCoboundary(cochainValues, nerve, k);

  const toggle = (s: Simplex) => selectSimplex(same(selectedSimplex, s) ? null : s);
  const failing = (s: Simplex): boolean => delta.has(simplexKey(s));
  const cVal = (s: Simplex): number => cochainValues.get(simplexKey(s)) ?? 0;
  const dVal = (s: Simplex): number => delta.get(simplexKey(s)) ?? 0;

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Nerve (geometric)</h2>
        <div className="panel-toggles">
          <label>
            <input type="checkbox" checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)} />
            labels
          </label>
          <label>
            <input type="checkbox" checked={showArrows}
              onChange={(e) => setShowArrows(e.target.checked)} />
            arrows
          </label>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <ArrowDefs />
        <rect width={W} height={H} fill="#fafafa" />

        {(nerve.byDim[2] ?? []).map((t) => {
          const pts = t.map((i) => positions[i]);
          const ptsStr = pts.map((p) => `${p[0]},${p[1]}`).join(" ");
          const p = trianglePresentation(same(selectedSimplex, t), k === 1 && failing(t));
          return (
            <polygon
              key={simplexKey(t)} points={ptsStr}
              fill={p.fill} fillOpacity={p.fillOpacity}
              stroke={p.stroke} strokeWidth={2}
              style={{ cursor: "pointer" }} onClick={() => toggle(t)}
            />
          );
        })}

        {(nerve.byDim[1] ?? []).map((e) => {
          const [a, b] = e.map((i) => positions[i]);
          const p = edgePresentation(same(selectedSimplex, e), k === 0 && failing(e));
          return (
            <line
              key={simplexKey(e)}
              x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
              stroke={p.stroke} strokeWidth={p.strokeWidth}
              style={{ cursor: "pointer" }} onClick={() => toggle(e)}
            />
          );
        })}

        {positions.map((p, i) => {
          const sigma = [i];
          const sel = same(selectedSimplex, sigma);
          const fail = k === 0 && failing(sigma);
          const fill = sel ? "#eab308" : fail ? "#dc2626" : "#1e293b";
          return (
            <g key={i} onClick={() => toggle(sigma)} style={{ cursor: "pointer" }}>
              <circle cx={p[0]} cy={p[1]} r={16}
                fill={fill}
                stroke={sel ? "#a16207" : "#0f172a"} strokeWidth={2} />
              <text x={p[0]} y={p[1]} textAnchor="middle" dy="0.35em"
                fontSize="13" fill="#fff" pointerEvents="none">{i}</text>
            </g>
          );
        })}

        {(nerve.byDim[3] ?? []).map((t) => {
          const [tx, ty] = centroid(t.map((i) => positions[i]));
          const p = tetraPresentation(same(selectedSimplex, t), k === 2 && failing(t));
          return (
            <g key={simplexKey(t)} onClick={() => toggle(t)} style={{ cursor: "pointer" }}>
              <rect x={tx - 36} y={ty - 11} width={72} height={22} rx={4}
                fill={p.fill} fillOpacity={0.9} stroke={p.stroke} strokeWidth={1.5} />
              <text x={tx} y={ty} textAnchor="middle" dy="0.35em"
                fontSize="11" fill="#451a03" pointerEvents="none">
                {`{${t.join(",")}}`}
              </text>
            </g>
          );
        })}

        {showArrows && (nerve.byDim[1] ?? []).map((e) => {
          const [a, b] = e.map((i) => positions[i]);
          return <EdgeArrow key={`arr-${simplexKey(e)}`} from={a} to={b} />;
        })}
        {showArrows && (nerve.byDim[2] ?? []).map((t) => {
          const pts = t.map((i) => positions[i]);
          return (
            <FaceArrow
              key={`farr-${simplexKey(t)}`}
              at={centroid(pts)}
              clockwise={isScreenClockwise(pts)}
            />
          );
        })}

        {showLabels && k === 0 && (nerve.byDim[0] ?? []).map((s) => {
          const v = cVal(s);
          if (v === 0) return null;
          const [px, py] = positions[s[0]];
          return <ValueBadge key={`v-${simplexKey(s)}`} x={px + 30} y={py - 16} value={v} />;
        })}
        {showLabels && k === 1 && (nerve.byDim[1] ?? []).map((e) => {
          const v = cVal(e);
          if (v === 0) return null;
          const [mx, my] = midpoint(positions[e[0]], positions[e[1]]);
          return <ValueBadge key={`v-${simplexKey(e)}`} x={mx} y={my - 20} value={v} />;
        })}
        {showLabels && k === 2 && (nerve.byDim[2] ?? []).map((t) => {
          const v = cVal(t);
          if (v === 0) return null;
          const [cx, cy] = centroid(t.map((i) => positions[i]));
          return <ValueBadge key={`v-${simplexKey(t)}`} x={cx} y={cy - 30} value={v} />;
        })}

        {showLabels && k === 0 && (nerve.byDim[1] ?? []).map((e) => {
          const v = dVal(e);
          if (v === 0) return null;
          const [mx, my] = midpoint(positions[e[0]], positions[e[1]]);
          return <ValueBadge key={`d-${simplexKey(e)}`} x={mx} y={my - 20} value={v} />;
        })}
        {showLabels && k === 1 && (nerve.byDim[2] ?? []).map((t) => {
          const v = dVal(t);
          if (v === 0) return null;
          const [cx, cy] = centroid(t.map((i) => positions[i]));
          return <ValueBadge key={`d-${simplexKey(t)}`} x={cx} y={cy - 30} value={v} />;
        })}
        {showLabels && k === 2 && (nerve.byDim[3] ?? []).map((t) => {
          const v = dVal(t);
          if (v === 0) return null;
          const [tx, ty] = centroid(t.map((i) => positions[i]));
          return <ValueBadge key={`d-${simplexKey(t)}`} x={tx + 60} y={ty} value={v} />;
        })}
      </svg>
    </div>
  );
}
