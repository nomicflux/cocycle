import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useStore } from "../state/store";
export default function SnapshotBar() {
    const snapshots = useStore((s) => s.snapshots);
    const saveSnapshot = useStore((s) => s.saveSnapshot);
    const removeSnapshot = useStore((s) => s.removeSnapshot);
    const loadDiscs = useStore((s) => s.loadDiscs);
    const compareWith = useStore((s) => s.compareWithSnapshot);
    const setCompareWith = useStore((s) => s.setCompareWith);
    return (_jsxs("div", { className: "snapshot-bar", children: [_jsx("button", { onClick: () => saveSnapshot(`Snapshot ${snapshots.length + 1}`), children: "+ Save snapshot" }), _jsx("span", { className: "snapshot-hint", children: snapshots.length === 0 ? "no snapshots yet" : `${snapshots.length} snapshot(s)` }), snapshots.map((sn) => (_jsxs("span", { className: `snapshot-chip ${compareWith === sn.id ? "comparing" : ""}`, children: [_jsx("button", { onClick: () => loadDiscs(sn.discs), title: "Load", children: sn.name }), _jsx("button", { onClick: () => setCompareWith(compareWith === sn.id ? null : sn.id), title: "Overlay this snapshot on the cover panel", children: "\u21C4" }), _jsx("button", { onClick: () => removeSnapshot(sn.id), title: "Delete", children: "\u00D7" })] }, sn.id)))] }));
}
