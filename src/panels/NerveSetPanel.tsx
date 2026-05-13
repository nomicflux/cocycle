import type { Simplex } from "../state/types";
import { simplexKey } from "../state/types";
import { useStore } from "../state/store";
import { useNerve } from "../state/derived";
import { cofacesInNerve, faces } from "../math/coboundary";
import SimplexChip from "../components/SimplexChip";

const sameSimplex = (a: Simplex | null, b: Simplex): boolean =>
  a !== null && simplexKey(a) === simplexKey(b);

function SignedLink({ sign, simplex, onClick, leading }: {
  sign: number;
  simplex: Simplex;
  onClick: () => void;
  leading: boolean;
}) {
  return (
    <span>
      {leading ? (sign > 0 ? "" : "−") : sign > 0 ? " + " : " − "}
      <button className="inline-chip" onClick={onClick}>{`{${simplex.join(",")}}`}</button>
    </span>
  );
}

function BoundaryDisplay({ selected }: { selected: Simplex }) {
  const nerve = useNerve();
  const selectSimplex = useStore((s) => s.selectSimplex);
  const boundary = selected.length > 1 ? faces(selected) : [];
  const cofaces = cofacesInNerve(selected, nerve);
  return (
    <div className="boundary-display">
      <div>
        Selected: <code>{`{${selected.join(",")}}`}</code>
        {" "}(dim {selected.length - 1})
      </div>
      {boundary.length > 0 && (
        <div>
          ∂σ = {boundary.map((f, i) => (
            <SignedLink
              key={i}
              sign={f.sign}
              simplex={f.face}
              leading={i === 0}
              onClick={() => selectSimplex(f.face)}
            />
          ))}
        </div>
      )}
      {cofaces.length > 0 ? (
        <div>
          coboundary support: {cofaces.map((f, i) => (
            <SignedLink
              key={i}
              sign={f.sign}
              simplex={f.face}
              leading={i === 0}
              onClick={() => selectSimplex(f.face)}
            />
          ))}
        </div>
      ) : (
        <div className="hint">no cofaces (σ is a top-dimensional simplex of the nerve)</div>
      )}
    </div>
  );
}

export default function NerveSetPanel() {
  const nerve = useNerve();
  const selectedSimplex = useStore((s) => s.selectedSimplex);
  const selectSimplex = useStore((s) => s.selectSimplex);

  return (
    <div className="panel">
      <div className="panel-header"><h2>Nerve (as sets)</h2></div>
      <div className="panel-body">
        {nerve.byDim.map((simplices, k) => (
          <section key={k} className="dim-section">
            <h3>dim {k} <small>({simplices.length})</small></h3>
            <div className="chip-grid">
              {simplices.map((s) => (
                <SimplexChip
                  key={simplexKey(s)}
                  simplex={s}
                  selected={sameSimplex(selectedSimplex, s)}
                  onClick={() => selectSimplex(sameSimplex(selectedSimplex, s) ? null : s)}
                />
              ))}
              {simplices.length === 0 && <span className="hint">∅</span>}
            </div>
          </section>
        ))}
        {selectedSimplex && <BoundaryDisplay selected={selectedSimplex} />}
      </div>
    </div>
  );
}
