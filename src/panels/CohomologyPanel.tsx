import { useEffect, useRef, useState } from "react";
import { useStore } from "../state/store";
import {
  useNerve,
  useCohomology,
  useCupResult,
  useUnlocked,
  useDeltaShadow,
  useIsCoboundary,
  useClassCoordinates,
  useRing,
  applyCoboundary,
} from "../state/derived";
import type { Simplex, SimplexKey } from "../state/types";
import { simplexKey } from "../state/types";
import { faces } from "../math/coboundary";
import type { Ring, RingElement, RingSpec } from "../math/ring";
import type { CohomologyDegree } from "../state/store";

const SUPS = ["⁰", "¹", "²", "³"];
function sup(n: number): string { return SUPS[n] ?? String(n); }

function ringSymbol(spec: RingSpec): { name: string; needsParens: boolean } {
  switch (spec.kind) {
    case "Z":  return { name: "ℤ",        needsParens: false };
    case "Zp": return { name: `ℤ/${spec.p}`, needsParens: true };
    case "Q":  return { name: "ℚ",        needsParens: false };
    case "Zi": return { name: "ℤ[i]",     needsParens: false };
    case "Zw": return { name: "ℤ[ω]",     needsParens: false };
  }
}

function formatGroup(rank: number, torsion: number[], spec: RingSpec): string {
  const { name, needsParens } = ringSymbol(spec);
  const parts: string[] = [];
  if (rank > 0) {
    parts.push(
      rank === 1 ? name : needsParens ? `(${name})^${rank}` : `${name}^${rank}`,
    );
  }
  for (const t of torsion) parts.push(`${name}/${t}`);
  return parts.length ? parts.join(" ⊕ ") : "0";
}

function termFormat(ring: Ring, x: RingElement, leading: boolean): string {
  if (leading) return ring.format(x);
  const isNeg = ring.isPositive(ring.neg(x));
  const mag = isNeg ? ring.neg(x) : x;
  return `${isNeg ? "− " : "+ "}${ring.format(mag)}`;
}

function ringSpecKey(spec: RingSpec): string {
  return spec.kind === "Zp" ? `Zp:${spec.p}` : spec.kind;
}

function keyToRingSpec(key: string): RingSpec {
  if (key.startsWith("Zp:")) return { kind: "Zp", p: parseInt(key.slice(3), 10) };
  if (key === "Z" || key === "Q" || key === "Zi" || key === "Zw") return { kind: key };
  return { kind: "Z" };
}

function RingPicker() {
  const ring = useStore((s) => s.ring);
  const setRing = useStore((s) => s.setRing);
  return (
    <label className="ring-picker">
      Coefficients:
      <select
        value={ringSpecKey(ring)}
        onChange={(e) => setRing(keyToRingSpec(e.target.value))}
      >
        <option value="Z">ℤ</option>
        <option value="Zp:2">ℤ/2</option>
        <option value="Zp:3">ℤ/3</option>
        <option value="Zp:4">ℤ/4</option>
        <option value="Zp:5">ℤ/5</option>
        <option value="Zp:6">ℤ/6</option>
        <option value="Zp:7">ℤ/7</option>
        <option value="Zp:8">ℤ/8</option>
        <option value="Zp:9">ℤ/9</option>
        <option value="Zp:12">ℤ/12</option>
        <option value="Q">ℚ</option>
        <option value="Zi">ℤ[i]</option>
        <option value="Zw">ℤ[ω]</option>
      </select>
    </label>
  );
}

function CochainInput({
  value, ring, onCommit,
}: { value: RingElement; ring: Ring; onCommit: (v: RingElement) => void }) {
  const shape = ring.inputShape();
  switch (shape.kind) {
    case "integer":
      return <IntegerInput value={value} ring={ring} onCommit={onCommit} />;
    case "fraction":
      return <FractionInput value={value} ring={ring} onCommit={onCommit} />;
    case "mod-cycle":
      return <ModCycleInput value={value} p={shape.p} ring={ring} onCommit={onCommit} />;
    case "complex":
      return <ComplexInput value={value} imagSymbol={shape.imagSymbol} onCommit={onCommit} />;
  }
}

function IntegerInput({
  value, ring, onCommit,
}: { value: RingElement; ring: Ring; onCommit: (v: RingElement) => void }) {
  const [text, setText] = useState(String(value[0]));
  const lastSynced = useRef(String(value[0]));
  useEffect(() => {
    const s = String(value[0]);
    if (s !== lastSynced.current) {
      setText(s);
      lastSynced.current = s;
    }
  }, [value]);
  return (
    <input
      className="cochain-input cochain-input--integer"
      type="number"
      inputMode="numeric"
      value={text}
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        if (next === "" || next === "-") {
          onCommit(ring.fromInt(0));
          lastSynced.current = "0";
          return;
        }
        const v = parseInt(next, 10);
        if (Number.isFinite(v)) {
          onCommit(ring.fromInt(v));
          lastSynced.current = String(v);
        }
      }}
    />
  );
}

function FractionInput({
  value, ring, onCommit,
}: { value: RingElement; ring: Ring; onCommit: (v: RingElement) => void }) {
  const [num, den] = value;
  const [numText, setNumText] = useState(String(num));
  const [denText, setDenText] = useState(String(den));
  const lastSynced = useRef({ num: String(num), den: String(den) });
  useEffect(() => {
    const ns = String(num), ds = String(den);
    if (ns !== lastSynced.current.num || ds !== lastSynced.current.den) {
      setNumText(ns); setDenText(ds);
      lastSynced.current = { num: ns, den: ds };
    }
  }, [num, den]);
  const tryCommit = (nStr: string, dStr: string) => {
    const n = nStr === "" || nStr === "-" ? 0 : parseInt(nStr, 10);
    const d = dStr === "" ? 1 : parseInt(dStr, 10);
    if (!Number.isFinite(n) || !Number.isFinite(d) || d < 1) return;
    const parsed = ring.parse(`${n}/${d}`);
    if (parsed !== null) {
      onCommit(parsed);
      lastSynced.current = { num: String(parsed[0]), den: String(parsed[1]) };
    }
  };
  const snapOnBlur = () => {
    let n = numText === "" || numText === "-" ? 0 : parseInt(numText, 10);
    let d = denText === "" ? 1 : parseInt(denText, 10);
    if (!Number.isFinite(n)) n = 0;
    if (!Number.isFinite(d) || d < 1) d = 1;
    const parsed = ring.parse(`${n}/${d}`);
    if (parsed === null) return;
    setNumText(String(parsed[0]));
    setDenText(String(parsed[1]));
    onCommit(parsed);
    lastSynced.current = { num: String(parsed[0]), den: String(parsed[1]) };
  };
  return (
    <span className="cochain-input cochain-input--fraction">
      <input
        type="number" inputMode="numeric" value={numText}
        onChange={(e) => { setNumText(e.target.value); tryCommit(e.target.value, denText); }}
        onBlur={snapOnBlur}
      />
      <span className="fraction-bar">/</span>
      <input
        type="number" inputMode="numeric" min="1" value={denText}
        onChange={(e) => { setDenText(e.target.value); tryCommit(numText, e.target.value); }}
        onBlur={snapOnBlur}
      />
    </span>
  );
}

function ModCycleInput({
  value, p, ring, onCommit,
}: { value: RingElement; p: number; ring: Ring; onCommit: (v: RingElement) => void }) {
  const v = value[0];
  const goPrev = () => onCommit(ring.fromInt((v - 1 + p) % p));
  const goNext = () => onCommit(ring.fromInt((v + 1) % p));
  return (
    <span className="cochain-input cochain-input--mod-cycle">
      <button type="button" onClick={goPrev} title="previous">◀</button>
      <span className="mod-cycle-value">{v}</span>
      <button type="button" onClick={goNext} title="next">▶</button>
    </span>
  );
}

function ComplexInput({
  value, imagSymbol, onCommit,
}: { value: RingElement; imagSymbol: "i" | "ω"; onCommit: (v: RingElement) => void }) {
  const [a, b] = value;
  const [aText, setAText] = useState(String(a));
  const [bText, setBText] = useState(String(b));
  const lastSynced = useRef({ a: String(a), b: String(b) });
  useEffect(() => {
    const as = String(a), bs = String(b);
    if (as !== lastSynced.current.a || bs !== lastSynced.current.b) {
      setAText(as); setBText(bs);
      lastSynced.current = { a: as, b: bs };
    }
  }, [a, b]);
  const commit = (aStr: string, bStr: string) => {
    const an = aStr === "" || aStr === "-" ? 0 : parseInt(aStr, 10);
    const bn = bStr === "" || bStr === "-" ? 0 : parseInt(bStr, 10);
    if (!Number.isFinite(an) || !Number.isFinite(bn)) return;
    onCommit([an, bn]);
    lastSynced.current = { a: String(an), b: String(bn) };
  };
  return (
    <span className="cochain-input cochain-input--complex">
      <input
        type="number" inputMode="numeric" value={aText}
        onChange={(e) => { setAText(e.target.value); commit(e.target.value, bText); }}
      />
      <span className="complex-plus"> + </span>
      <input
        type="number" inputMode="numeric" value={bText}
        onChange={(e) => { setBText(e.target.value); commit(aText, e.target.value); }}
      />
      <span className="complex-imag-sym">{imagSymbol}</span>
    </span>
  );
}

type PairLeft = 0 | 1;

function PairSelector({
  pair, setPair, minPair, maxPair,
}: {
  pair: PairLeft; setPair: (p: PairLeft) => void;
  minPair: PairLeft; maxPair: PairLeft;
}) {
  const goPrev = () => { if (pair > minPair) setPair((pair - 1) as PairLeft); };
  const goNext = () => { if (pair < maxPair) setPair((pair + 1) as PairLeft); };
  return (
    <div className="pair-selector">
      <button onClick={goPrev} disabled={pair <= minPair}>◀</button>
      <span className="pair-label">Focus: C{sup(pair)} → C{sup(pair + 1)}</span>
      <button onClick={goNext} disabled={pair >= maxPair}>▶</button>
    </div>
  );
}

function FaceTerm({ sign, face, leading, onClick }: {
  sign: number; face: Simplex; leading: boolean; onClick: () => void;
}) {
  const op = leading ? (sign > 0 ? "" : "−") : sign > 0 ? "+ " : "− ";
  return (
    <span className="delta-eq-term">
      {op}c(<button className="face-chip" onClick={onClick}>{`{${face.join(",")}}`}</button>)
    </span>
  );
}

function ValueTerm({
  sign, value, leading, ring,
}: { sign: number; value: RingElement; leading: boolean; ring: Ring }) {
  const product = ring.mul(ring.fromInt(sign), value);
  return <span className="delta-eq-num">{termFormat(ring, product, leading)}</span>;
}

function DeltaEquationRows({ fromK }: { fromK: number }) {
  const nerve = useNerve();
  const ring = useRing();
  const cochainValues = useStore((s) => s.cochainValues);
  const selectSimplex = useStore((s) => s.selectSimplex);
  const targets = nerve.byDim[fromK + 1] ?? [];
  if (targets.length === 0) {
    return <div className="hint">no {fromK + 1}-simplices</div>;
  }
  return (
    <div className="delta-eq-list">
      {targets.map((tau) => {
        const fs = faces(tau);
        const parts = fs.map(({ face, sign }) => ({
          face, sign, v: cochainValues.get(simplexKey(face)) ?? ring.zero,
        }));
        const sum = parts.reduce<RingElement>(
          (a, p) => ring.add(a, ring.mul(ring.fromInt(p.sign), p.v)),
          ring.zero,
        );
        const sumIsZero = ring.isZero(sum);
        return (
          <div key={simplexKey(tau)} className="delta-eq-row">
            <code className="delta-eq-target">δc({`{${tau.join(",")}}`})</code>
            <span>=</span>
            <span className="delta-eq-symbolic">
              {parts.map((p, i) => (
                <FaceTerm
                  key={i}
                  sign={p.sign}
                  face={p.face}
                  leading={i === 0}
                  onClick={() => selectSimplex(p.face)}
                />
              ))}
            </span>
            <span>=</span>
            <span className="delta-eq-numeric">
              {parts.map((p, i) => (
                <ValueTerm key={i} sign={p.sign} value={p.v} leading={i === 0} ring={ring} />
              ))}
            </span>
            <span>=</span>
            <span className={`delta-eq-result ${sumIsZero ? "delta-eq-result--zero" : "delta-eq-result--nonzero"}`}>
              {ring.format(sum)} {sumIsZero ? "✓" : "✗"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LayerEditor({ k }: { k: CohomologyDegree }) {
  const nerve = useNerve();
  const ring = useRing();
  const cochainValues = useStore((s) => s.cochainValues);
  const setCochainValue = useStore((s) => s.setCochainValue);
  const shadow = useDeltaShadow(k);
  const simplices = nerve.byDim[k] ?? [];
  const showShadow = k > 0;
  if (simplices.length === 0) return <div className="hint">no {k}-simplices</div>;
  return (
    <div className="cochain-editor">
      {showShadow && (
        <div className="cochain-row cochain-row--shadow shadow-row--header">
          <span>simplex</span>
          <span>c{sup(k)}</span>
          <span>δc{sup(k - 1)} (shadow)</span>
        </div>
      )}
      {simplices.map((s) => {
        const key = simplexKey(s);
        const v = cochainValues.get(key) ?? ring.zero;
        const sh = shadow.get(key) ?? ring.zero;
        const hasShadow = shadow.has(key);
        const matches = showShadow && hasShadow && ring.eq(v, sh);
        return (
          <div key={key} className={`cochain-row${showShadow ? " cochain-row--shadow" : ""}`}>
            <code>{`{${s.join(",")}}`}</code>
            <CochainInput value={v} ring={ring} onCommit={(nv) => setCochainValue(s, nv)} />
            {showShadow && (
              <span className={`shadow-cell${matches ? " shadow-cell--match" : ""}`}>
                {hasShadow ? ring.format(sh) : "·"}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LayerStatus({ k }: { k: CohomologyDegree }) {
  const nerve = useNerve();
  const ring = useRing();
  const cochainValues = useStore((s) => s.cochainValues);
  const isCo = useIsCoboundary(k);
  const delta = applyCoboundary(cochainValues, nerve, k, ring);
  const isCocycle = delta.size === 0;
  return (
    <div className="layer-status">
      <span>
        c{sup(k)} ∈ Z{sup(k)}?{" "}
        <span className={isCocycle ? "anno-yes" : "anno-no"}>{isCocycle ? "✓" : "✗"}</span>
      </span>
      <span>
        c{sup(k)} ∈ B{sup(k)}?{" "}
        <span className={isCo ? "anno-yes" : "anno-no"}>{isCo ? "✓" : "✗"}</span>
      </span>
    </div>
  );
}

function CohomologyChip({ k }: { k: CohomologyDegree }) {
  const cohK = useCohomology(k);
  const coords = useClassCoordinates(k);
  const ring = useRing();
  const ringSpec = useStore((s) => s.ring);
  const applyCochain = useStore((s) => s.applyCochain);
  const clearCochain = useStore((s) => s.clearCochain);
  const setCohomologyDegree = useStore((s) => s.setCohomologyDegree);
  const setBasisCursor = useStore((s) => s.setBasisCursor);
  const [pos, setPos] = useState<number>(-1);

  const generators = cohK.cocycleBasis.filter((c) => !c.isCoboundary);
  const N = generators.length;
  const hText = formatGroup(cohK.rank, cohK.torsion, ringSpec);
  const coordsText =
    coords === null
      ? null
      : coords.length === 0
        ? null
        : `[${coords.map((x) => ring.format(x)).join(", ")}]`;

  useEffect(() => { if (pos >= N) setPos(-1); }, [N, pos]);

  const goto = (next: number) => {
    if (N === 0) return;
    const cycleLen = N + 1;
    const cycled = (((next + 1) % cycleLen) + cycleLen) % cycleLen - 1;
    setPos(cycled);
    setBasisCursor(cycled);
    setCohomologyDegree(k);
    if (cycled === -1) clearCochain();
    else applyCochain(k, generators[cycled].cochain.values);
  };

  const posLabel = pos === -1 ? "0" : `g${pos + 1}`;
  const clearLocal = () => {
    setPos(-1);
    setBasisCursor(-1);
    setCohomologyDegree(k);
    clearCochain();
  };

  return (
    <div className="h-chip-row">
      <span className="h-chip h-chip--inert">H{sup(k)} = {hText}</span>
      {N > 0 ? (
        <span
          className={`h-chip-class ${coords === null ? "h-chip-class--none" : ""}`}
          title={coords === null
            ? "current c is not a cocycle, or its class needs torsion reduction"
            : "coordinates of current c in H^k, in the basis g1, g2, …"}
        >
          {coords === null ? "class = —" : `class = ${coordsText ?? "0"}`}
        </span>
      ) : (
        <span className="h-chip-meta">no free generators</span>
      )}
      {N > 0 && (
        <span className="h-chip-nav">
          <span className="h-chip-nav-label">set c{sup(k)} to:</span>
          <button onClick={() => goto(pos - 1)} title="previous">‹</button>
          <span className="h-chip-pos">{posLabel}</span>
          <button onClick={() => goto(pos + 1)} title="next">›</button>
          <span className="h-chip-meta">(basis: g1{N > 1 ? `, …, g${N}` : ""})</span>
        </span>
      )}
      <button className="h-chip-clear" onClick={clearLocal} title={`Clear any manual values typed into c${sup(k)}`}>Clear c{sup(k)}</button>
    </div>
  );
}

function LayerCard({ k }: { k: CohomologyDegree }) {
  return (
    <div className="layer-card">
      <h3 className="layer-card__title">C{sup(k)}</h3>
      {k > 0 && (
        <section className="delta-eq-section">
          <h4>δ{sup(k - 1)} acting on current c{sup(k - 1)}</h4>
          <DeltaEquationRows fromK={k - 1} />
        </section>
      )}
      <section>
        <h4 className="layer-card__section-title">C{sup(k)} editor</h4>
        <LayerEditor k={k} />
      </section>
      <LayerStatus k={k} />
      <CohomologyChip k={k} />
    </div>
  );
}

function CupProductSection() {
  const nerve = useNerve();
  const ring = useRing();
  const q = useStore((s) => s.cohomologyDegree);
  const pickedDegree = useStore((s) => s.cupPickedDegree);
  const pickedIndex = useStore((s) => s.cupPickedIndex);
  const basisOnLeft = useStore((s) => s.cupBasisOnLeft);
  const setPickedDegree = useStore((s) => s.setCupPickedDegree);
  const setPickedIndex = useStore((s) => s.setCupPickedIndex);
  const setBasisOnLeft = useStore((s) => s.setCupBasisOnLeft);

  const basisH = useCohomology(pickedDegree);
  const generators = basisH.cocycleBasis.filter((c) => !c.isCoboundary);
  const idx = Math.min(pickedIndex, Math.max(0, generators.length - 1));
  const tooHigh = pickedDegree + q > 2;
  const preview = useCupResult();
  const delta: Map<SimplexKey, RingElement> = preview
    ? applyCoboundary(preview.result.values, nerve, preview.result.degree, ring)
    : new Map();

  return (
    <section className="cup-section">
      <h3>Cup product H<sup>p</sup> ⌣ H<sup>q</sup> → H<sup>p+q</sup></h3>
      <div className="cup-controls">
        <label>
          p:
          <select
            value={pickedDegree}
            onChange={(e) => setPickedDegree(Number(e.target.value) as CohomologyDegree)}
          >
            <option value={0}>0</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </label>
        <span className="cup-q">q = {q} (current focused degree)</span>
        {generators.length > 0 && (
          <label>
            generator of H{sup(pickedDegree)}:
            <select value={idx} onChange={(e) => setPickedIndex(Number(e.target.value))}>
              {generators.map((_, i) => (
                <option key={i} value={i}>g{i + 1}</option>
              ))}
            </select>
          </label>
        )}
        <label>
          <input type="radio" checked={basisOnLeft} onChange={() => setBasisOnLeft(true)} />
          basis ⌣ current
        </label>
        <label>
          <input type="radio" checked={!basisOnLeft} onChange={() => setBasisOnLeft(false)} />
          current ⌣ basis
        </label>
      </div>
      {generators.length === 0 ? (
        <div className="hint">no free generators in H{sup(pickedDegree)}</div>
      ) : tooHigh ? (
        <div className="hint">p + q = {pickedDegree + q} &gt; 2 — pick p ≤ {2 - q}</div>
      ) : preview ? (
        <div className="cup-result">
          <div className="hint">result in C{sup(preview.result.degree)}:</div>
          {preview.result.values.size === 0 ? (
            <div className="hint">all zeros</div>
          ) : (
            <ul>
              {[...preview.result.values.entries()].map(([key, v]) => (
                <li key={key}><code>{`{${key}}`}</code>: {ring.format(v)}</li>
              ))}
            </ul>
          )}
          <span className={`delta-eq-result ${delta.size === 0 ? "delta-eq-result--zero" : "delta-eq-result--nonzero"}`}>
            δ(result) {delta.size === 0 ? "= 0  ✓ (cocycle)" : "≠ 0  ✗"}
          </span>
        </div>
      ) : null}
    </section>
  );
}

function ChainView() {
  const unlocked = useUnlocked();
  const cohomologyDegree = useStore((s) => s.cohomologyDegree);
  const setCohomologyDegree = useStore((s) => s.setCohomologyDegree);
  const showCupProduct = useStore((s) => s.showCupProduct);

  const showH1 = unlocked.has("h1");
  const showH2 = unlocked.has("h2");
  const maxPair: PairLeft = showH2 ? 1 : 0;
  const initialPair: PairLeft = cohomologyDegree === 2 ? 1 : (Math.min(cohomologyDegree, maxPair) as PairLeft);
  const [pair, setPairLocal] = useState<PairLeft>(initialPair);

  const setPair = (p: PairLeft) => {
    setPairLocal(p);
    setCohomologyDegree(p as CohomologyDegree);
  };

  if (!showH1) {
    return (
      <div className="chain-view">
        <LayerCard k={0} />
        {showCupProduct && <CupProductSection />}
      </div>
    );
  }

  return (
    <div className="chain-view">
      <PairSelector pair={pair} setPair={setPair} minPair={0} maxPair={maxPair} />
      <LayerCard k={pair as CohomologyDegree} />
      <LayerCard k={(pair + 1) as CohomologyDegree} />
      {showCupProduct && <CupProductSection />}
    </div>
  );
}

export default function CohomologyPanel() {
  const unlocked = useUnlocked();
  return (
    <div className="panel cohomology-panel">
      <div className="panel-header">
        <h2>Cohomology</h2>
        {unlocked.has("ring-picker") && <RingPicker />}
      </div>
      <div className="panel-body">
        <ChainView />
      </div>
    </div>
  );
}
