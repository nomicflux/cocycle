import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    const setShowEmptyCoverHighlight = useStore((s) => s.setShowEmptyCoverHighlight);
    if (status.state === "empty")
        return null;
    if (status.state === "incomplete") {
        return (_jsx("button", { type: "button", className: `cover-chip cover-chip--incomplete${showEmptyCoverHighlight ? " cover-chip--active" : ""}`, "aria-pressed": showEmptyCoverHighlight, title: "Toggle highlighting for uncovered sample cells in the drawing panel.", onClick: () => setShowEmptyCoverHighlight(!showEmptyCoverHighlight), children: "cover incomplete" }));
    }
    if (status.state === "good") {
        return _jsx("span", { className: "cover-chip cover-chip--good", children: "good cover \u2713" });
    }
    const dimName = status.witness.length === 2 ? "pair" : "triple";
    const simplexLabel = `{${status.witness.join(",")}}`;
    return (_jsxs("span", { className: "cover-chip cover-chip--bad", title: `The ${dimName}-intersection of ${simplexLabel} has ${status.components} connected components; a good cover requires every nonempty intersection to be contractible (one connected piece).`, children: ["bad cover \u2014 ", dimName, " ", simplexLabel, " has ", status.components, " components"] }));
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
        unlocked.has("drawing") && _jsx(DrawingPanel, {}, "drawing"),
        (unlocked.has("nerve-geom") || unlocked.has("nerve-set")) && (_jsx(NervePanel, {}, "nerve")),
        unlocked.has("cohomology") && _jsx(CohomologyPanel, {}, "cohomology"),
    ].filter(Boolean);
    const gridClass = unlocked.has("cohomology") && panels.length >= 2
        ? "grid grid--chain"
        : `grid grid--cols-${panels.length}`;
    return (_jsxs("div", { className: "app", children: [_jsxs("header", { className: "topbar", children: [_jsx("h1", { children: "Cocycle" }), _jsx("span", { className: "subtitle", children: "\u010Cech cohomology over \u2124, up to H\u00B2" }), unlocked.has("presets") && _jsx(PresetsMenu, {}), _jsx("button", { onClick: () => addDisc(Math.random() * 2 - 1, Math.random() * 2 - 1, 1.2), children: "+ Disc" }), _jsx("button", { onClick: clear, children: "Clear all" }), unlocked.has("align") && (_jsx("button", { onClick: align, title: "Spread the discs by repeatedly relocating each to the point farthest from the others on the quotient. No two discs end up stacked. Positions only; radii unchanged.", children: "Align" })), unlocked.has("cover-status") && _jsx(CoverStatusChip, {}), unlocked.has("cup-product") && (_jsxs("label", { className: "topbar-toggle", children: [_jsx("input", { type: "checkbox", checked: showCupProduct, onChange: (e) => setShowCupProduct(e.target.checked) }), "Cup product"] })), _jsx("button", { className: "glossary-launcher", onClick: () => setGlossaryOpen(true), title: "Open glossary of terms", children: "Glossary" }), _jsx(TutorialLauncher, {}), _jsx("button", { className: "privacy-link", onClick: () => setConsent("pending"), title: "Revisit privacy choice", children: "Privacy" })] }), _jsx("main", { className: gridClass, children: panels }), tutorialMode === "tutorial" ? _jsx(TutorialBar, {}) : _jsx(SnapshotBar, {}), _jsx(ConsentBanner, {}), _jsx(WelcomeModal, {}), _jsx(GlossaryModal, {})] }));
}
