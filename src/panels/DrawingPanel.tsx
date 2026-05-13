import { useRef, useState } from "react";
import type { Disc } from "../state/types";
import { useStore } from "../state/store";
import { intersectionPolygon } from "../util/intersectionRegion";
import { TORUS_PERIOD } from "../math/intersection";

const SVG_SIZE = 600;
const MATH_MIN = -6;
const MATH_MAX = 6;

function darken(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = 0.55;
  const to = (v: number) => Math.max(0, Math.round(v * f)).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

const toSvgX = (x: number) => ((x - MATH_MIN) / (MATH_MAX - MATH_MIN)) * SVG_SIZE;
const toSvgY = (y: number) => ((MATH_MAX - y) / (MATH_MAX - MATH_MIN)) * SVG_SIZE;
const toMathX = (sx: number) => MATH_MIN + (sx / SVG_SIZE) * (MATH_MAX - MATH_MIN);
const toMathY = (sy: number) => MATH_MAX - (sy / SVG_SIZE) * (MATH_MAX - MATH_MIN);
const toSvgScale = (d: number) => (d / (MATH_MAX - MATH_MIN)) * SVG_SIZE;

type DragState = { kind: "move" | "resize"; id: string; offsetX?: number; offsetY?: number };

function pointFromEvent(e: React.PointerEvent, svg: SVGSVGElement): [number, number] {
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return [0, 0];
  const local = pt.matrixTransform(ctm.inverse());
  return [toMathX(local.x), toMathY(local.y)];
}

function wrappedGhosts(d: Disc): Array<{ cx: number; cy: number }> {
  const out: Array<{ cx: number; cy: number }> = [];
  for (const sx of [-TORUS_PERIOD, 0, TORUS_PERIOD]) {
    for (const sy of [-TORUS_PERIOD, 0, TORUS_PERIOD]) {
      if (sx === 0 && sy === 0) continue;
      const cx = d.cx + sx;
      const cy = d.cy + sy;
      if (cx + d.r < MATH_MIN || cx - d.r > MATH_MAX) continue;
      if (cy + d.r < MATH_MIN || cy - d.r > MATH_MAX) continue;
      out.push({ cx, cy });
    }
  }
  return out;
}

export default function DrawingPanel() {
  const discs = useStore((s) => s.discs);
  const moveDisc = useStore((s) => s.moveDisc);
  const resizeDisc = useStore((s) => s.resizeDisc);
  const removeDisc = useStore((s) => s.removeDisc);
  const selectedSimplex = useStore((s) => s.selectedSimplex);
  const selectSimplex = useStore((s) => s.selectSimplex);
  const compareWith = useStore((s) => s.compareWithSnapshot);
  const snapshots = useStore((s) => s.snapshots);
  const torusMode = useStore((s) => s.torusMode);
  const setTorusMode = useStore((s) => s.setTorusMode);
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const onDiscPointerDown = (e: React.PointerEvent, d: Disc, idx: number) => {
    e.stopPropagation();
    if (e.shiftKey) { removeDisc(d.id); return; }
    const [mx, my] = pointFromEvent(e, svgRef.current!);
    setDrag({ kind: "move", id: d.id, offsetX: mx - d.cx, offsetY: my - d.cy });
    selectSimplex([idx]);
    svgRef.current?.setPointerCapture(e.pointerId);
  };

  const onHandlePointerDown = (e: React.PointerEvent, d: Disc) => {
    e.stopPropagation();
    setDrag({ kind: "resize", id: d.id });
    svgRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag || !svgRef.current) return;
    const [mx, my] = pointFromEvent(e, svgRef.current);
    if (drag.kind === "move") {
      moveDisc(drag.id, mx - (drag.offsetX ?? 0), my - (drag.offsetY ?? 0));
    } else {
      const d = discs.find((x) => x.id === drag.id);
      if (d) resizeDisc(drag.id, Math.max(0.1, Math.hypot(mx - d.cx, my - d.cy)));
    }
  };

  const onPointerUp = () => setDrag(null);

  const polygon =
    selectedSimplex && selectedSimplex.every((i) => i < discs.length)
      ? intersectionPolygon(selectedSimplex.map((i) => discs[i]))
      : [];

  const cmpDiscs = compareWith ? snapshots.find((s) => s.id === compareWith)?.discs ?? [] : [];

  return (
    <div className="panel drawing-panel">
      <div className="panel-header">
        <h2>Open cover (drag = move, drag rim = resize, shift+click = delete)</h2>
        <div className="panel-toggles">
          <label>
            <input
              type="checkbox"
              checked={torusMode}
              onChange={(e) => setTorusMode(e.target.checked)}
            />
            Torus mode
          </label>
        </div>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        preserveAspectRatio="xMidYMid meet"
      >
        <rect width={SVG_SIZE} height={SVG_SIZE} fill="#fafafa" />
        {torusMode && (
          <rect
            x={0} y={0} width={SVG_SIZE} height={SVG_SIZE}
            fill="none" stroke="#64748b" strokeWidth={2}
            strokeDasharray="8 6" pointerEvents="none"
          />
        )}
        {discs.map((d, i) => {
          const stroke = darken(d.color);
          const ghosts = torusMode ? wrappedGhosts(d) : [];
          return (
            <g key={d.id}>
              {ghosts.map((g, gi) => (
                <circle
                  key={`g-${gi}`}
                  cx={toSvgX(g.cx)} cy={toSvgY(g.cy)} r={toSvgScale(d.r)}
                  fill={d.color} fillOpacity={0.35} stroke={stroke} strokeWidth={1}
                  strokeDasharray="4 3"
                  onPointerDown={(e) => onDiscPointerDown(e, d, i)}
                  style={{ cursor: "grab" }}
                />
              ))}
              <circle
                cx={toSvgX(d.cx)} cy={toSvgY(d.cy)} r={toSvgScale(d.r)}
                fill={d.color} fillOpacity={0.55} stroke={stroke} strokeWidth={1.5}
                onPointerDown={(e) => onDiscPointerDown(e, d, i)}
                style={{ cursor: "grab" }}
              />
              <text
                x={toSvgX(d.cx)} y={toSvgY(d.cy)}
                textAnchor="middle" dy="0.35em" fontSize="14" fill="#111"
                pointerEvents="none"
              >
                {i}
              </text>
              <circle
                cx={toSvgX(d.cx + d.r)} cy={toSvgY(d.cy)} r={5}
                fill={d.color} stroke={stroke} strokeWidth={1}
                onPointerDown={(e) => onHandlePointerDown(e, d)}
                style={{ cursor: "ew-resize" }}
              />
            </g>
          );
        })}
        {cmpDiscs.map((d, i) => (
          <circle
            key={`cmp-${i}`}
            cx={toSvgX(d.cx)} cy={toSvgY(d.cy)} r={toSvgScale(d.r)}
            fill="none" stroke="#475569" strokeWidth={1.5}
            strokeDasharray="6 4" pointerEvents="none"
          />
        ))}
        {polygon.length > 2 && (
          <polygon
            points={polygon.map(([x, y]) => `${toSvgX(x)},${toSvgY(y)}`).join(" ")}
            fill="#facc15" fillOpacity={0.55} stroke="#a16207" strokeWidth={2}
            pointerEvents="none"
          />
        )}
      </svg>
    </div>
  );
}
