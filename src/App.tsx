import DrawingPanel from "./panels/DrawingPanel";
import NervePanel from "./panels/NervePanel";
import CohomologyPanel from "./panels/CohomologyPanel";
import SnapshotBar from "./components/SnapshotBar";
import PresetsMenu from "./components/PresetsMenu";
import TutorialBar from "./tutorial/TutorialBar";
import TutorialLauncher from "./tutorial/TutorialLauncher";
import WelcomeModal from "./tutorial/WelcomeModal";
import ConsentBanner from "./tutorial/ConsentBanner";
import GlossaryModal from "./tutorial/GlossaryModal";
import { useStore } from "./state/store";
import { useUnlocked } from "./state/derived";

export default function App() {
  const clear = useStore((s) => s.clearDiscs);
  const addDisc = useStore((s) => s.addDisc);
  const showCupProduct = useStore((s) => s.showCupProduct);
  const setShowCupProduct = useStore((s) => s.setShowCupProduct);
  const setConsent = useStore((s) => s.setConsent);
  const setGlossaryOpen = useStore((s) => s.setGlossaryOpen);
  const tutorialMode = useStore((s) => s.tutorialMode);
  const unlocked = useUnlocked();

  const panels = [
    unlocked.has("drawing") && <DrawingPanel key="drawing" />,
    (unlocked.has("nerve-geom") || unlocked.has("nerve-set")) && <NervePanel key="nerve" />,
    unlocked.has("cohomology") && <CohomologyPanel key="cohomology" />,
  ].filter(Boolean);
  const gridClass = unlocked.has("cohomology") && panels.length >= 2
    ? "grid grid--chain"
    : `grid grid--cols-${panels.length}`;

  return (
    <div className="app">
      <header className="topbar">
        <h1>Cocycle</h1>
        <span className="subtitle">Čech cohomology over ℤ, up to H²</span>
        {unlocked.has("presets") && <PresetsMenu />}
        <button onClick={() => addDisc(Math.random() * 2 - 1, Math.random() * 2 - 1, 1.2)}>+ Disc</button>
        <button onClick={clear}>Clear all</button>
        {unlocked.has("cup-product") && (
          <label className="topbar-toggle">
            <input
              type="checkbox"
              checked={showCupProduct}
              onChange={(e) => setShowCupProduct(e.target.checked)}
            />
            Cup product
          </label>
        )}
        <button
          className="glossary-launcher"
          onClick={() => setGlossaryOpen(true)}
          title="Open glossary of terms"
        >
          Glossary
        </button>
        <TutorialLauncher />
        <button
          className="privacy-link"
          onClick={() => setConsent("pending")}
          title="Revisit privacy choice"
        >
          Privacy
        </button>
      </header>
      <main className={gridClass}>{panels}</main>
      {tutorialMode === "tutorial" ? <TutorialBar /> : <SnapshotBar />}
      <ConsentBanner />
      <WelcomeModal />
      <GlossaryModal />
    </div>
  );
}
