import { useStore } from "../state/store";
import { useNerve } from "../state/derived";
import type { Simplex } from "../state/types";
import { simplexKey } from "../state/types";

const W = 600;
const H = 600;
const CX = W / 2;
const CY = H / 2;
const R = 220;

function vertexPos(i: number, n: number): [number, number] {
  if (n === 1) return [CX, CY];
  const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
  return [CX + R * Math.cos(angle), CY + R * Math.sin(angle)];
}

const isSelected = (sel: Simplex | null, s: Simplex): boolean =>
  sel !== null && simplexKey(sel) === simplexKey(s);

export default function NerveGeomPanel() {
  const nerve = useNerve();
  const selectedSimplex = useStore((s) => s.selectedSimplex);
  const selectSimplex = useStore((s) => s.selectSimplex);
  const n = nerve.byDim[0]?.length ?? 0;
  const positions = Array.from({ length: n }, (_, i) => vertexPos(i, n));
  const toggle = (s: Simplex) =>
    selectSimplex(isSelected(selectedSimplex, s) ? null : s);

  return (
    <div className="panel">
      <div className="panel-header"><h2>Nerve (geometric)</h2></div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <rect width={W} height={H} fill="#fafafa" />
        {(nerve.byDim[2] ?? []).map((t) => {
          const pts = t.map((i) => positions[i]).map((p) => `${p[0]},${p[1]}`).join(" ");
          const sel = isSelected(selectedSimplex, t);
          return (
            <polygon
              key={simplexKey(t)} points={pts}
              fill={sel ? "#facc15" : "#10b981"}
              fillOpacity={sel ? 0.75 : 0.28}
              stroke={sel ? "#a16207" : "#047857"} strokeWidth={2}
              style={{ cursor: "pointer" }}
              onClick={() => toggle(t)}
            />
          );
        })}
        {(nerve.byDim[1] ?? []).map((e) => {
          const [a, b] = e.map((i) => positions[i]);
          const sel = isSelected(selectedSimplex, e);
          return (
            <line
              key={simplexKey(e)}
              x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
              stroke={sel ? "#eab308" : "#475569"}
              strokeWidth={sel ? 6 : 3}
              style={{ cursor: "pointer" }}
              onClick={() => toggle(e)}
            />
          );
        })}
        {positions.map((p, i) => {
          const sigma = [i];
          const sel = isSelected(selectedSimplex, sigma);
          return (
            <g key={i} onClick={() => toggle(sigma)} style={{ cursor: "pointer" }}>
              <circle cx={p[0]} cy={p[1]} r={16}
                fill={sel ? "#eab308" : "#1e293b"}
                stroke={sel ? "#a16207" : "#0f172a"} strokeWidth={2} />
              <text
                x={p[0]} y={p[1]}
                textAnchor="middle" dy="0.35em"
                fontSize="13" fill="#fff" pointerEvents="none"
              >
                {i}
              </text>
            </g>
          );
        })}
        {(nerve.byDim[3] ?? []).map((t) => {
          const cx = t.reduce((s, i) => s + positions[i][0], 0) / 4;
          const cy = t.reduce((s, i) => s + positions[i][1], 0) / 4;
          const sel = isSelected(selectedSimplex, t);
          return (
            <g key={simplexKey(t)} onClick={() => toggle(t)} style={{ cursor: "pointer" }}>
              <rect
                x={cx - 36} y={cy - 11} width={72} height={22} rx={4}
                fill={sel ? "#facc15" : "#fbbf24"} fillOpacity={0.9}
                stroke="#92400e" strokeWidth={1.5}
              />
              <text x={cx} y={cy} textAnchor="middle" dy="0.35em"
                fontSize="11" fill="#451a03" pointerEvents="none">
                {`{${t.join(",")}}`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
