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
import { useCoverStatus, useUnlocked } from "./state/derived";

function CoverStatusChip() {
  const status = useCoverStatus();
  const showEmptyCoverHighlight = useStore((s) => s.showEmptyCoverHighlight);
  const setShowEmptyCoverHighlight = useStore(
    (s) => s.setShowEmptyCoverHighlight,
  );
  if (status.state === "empty") return null;
  if (status.state === "incomplete") {
    return (
      <button
        type="button"
        className={`cover-chip cover-chip--incomplete${showEmptyCoverHighlight ? " cover-chip--active" : ""}`}
        aria-pressed={showEmptyCoverHighlight}
        title="Toggle highlighting for uncovered sample cells in the drawing panel."
        onClick={() => setShowEmptyCoverHighlight(!showEmptyCoverHighlight)}
      >
        cover incomplete
      </button>
    );
  }
  if (status.state === "good") {
    return <span className="cover-chip cover-chip--good">good cover ✓</span>;
  }
  const dimName = status.witness.length === 2 ? "pair" : "triple";
  const simplexLabel = `{${status.witness.join(",")}}`;
  return (
    <span
      className="cover-chip cover-chip--bad"
      title={`The ${dimName}-intersection of ${simplexLabel} has ${status.components} connected components; a good cover requires every nonempty intersection to be contractible (one connected piece).`}
    >
      bad cover — {dimName} {simplexLabel} has {status.components} components
    </span>
  );
}

export default function App() {
  const clear = useStore((s) => s.clearDiscs);
  const align = useStore((s) => s.alignDiscs);
  const addDisc = useStore((s) => s.addDisc);
  const showCupProduct = useStore((s) => s.showCupProduct);
  const setShowCupProduct = useStore((s) => s.setShowCupProduct);
  const setConsent = useStore((s) => s.setConsent);
  const setGlossaryOpen = useStore((s) => s.setGlossaryOpen);
  const tutorialMode = useStore((s) => s.tutorialMode);
  const unlocked = useUnlocked();

  const panels = [
    unlocked.has("drawing") && <DrawingPanel key="drawing" />,
    (unlocked.has("nerve-geom") || unlocked.has("nerve-set")) && (
      <NervePanel key="nerve" />
    ),
    unlocked.has("cohomology") && <CohomologyPanel key="cohomology" />,
  ].filter(Boolean);
  const gridClass =
    unlocked.has("cohomology") && panels.length >= 2
      ? "grid grid--chain"
      : `grid grid--cols-${panels.length}`;

  return (
    <div className="app">
      <header className="topbar">
        <h1>Cocycle</h1>
        <span className="subtitle">Čech cohomology over ℤ, up to H²</span>
        {unlocked.has("presets") && <PresetsMenu />}
        <button
          onClick={() =>
            addDisc(Math.random() * 2 - 1, Math.random() * 2 - 1, 1.2)
          }
        >
          + Disc
        </button>
        <button onClick={clear}>Clear all</button>
        {unlocked.has("align") && (
          <button
            onClick={align}
            title="Move discs into something more closely resembling a goodcover."
          >
            Adjust Cover
          </button>
        )}
        {unlocked.has("cover-status") && <CoverStatusChip />}
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
