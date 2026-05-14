import { useStore } from "../state/store";
import { useNerve, useCohomology, useCupResult, applyCoboundary } from "../state/derived";
import type { Cochain, SimplexKey } from "../state/types";
import { simplexKey } from "../state/types";
import type { CohomologyDegree } from "../state/store";

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

function Tabs({ value, onChange }: { value: CohomologyDegree; onChange: (d: CohomologyDegree) => void }) {
  return (
    <div className="tabs">
      {([0, 1, 2] as const).map((d) => (
        <button key={d} className={value === d ? "active" : ""} onClick={() => onChange(d)}>
          H<sup>{d}</sup>
        </button>
      ))}
    </div>
  );
}

function CochainEditor({ k }: { k: CohomologyDegree }) {
  const nerve = useNerve();
  const cochainValues = useStore((s) => s.cochainValues);
  const setCochainValue = useStore((s) => s.setCochainValue);
  const simplices = nerve.byDim[k] ?? [];
  if (simplices.length === 0) return <div className="hint">no {k}-simplices</div>;
  return (
    <div className="cochain-editor">
      {simplices.map((s) => {
        const key = simplexKey(s);
        const v = cochainValues.get(key) ?? 0;
        return (
          <div key={key} className="cochain-row">
            <code>{`{${s.join(",")}}`}</code>
            <input
              type="number"
              value={v}
              onChange={(e) => setCochainValue(s, parseInt0(e.target.value))}
            />
          </div>
        );
      })}
    </div>
  );
}

function CoboundaryDisplay({ k }: { k: CohomologyDegree }) {
  const nerve = useNerve();
  const cochainValues = useStore((s) => s.cochainValues);
  const delta = applyCoboundary(cochainValues, nerve, k);
  if (delta.size === 0) return null;
  return (
    <div className="coboundary-display">
      <div>
        <span className="not-cocycle">δc ≠ 0 — current cochain is not a cocycle</span>
      </div>
      <ul>
        {[...delta.entries()].map(([key, v]) => (
          <li key={key}><code>{`{${key}}`}</code>: {v}</li>
        ))}
      </ul>
    </div>
  );
}

function CupResult({
  result,
  delta,
}: {
  result: Cochain;
  delta: Map<SimplexKey, number>;
}) {
  const entries = [...result.values.entries()];
  return (
    <div className="cup-result">
      <div className="hint">
        result in H<sup>{result.degree}</sup>:
      </div>
      {entries.length === 0 ? (
        <div className="hint">all zeros</div>
      ) : (
        <ul>
          {entries.map(([key, v]) => (
            <li key={key}>
              <code>{`{${key}}`}</code>: {v}
            </li>
          ))}
        </ul>
      )}
      <div className={delta.size === 0 ? "cocycle-ok" : "not-cocycle"}>
        {delta.size === 0 ? "δ(result) = 0 ✓" : "δ(result) ≠ 0 — not a cocycle"}
      </div>
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
  const totalDeg = pickedDegree + q;
  const tooHigh = totalDeg > 2;
  const preview = useCupResult();

  let delta: Map<SimplexKey, number> = new Map();
  if (preview) delta = applyCoboundary(preview.result.values, nerve, preview.result.degree);

  return (
    <div className="cup-section">
      <h3>Cup product</h3>
      <div className="cup-controls">
        <label>
          basis H<sup>p</sup>:
          <select
            value={pickedDegree}
            onChange={(e) => setPickedDegree(Number(e.target.value) as CohomologyDegree)}
          >
            <option value={0}>H⁰</option>
            <option value={1}>H¹</option>
            <option value={2}>H²</option>
          </select>
        </label>
        {generators.length > 0 && (
          <label>
            gen:
            <select
              value={idx}
              onChange={(e) => setPickedIndex(Number(e.target.value))}
            >
              {generators.map((_, i) => (
                <option key={i} value={i}>g{i + 1}</option>
              ))}
            </select>
          </label>
        )}
        <label>
          <input
            type="radio"
            checked={basisOnLeft}
            onChange={() => setBasisOnLeft(true)}
          />
          basis ∪ current
        </label>
        <label>
          <input
            type="radio"
            checked={!basisOnLeft}
            onChange={() => setBasisOnLeft(false)}
          />
          current ∪ basis
        </label>
      </div>
      {generators.length === 0 ? (
        <div className="hint">no free generators in H<sup>{pickedDegree}</sup></div>
      ) : tooHigh ? (
        <div className="hint">
          p + q = {totalDeg} &gt; 2 — pick a basis degree p ≤ {2 - q}
        </div>
      ) : preview ? (
        <>
          <CupResult result={preview.result} delta={delta} />
          <div className="hint">
            Hover a {preview.result.degree}-simplex in the nerve panel to see the
            front face (cyan, degree {preview.leftDegree}) and back face
            (rose, degree {preview.rightDegree}) decomposition.
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function CohomologyPanel() {
  const k = useStore((s) => s.cohomologyDegree);
  const setK = useStore((s) => s.setCohomologyDegree);
  const cohK = useCohomology(k);
  const clearCochain = useStore((s) => s.clearCochain);
  const applyCochain = useStore((s) => s.applyCochain);
  const basisCursor = useStore((s) => s.basisCursor);
  const setBasisCursor = useStore((s) => s.setBasisCursor);

  const showCupProduct = useStore((s) => s.showCupProduct);
  const repBasis = cohK.cocycleBasis.filter((c) => !c.isCoboundary);

  const goto = (next: number) => {
    if (repBasis.length === 0) return;
    const idx = ((next % repBasis.length) + repBasis.length) % repBasis.length;
    applyCochain(k, repBasis[idx].cochain.values);
    setBasisCursor(idx);
  };

  return (
    <div className="panel cohomology-panel">
      <div className="panel-header"><h2>Cohomology</h2></div>
      <div className="panel-body">
        <Tabs value={k} onChange={setK} />
        <div className="group">
          H<sup>{k}</sup> = <strong>{formatGroup(cohK.rank, cohK.torsion)}</strong>
        </div>
        <div className="basis-controls">
          <button onClick={() => goto(basisCursor - 1)} disabled={repBasis.length === 0}>‹</button>
          <span>
            {repBasis.length === 0
              ? "no free generators"
              : `representative ${basisCursor + 1} / ${repBasis.length}`}
          </span>
          <button onClick={() => goto(basisCursor + 1)} disabled={repBasis.length === 0}>›</button>
          <button onClick={clearCochain}>Clear</button>
        </div>
        <CochainEditor k={k} />
        <CoboundaryDisplay k={k} />
        {showCupProduct && <CupProductSection />}
      </div>
    </div>
  );
}
