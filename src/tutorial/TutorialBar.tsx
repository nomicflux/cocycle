import { useRef, useState, type ReactNode, type PointerEvent as RPointerEvent } from "react";
import { useStore } from "../state/store";
import { useGoalReached } from "../state/derived";
import { CHAPTERS } from "./chapters";
import { renderInline } from "./renderInline";

const DEFAULT_HEIGHT = 200;
const MIN_HEIGHT = 72;
const MAX_HEIGHT_FRAC = 0.7;

function renderProse(text: string): ReactNode {
  return text.split("\n\n").map((para, i) => (
    <p key={i} className="tutorial-paragraph">{renderInline(para)}</p>
  ));
}

export default function TutorialBar() {
  const mode = useStore((s) => s.tutorialMode);
  const step = useStore((s) => s.tutorialStep);
  const next = useStore((s) => s.nextStep);
  const prev = useStore((s) => s.prevStep);
  const exit = useStore((s) => s.exitTutorial);
  const goalReached = useGoalReached();

  const [height, setHeight] = useState<number>(DEFAULT_HEIGHT);
  const dragRef = useRef<{ startY: number; startH: number } | null>(null);

  const onResizeDown = (e: RPointerEvent<HTMLDivElement>): void => {
    dragRef.current = { startY: e.clientY, startH: height };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onResizeMove = (e: RPointerEvent<HTMLDivElement>): void => {
    if (!dragRef.current) return;
    const dy = dragRef.current.startY - e.clientY;
    const max = window.innerHeight * MAX_HEIGHT_FRAC;
    const next = Math.max(MIN_HEIGHT, Math.min(max, dragRef.current.startH + dy));
    setHeight(next);
  };
  const onResizeUp = (e: RPointerEvent<HTMLDivElement>): void => {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  if (mode !== "tutorial") return null;
  const chap = CHAPTERS[step];
  if (!chap) return null;

  const last = CHAPTERS.length - 1;
  const finalChapter = step === last;

  return (
    <div className="tutorial-bar" style={{ height }}>
      <div
        className="tutorial-resize"
        onPointerDown={onResizeDown}
        onPointerMove={onResizeMove}
        onPointerUp={onResizeUp}
        onPointerCancel={onResizeUp}
        title="Drag to resize the tutorial panel"
        aria-label="Resize tutorial panel"
        role="separator"
      />
      <div className="tutorial-header">
        <div className="tutorial-title">
          <span className="tutorial-progress">
            {step + 1} / {CHAPTERS.length}
          </span>
          <strong>{chap.title}</strong>
        </div>
        <button className="exit-link" onClick={exit}>
          Exit tutorial
        </button>
      </div>
      <div className="tutorial-prose">{renderProse(chap.prose)}</div>
      <div className="tutorial-controls">
        <button onClick={prev} disabled={step === 0}>
          ‹ Back
        </button>
        <div className="tutorial-goal">
          {chap.goal && goalReached && (
            <span className="goal-reached">✓ goal reached</span>
          )}
          {chap.goal && !goalReached && chap.goalHint && (
            <span className="goal-hint">{chap.goalHint}</span>
          )}
        </div>
        <button
          onClick={finalChapter ? exit : next}
          className={goalReached || !chap.goal ? "primary pulse" : "primary"}
        >
          {finalChapter ? "Finish ›" : "Next ›"}
        </button>
      </div>
    </div>
  );
}
