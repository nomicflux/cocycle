import { useRef, useState } from "react";
import type { Disc, Simplex, Space } from "../state/types";
import { simplexKey } from "../state/types";
import { useStore } from "../state/store";
import { useNerve, useBasisCochain, useCupResult } from "../state/derived";
import { intersectionPolygon, intersectionCentroid } from "../util/intersectionRegion";
import { spaceTranslates } from "../math/intersection";

const CUR_COLOR = "#0891b2";
const BASIS_COLOR = "#fb7185";
const CUP_COLOR = "#7c3aed";

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

type CochainOverlayProps = {
  discs: Disc[];
  simplices: Simplex[];
  values: Map<string, number>;
  degree: number;
  color: string;
  layer: number;
  toSvgX: (x: number) => number;
  toSvgY: (y: number) => number;
};

function CochainOverlay({
  discs, simplices, values, degree, color, layer, toSvgX, toSvgY,
}: CochainOverlayProps) {
  return (
    <g pointerEvents="none">
      {simplices.map((s) => {
        const v = values.get(simplexKey(s)) ?? 0;
        if (v === 0) return null;
        if (degree === 0) {
          const d = discs[s[0]];
          if (!d) return null;
          const cx = toSvgX(d.cx);
          const cy = toSvgY(d.cy);
          const offset = layer * 14;
          return (
            <g key={`co-${simplexKey(s)}`}>
              <circle cx={cx + offset} cy={cy - 26} r={9}
                fill={color} fillOpacity={0.85} stroke="#fff" strokeWidth={1.5} />
              <text x={cx + offset} y={cy - 26} textAnchor="middle" dy="0.32em"
                fontSize="11" fontFamily="ui-monospace, monospace" fill="#fff">
                {v > 0 ? `+${v}` : `${v}`}
              </text>
            </g>
          );
        }
        if (degree === 1) {
          const [i, j] = s;
          const da = discs[i];
          const db = discs[j];
          if (!da || !db) return null;
          const mid = intersectionCentroid([da, db]);
          if (!mid) return null;
          const mx = toSvgX(mid[0]);
          const my = toSvgY(mid[1]);
          const dxSvg = toSvgX(db.cx) - toSvgX(da.cx);
          const dySvg = toSvgY(db.cy) - toSvgY(da.cy);
          const L = Math.hypot(dxSvg, dySvg);
          if (L < 1) return null;
          const ux = dxSvg / L;
          const uy = dySvg / L;
          const wx = -uy;
          const wy = ux;
          const wallHalf = 16;
          const arrowHalf = 14 + 3 * (Math.abs(v) - 1);
          const sign = v > 0 ? 1 : -1;
          const tailX = mx - arrowHalf * ux * sign;
          const tailY = my - arrowHalf * uy * sign;
          const tipX = mx + arrowHalf * ux * sign;
          const tipY = my + arrowHalf * uy * sign;
          const markerId = `cup-arrow-${color.replace("#", "")}`;
          return (
            <g key={`co-${simplexKey(s)}`}>
              <line
                x1={mx - wallHalf * wx} y1={my - wallHalf * wy}
                x2={mx + wallHalf * wx} y2={my + wallHalf * wy}
                stroke={color} strokeWidth={1.5} strokeOpacity={0.7}
                strokeDasharray="3 3" />
              <line x1={tailX} y1={tailY} x2={tipX} y2={tipY}
                stroke={color} strokeWidth={3 + 0.6 * Math.abs(v)}
                strokeLinecap="round" markerEnd={`url(#${markerId})`} />
              {Math.abs(v) !== 1 && (
                <text x={mx + 14 * wx} y={my + 14 * wy} textAnchor="middle" dy="0.32em"
                  fontSize="11" fontFamily="ui-monospace, monospace"
                  fill={color} stroke="#fff" strokeWidth={3} paintOrder="stroke">
                  {v > 0 ? `+${v}` : `${v}`}
                </text>
              )}
            </g>
          );
        }
        if (degree === 2) {
          const tri = s.map((k) => discs[k]).filter((d): d is Disc => !!d);
          if (tri.length !== 3) return null;
          const c = intersectionCentroid(tri);
          if (!c) return null;
          const cx = toSvgX(c[0]);
          const cy = toSvgY(c[1]);
          const r = 7 + 2 * (Math.abs(v) - 1);
          return (
            <g key={`co-${simplexKey(s)}`}>
              <circle cx={cx} cy={cy} r={r}
                fill={color} fillOpacity={0.9} stroke="#fff" strokeWidth={2} />
              <text x={cx} y={cy} textAnchor="middle" dy="0.32em"
                fontSize="10" fontFamily="ui-monospace, monospace" fill="#fff">
                {v > 0 ? `+${v}` : `${v}`}
              </text>
            </g>
          );
        }
        return null;
      })}
    </g>
  );
}

function ghostsFor(d: Disc, space: Space): Array<{ cx: number; cy: number }> {
  if (space === "planar") return [];
  return spaceTranslates(d, space)
    .filter((t) => t.cx !== d.cx || t.cy !== d.cy)
    .filter(
      (t) =>
        t.cx + d.r >= MATH_MIN && t.cx - d.r <= MATH_MAX &&
        t.cy + d.r >= MATH_MIN && t.cy - d.r <= MATH_MAX,
    )
    .map((t) => ({ cx: t.cx, cy: t.cy }));
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
  const space = useStore((s) => s.space);
  const setSpace = useStore((s) => s.setSpace);
  const showCupProduct = useStore((s) => s.showCupProduct);
  const cohomologyDegree = useStore((s) => s.cohomologyDegree);
  const cochainValues = useStore((s) => s.cochainValues);
  const nerve = useNerve();
  const basisCochain = useBasisCochain();
  const cupPreview = useCupResult();
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
  const hasQuotient = space !== "planar";

  return (
    <div className="panel drawing-panel">
      <div className="panel-header">
        <h2>Open cover (drag = move, drag rim = resize, shift+click = delete)</h2>
        <div className="panel-toggles">
          <label>
            Space:
            <select value={space} onChange={(e) => setSpace(e.target.value as Space)}>
              <option value="planar">Planar</option>
              <option value="torus">Torus</option>
              <option value="klein">Klein bottle</option>
              <option value="projective">Projective (RP²)</option>
            </select>
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
        <defs>
          {[CUR_COLOR, BASIS_COLOR, CUP_COLOR].map((c) => (
            <marker key={c} id={`cup-arrow-${c.replace("#", "")}`}
              viewBox="0 0 10 10" refX="9" refY="5"
              markerWidth="6" markerHeight="6" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill={c} />
            </marker>
          ))}
        </defs>
        <rect width={SVG_SIZE} height={SVG_SIZE} fill="#fafafa" />
        {hasQuotient && (
          <rect
            x={0} y={0} width={SVG_SIZE} height={SVG_SIZE}
            fill="none" stroke="#64748b" strokeWidth={2}
            strokeDasharray="8 6" pointerEvents="none"
          />
        )}
        {discs.map((d, i) => {
          const stroke = darken(d.color);
          const ghosts = ghostsFor(d, space);
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
        {showCupProduct && (
          <CochainOverlay
            discs={discs}
            simplices={nerve.byDim[cohomologyDegree] ?? []}
            values={cochainValues}
            degree={cohomologyDegree}
            color={CUR_COLOR} layer={0}
            toSvgX={toSvgX} toSvgY={toSvgY}
          />
        )}
        {showCupProduct && basisCochain && cupPreview && (
          <CochainOverlay
            discs={discs}
            simplices={nerve.byDim[basisCochain.degree] ?? []}
            values={basisCochain.values}
            degree={basisCochain.degree}
            color={BASIS_COLOR} layer={1}
            toSvgX={toSvgX} toSvgY={toSvgY}
          />
        )}
        {showCupProduct && cupPreview && (
          <CochainOverlay
            discs={discs}
            simplices={nerve.byDim[cupPreview.result.degree] ?? []}
            values={cupPreview.result.values}
            degree={cupPreview.result.degree}
            color={CUP_COLOR} layer={2}
            toSvgX={toSvgX} toSvgY={toSvgY}
          />
        )}
      </svg>
    </div>
  );
}
