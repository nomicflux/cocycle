import { useStore } from "../state/store";

export default function SnapshotBar() {
  const snapshots = useStore((s) => s.snapshots);
  const saveSnapshot = useStore((s) => s.saveSnapshot);
  const removeSnapshot = useStore((s) => s.removeSnapshot);
  const loadDiscs = useStore((s) => s.loadDiscs);
  const compareWith = useStore((s) => s.compareWithSnapshot);
  const setCompareWith = useStore((s) => s.setCompareWith);

  return (
    <div className="snapshot-bar">
      <button onClick={() => saveSnapshot(`Snapshot ${snapshots.length + 1}`)}>
        + Save snapshot
      </button>
      <span className="snapshot-hint">
        {snapshots.length === 0 ? "no snapshots yet" : `${snapshots.length} snapshot(s)`}
      </span>
      {snapshots.map((sn) => (
        <span key={sn.id} className={`snapshot-chip ${compareWith === sn.id ? "comparing" : ""}`}>
          <button onClick={() => loadDiscs(sn.discs)} title="Load">{sn.name}</button>
          <button
            onClick={() => setCompareWith(compareWith === sn.id ? null : sn.id)}
            title="Overlay this snapshot on the cover panel"
          >
            ⇄
          </button>
          <button onClick={() => removeSnapshot(sn.id)} title="Delete">×</button>
        </span>
      ))}
    </div>
  );
}
