import { useState } from "react";
import { useStore } from "../state/store";
import {
  useNerve,
  useCohomology,
  useCupResult,
  useUnlocked,
  useDeltaShadow,
  useIsCoboundary,
  useClassCoordinates,
  applyCoboundary,
} from "../state/derived";
import type { Simplex, SimplexKey } from "../state/types";
import { simplexKey } from "../state/types";
import { faces } from "../math/coboundary";
import type { CohomologyDegree } from "../state/store";

const SUPS = ["⁰", "¹", "²", "³"];
function sup(n: number): string { return SUPS[n] ?? String(n); }

function formatGroup(rank: number, torsion: number[]): string {
  const parts: string[] = [];
  if (rank > 0) parts.push(rank === 1 ? "ℤ" : `ℤ^${rank}`);
  for (const t of torsion) parts.push(`ℤ/${t}`);
  return parts.length ? parts.join(" ⊕ ") : "0";
}

function parseInt0(s: string): number {
  const v = parseInt(s, 10);
  return isNaN(v) ? 0 : v;
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

function ValueTerm({ sign, value, leading }: { sign: number; value: number; leading: boolean }) {
  if (leading) {
    return <span className="delta-eq-num">{sign * value}</span>;
  }
  const product = sign * value;
  const op = product >= 0 ? "+ " : "− ";
  return <span className="delta-eq-num">{op}{Math.abs(product)}</span>;
}

function DeltaEquationRows({ fromK }: { fromK: number }) {
  const nerve = useNerve();
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
          face, sign, v: cochainValues.get(simplexKey(face)) ?? 0,
        }));
        const sum = parts.reduce((a, p) => a + p.sign * p.v, 0);
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
                <ValueTerm key={i} sign={p.sign} value={p.v} leading={i === 0} />
              ))}
            </span>
            <span>=</span>
            <span className={`delta-eq-result ${sum === 0 ? "delta-eq-result--zero" : "delta-eq-result--nonzero"}`}>
              {sum} {sum === 0 ? "✓" : "✗"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LayerEditor({ k }: { k: CohomologyDegree }) {
  const nerve = useNerve();
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
        const v = cochainValues.get(key) ?? 0;
        const sh = shadow.get(key) ?? 0;
        const hasShadow = shadow.has(key);
        const matches = showShadow && hasShadow && v === sh;
        return (
          <div key={key} className={`cochain-row${showShadow ? " cochain-row--shadow" : ""}`}>
            <code>{`{${s.join(",")}}`}</code>
            <input
              type="number"
              value={v}
              onChange={(e) => setCochainValue(s, parseInt0(e.target.value))}
            />
            {showShadow && (
              <span className={`shadow-cell${matches ? " shadow-cell--match" : ""}`}>
                {hasShadow ? sh : "·"}
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
  const cochainValues = useStore((s) => s.cochainValues);
  const isCo = useIsCoboundary(k);
  const delta = applyCoboundary(cochainValues, nerve, k);
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
  const applyCochain = useStore((s) => s.applyCochain);
  const clearCochain = useStore((s) => s.clearCochain);
  const setCohomologyDegree = useStore((s) => s.setCohomologyDegree);
  const [idx, setIdx] = useState(0);

  const generators = cohK.cocycleBasis.filter((c) => !c.isCoboundary);
  const hText = formatGroup(cohK.rank, cohK.torsion);
  const safeIdx = generators.length > 0 ? idx % generators.length : 0;
  const coordsText =
    coords === null
      ? null
      : coords.length === 0
      ? null
      : `[${coords.join(", ")}]`;

  const load = (next: number) => {
    if (generators.length === 0) return;
    const i = ((next % generators.length) + generators.length) % generators.length;
    setCohomologyDegree(k);
    applyCochain(k, generators[i].cochain.values);
    setIdx(i);
  };
  const clearLocal = () => {
    setCohomologyDegree(k);
    clearCochain();
  };

  return (
    <div className="h-chip-row">
      {generators.length > 0 ? (
        <button className="h-chip" onClick={() => load(safeIdx)} title="Load this generator into the editor">
          H{sup(k)} = {hText}
        </button>
      ) : (
        <span className="h-chip h-chip--inert">H{sup(k)} = {hText}</span>
      )}
      <span className="h-chip-meta">
        {generators.length === 0
          ? "no free generators"
          : `${generators.length} generator${generators.length === 1 ? "" : "s"}`}
      </span>
      {generators.length > 0 && (
        <span
          className={`h-chip-class ${coords === null ? "h-chip-class--none" : ""}`}
          title={coords === null
            ? "current c is not a cocycle, or its class needs torsion reduction"
            : "coordinates of current c in H^k, in the basis g1, g2, …"}
        >
          {coords === null ? "class = —" : `class = ${coordsText ?? "0"}`}
        </span>
      )}
      {generators.length > 0 && (
        <span className="h-chip-nav">
          <button onClick={() => load(safeIdx - 1)}>‹</button>
          <span>g{safeIdx + 1} / {generators.length}</span>
          <button onClick={() => load(safeIdx + 1)}>›</button>
        </span>
      )}
      <button className="h-chip-clear" onClick={clearLocal}>Clear c{sup(k)}</button>
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
  const delta: Map<SimplexKey, number> = preview
    ? applyCoboundary(preview.result.values, nerve, preview.result.degree)
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
                <li key={key}><code>{`{${key}}`}</code>: {v}</li>
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
  return (
    <div className="panel cohomology-panel">
      <div className="panel-header"><h2>Cohomology</h2></div>
      <div className="panel-body">
        <ChainView />
      </div>
    </div>
  );
}
