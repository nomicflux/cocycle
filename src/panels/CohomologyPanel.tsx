import { useStore } from "../state/store";
import { useNerve, useCohomology, applyCoboundary } from "../state/derived";
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
  const isCocycle = delta.size === 0;
  return (
    <div className="coboundary-display">
      <div>
        δc ={" "}
        {isCocycle
          ? <strong>0 — c is a cocycle ✓</strong>
          : <span className="not-cocycle">non-zero — c is not a cocycle</span>}
      </div>
      {!isCocycle && (
        <ul>
          {[...delta.entries()].map(([key, v]) => (
            <li key={key}><code>{`{${key}}`}</code>: {v}</li>
          ))}
        </ul>
      )}
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
      </div>
    </div>
  );
}
