import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from "react";
import { useStore } from "../state/store";
import { useGoalReached } from "../state/derived";
import { CHAPTERS } from "./chapters";
const DEFAULT_HEIGHT = 200;
const MIN_HEIGHT = 72;
const MAX_HEIGHT_FRAC = 0.7;
function renderInline(text) {
    const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
    const parts = text.split(re);
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return _jsx("strong", { children: part.slice(2, -2) }, i);
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
            return _jsx("em", { children: part.slice(1, -1) }, i);
        }
        return _jsx("span", { children: part }, i);
    });
}
function renderProse(text) {
    return text.split("\n\n").map((para, i) => (_jsx("p", { className: "tutorial-paragraph", children: renderInline(para) }, i)));
}
export default function TutorialBar() {
    const mode = useStore((s) => s.tutorialMode);
    const step = useStore((s) => s.tutorialStep);
    const next = useStore((s) => s.nextStep);
    const prev = useStore((s) => s.prevStep);
    const exit = useStore((s) => s.exitTutorial);
    const goalReached = useGoalReached();
    const [height, setHeight] = useState(DEFAULT_HEIGHT);
    const dragRef = useRef(null);
    const onResizeDown = (e) => {
        dragRef.current = { startY: e.clientY, startH: height };
        e.currentTarget.setPointerCapture(e.pointerId);
    };
    const onResizeMove = (e) => {
        if (!dragRef.current)
            return;
        const dy = dragRef.current.startY - e.clientY;
        const max = window.innerHeight * MAX_HEIGHT_FRAC;
        const next = Math.max(MIN_HEIGHT, Math.min(max, dragRef.current.startH + dy));
        setHeight(next);
    };
    const onResizeUp = (e) => {
        dragRef.current = null;
        e.currentTarget.releasePointerCapture(e.pointerId);
    };
    if (mode !== "tutorial")
        return null;
    const chap = CHAPTERS[step];
    if (!chap)
        return null;
    const last = CHAPTERS.length - 1;
    const finalChapter = step === last;
    return (_jsxs("div", { className: "tutorial-bar", style: { height }, children: [_jsx("div", { className: "tutorial-resize", onPointerDown: onResizeDown, onPointerMove: onResizeMove, onPointerUp: onResizeUp, onPointerCancel: onResizeUp, title: "Drag to resize the tutorial panel", "aria-label": "Resize tutorial panel", role: "separator" }), _jsxs("div", { className: "tutorial-header", children: [_jsxs("div", { className: "tutorial-title", children: [_jsxs("span", { className: "tutorial-progress", children: [step + 1, " / ", CHAPTERS.length] }), _jsx("strong", { children: chap.title })] }), _jsx("button", { className: "exit-link", onClick: exit, children: "Exit tutorial" })] }), _jsx("div", { className: "tutorial-prose", children: renderProse(chap.prose) }), _jsxs("div", { className: "tutorial-controls", children: [_jsx("button", { onClick: prev, disabled: step === 0, children: "\u2039 Back" }), _jsxs("div", { className: "tutorial-goal", children: [chap.goal && goalReached && (_jsx("span", { className: "goal-reached", children: "\u2713 goal reached" })), chap.goal && !goalReached && chap.goalHint && (_jsx("span", { className: "goal-hint", children: chap.goalHint }))] }), _jsx("button", { onClick: finalChapter ? exit : next, className: goalReached || !chap.goal ? "primary pulse" : "primary", children: finalChapter ? "Finish ›" : "Next ›" })] })] }));
}
