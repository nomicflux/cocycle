import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useStore } from "../state/store";
export default function WelcomeModal() {
    const consent = useStore((s) => s.consent);
    const visited = useStore((s) => s.visited);
    const enterTutorial = useStore((s) => s.enterTutorial);
    const markVisitedAction = useStore((s) => s.markVisited);
    if (consent === "pending" || visited)
        return null;
    const start = () => {
        markVisitedAction();
        enterTutorial();
    };
    const dismiss = () => {
        markVisitedAction();
    };
    return (_jsx("div", { className: "welcome-backdrop", children: _jsxs("div", { className: "welcome-modal", role: "dialog", "aria-modal": "true", children: [_jsx("h2", { children: "Welcome to Cocycle" }), _jsx("p", { children: "\u010Cech cohomology has a steep ramp. The tutorial walks you through it on a torus in ten short interactive chapters. You can exit any time." }), _jsxs("div", { className: "welcome-buttons", children: [_jsx("button", { className: "primary", onClick: start, children: "Start tutorial" }), _jsx("button", { onClick: dismiss, children: "Just let me play" })] })] }) }));
}
