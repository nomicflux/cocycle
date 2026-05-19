import { useRef, useState } from "react";
import type { Disc, Simplex, Space } from "../state/types";
import { simplexKey } from "../state/types";
import { useStore } from "../state/store";
import { useNerve, useBasisCochain, useCupResult, useRing } from "../state/derived";
import type { Ring, RingElement } from "../math/ring";
import { signedFormat, zToInt } from "../math/ring";
import { intersectionCentroid, intersectionComponents } from "../util/intersectionRegion";
import { spaceTranslates } from "../math/intersection";
import { deckElements } from "../math/deck";

const COMPONENT_COLORS: Array<[string, string]> = [
  ["#facc15", "#a16207"],
  ["#06b6d4", "#0e7490"],
  ["#ec4899", "#be185d"],
  ["#22c55e", "#15803d"],
  ["#a855f7", "#7e22ce"],
  ["#f97316", "#9a3412"],
];

// Render the deck-orbit of a cover-component polygon in the viewing window.
// Each deck element g ∈ Γ acts on a vertex (x, y) as (g.sx·x + g.tx,
// g.sy·y + g.ty); applying it to every vertex of the canonical polygon
// gives that polygon's image at the Γ-translate. Wedge2 has no R²-acting
// deck group; its intersection polygons come out of `intersectionComponents`
// already enumerated over chart-translates, so no further multiplication.
function polygonLatticeRenders(
  poly: Array<[number, number]>,
  space: Space,
): Array<Array<[number, number]>> {
  if (space === "planar" || space === "wedge2") return [poly];
  const out: Array<Array<[number, number]>> = [];
  for (const g of deckElements(space)) {
    const transformed = poly.map(
      ([x, y]) => [g.sx * x + g.tx, g.sy * y + g.ty] as [number, number],
    );
    const xs = transformed.map((p) => p[0]);
    const ys = transformed.map((p) => p[1]);
    const inBox =
      Math.max(...xs) >= MATH_MIN && Math.min(...xs) <= MATH_MAX &&
      Math.max(...ys) >= MATH_MIN && Math.min(...ys) <= MATH_MAX;
    if (inBox) out.push(transformed);
  }
  return out;
}

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
  values: Map<string, RingElement>;
  degree: number;
  color: string;
  layer: number;
  ring: Ring;
  toSvgX: (x: number) => number;
  toSvgY: (y: number) => number;
};

function CochainOverlay({
  discs, simplices, values, degree, color, layer, ring, toSvgX, toSvgY,
}: CochainOverlayProps) {
  return (
    <g pointerEvents="none">
      {simplices.map((s) => {
        const elem = values.get(simplexKey(s));
        if (elem === undefined || ring.isZero(elem)) return null;
        const v = zToInt(elem);
        const label = signedFormat(ring, elem);
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
                {label}
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
                  {label}
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
                {label}
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
  const ring = useRing();
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

  const components =
    selectedSimplex && selectedSimplex.length >= 2 && selectedSimplex.every((i) => i < discs.length)
      ? intersectionComponents(space, selectedSimplex.map((i) => discs[i]))
      : [];

  const cmpDiscs = compareWith ? snapshots.find((s) => s.id === compareWith)?.discs ?? [] : [];
  const hasQuotient = space !== "planar";

  const selectedDiscIdx =
    selectedSimplex && selectedSimplex.length === 1 && selectedSimplex[0] < discs.length
      ? selectedSimplex[0]
      : -1;
  const renderOrder: number[] = [];
  for (let i = 0; i < discs.length; i++) {
    if (i !== selectedDiscIdx) renderOrder.push(i);
  }
  if (selectedDiscIdx >= 0) renderOrder.push(selectedDiscIdx);

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
              <option value="wedge2">Wedge S²∨S¹∨S¹</option>
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
        {hasQuotient && space !== "wedge2" && (
          <rect
            x={0} y={0} width={SVG_SIZE} height={SVG_SIZE}
            fill="none" stroke="#64748b" strokeWidth={2}
            strokeDasharray="8 6" pointerEvents="none"
          />
        )}
        {space === "wedge2" && (
          <g pointerEvents="none">
            <line x1={toSvgX(-2)} y1={0} x2={toSvgX(-2)} y2={SVG_SIZE}
              stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="6 4" />
            <line x1={toSvgX(2)} y1={0} x2={toSvgX(2)} y2={SVG_SIZE}
              stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="6 4" />
            <circle cx={toSvgX(0)} cy={toSvgY(3)} r={toSvgScale(3)}
              fill="none" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="6 4" />
            <circle cx={toSvgX(0)} cy={toSvgY(-3)} r={toSvgScale(0.8)}
              fill="none" stroke="#475569" strokeWidth={1.5} strokeDasharray="3 3" />
            <text x={toSvgX(-4)} y={toSvgY(-5.2)} textAnchor="middle"
              fontSize="14" fontFamily="ui-sans-serif, system-ui"
              fill="#475569" stroke="#fff" strokeWidth={3} paintOrder="stroke">S¹</text>
            <text x={toSvgX(0)} y={toSvgY(5.5)} textAnchor="middle"
              fontSize="14" fontFamily="ui-sans-serif, system-ui"
              fill="#475569" stroke="#fff" strokeWidth={3} paintOrder="stroke">S²</text>
            <text x={toSvgX(4)} y={toSvgY(-5.2)} textAnchor="middle"
              fontSize="14" fontFamily="ui-sans-serif, system-ui"
              fill="#475569" stroke="#fff" strokeWidth={3} paintOrder="stroke">S¹</text>
            <text x={toSvgX(0)} y={toSvgY(-3) + 4} textAnchor="middle"
              fontSize="10" fontFamily="ui-sans-serif, system-ui"
              fill="#64748b" stroke="#fff" strokeWidth={2} paintOrder="stroke">basepoint</text>
          </g>
        )}
        {renderOrder.map((i) => {
          const d = discs[i];
          const stroke = darken(d.color);
          const ghosts = ghostsFor(d, space);
          const isBasepoint = d.region === "basepoint";
          const discStroke = isBasepoint ? "#0f172a" : stroke;
          const discStrokeWidth = isBasepoint ? 3 : 1.5;
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
                fill={d.color} fillOpacity={0.55} stroke={discStroke} strokeWidth={discStrokeWidth}
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
        {components.map((poly, idx) => {
          const [fill, stroke] = COMPONENT_COLORS[idx % COMPONENT_COLORS.length];
          const renders = polygonLatticeRenders(poly, space);
          return (
            <g key={`comp-${idx}`} pointerEvents="none">
              {renders.map((rp, ri) => (
                <polygon
                  key={`comp-${idx}-${ri}`}
                  points={rp.map(([x, y]) => `${toSvgX(x)},${toSvgY(y)}`).join(" ")}
                  fill={fill} fillOpacity={0.55} stroke={stroke} strokeWidth={2}
                />
              ))}
              {renders.map((rp, ri) => {
                const rcx = rp.reduce((s, p) => s + p[0], 0) / rp.length;
                const rcy = rp.reduce((s, p) => s + p[1], 0) / rp.length;
                if (rcx < MATH_MIN || rcx > MATH_MAX || rcy < MATH_MIN || rcy > MATH_MAX) return null;
                return (
                  <text
                    key={`comp-label-${idx}-${ri}`}
                    x={toSvgX(rcx)} y={toSvgY(rcy)}
                    textAnchor="middle" dy="0.32em"
                    fontSize="11" fontFamily="ui-monospace, monospace"
                    fill={stroke} stroke="#fff" strokeWidth={3} paintOrder="stroke"
                  >
                    C{idx + 1}
                  </text>
                );
              })}
            </g>
          );
        })}
        {components.length > 0 && (() => {
          const first = components[0];
          const fcx = first.reduce((s, p) => s + p[0], 0) / first.length;
          const fcy = first.reduce((s, p) => s + p[1], 0) / first.length;
          return (
            <text
              x={toSvgX(fcx)} y={toSvgY(fcy) - 28}
              textAnchor="middle"
              fontSize="12" fontFamily="ui-sans-serif, system-ui"
              fill="#0f172a" stroke="#fff" strokeWidth={3} paintOrder="stroke"
              pointerEvents="none"
            >
              {components.length === 1
                ? "intersection: 1 component"
                : `intersection: ${components.length} components`}
            </text>
          );
        })()}
        {showCupProduct && (
          <CochainOverlay
            discs={discs}
            simplices={nerve.byDim[cohomologyDegree] ?? []}
            values={cochainValues}
            degree={cohomologyDegree}
            color={CUR_COLOR} layer={0}
            ring={ring}
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
            ring={ring}
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
            ring={ring}
            toSvgX={toSvgX} toSvgY={toSvgY}
          />
        )}
      </svg>
    </div>
  );
}
