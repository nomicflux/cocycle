import DrawingPanel from "./panels/DrawingPanel";
import NerveSetPanel from "./panels/NerveSetPanel";
import NerveGeomPanel from "./panels/NerveGeomPanel";
import CohomologyPanel from "./panels/CohomologyPanel";
import SnapshotBar from "./components/SnapshotBar";
import PresetsMenu from "./components/PresetsMenu";
import { useStore } from "./state/store";

export default function App() {
  const clear = useStore((s) => s.clearDiscs);
  const addDisc = useStore((s) => s.addDisc);
  return (
    <div className="app">
      <header className="topbar">
        <h1>Cocycle</h1>
        <span className="subtitle">Čech cohomology over ℤ, up to H²</span>
        <PresetsMenu />
        <button onClick={() => addDisc(Math.random() * 2 - 1, Math.random() * 2 - 1, 1.2)}>+ Disc</button>
        <button onClick={clear}>Clear all</button>
      </header>
      <main className="grid">
        <DrawingPanel />
        <NerveSetPanel />
        <NerveGeomPanel />
        <CohomologyPanel />
      </main>
      <SnapshotBar />
    </div>
  );
}
