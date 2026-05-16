import type { ReactNode } from "react";
import { useStore } from "../state/store";
import { useGoalReached } from "../state/derived";
import { CHAPTERS } from "./chapters";

function renderInline(text: string): ReactNode[] {
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = text.split(re);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
}

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

  if (mode !== "tutorial") return null;
  const chap = CHAPTERS[step];
  if (!chap) return null;

  const last = CHAPTERS.length - 1;
  const finalChapter = step === last;

  return (
    <div className="tutorial-bar">
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
