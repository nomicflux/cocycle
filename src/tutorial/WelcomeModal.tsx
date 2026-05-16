import { useStore } from "../state/store";

export default function WelcomeModal() {
  const consent = useStore((s) => s.consent);
  const visited = useStore((s) => s.visited);
  const enterTutorial = useStore((s) => s.enterTutorial);
  const markVisitedAction = useStore((s) => s.markVisited);

  if (consent === "pending" || visited) return null;

  const start = (): void => {
    markVisitedAction();
    enterTutorial();
  };
  const dismiss = (): void => {
    markVisitedAction();
  };

  return (
    <div className="welcome-backdrop">
      <div className="welcome-modal" role="dialog" aria-modal="true">
        <h2>Welcome to Cocycle</h2>
        <p>
          Čech cohomology has a steep ramp. The tutorial walks you through it
          on a torus in ten short interactive chapters. You can exit any time.
        </p>
        <div className="welcome-buttons">
          <button className="primary" onClick={start}>
            Start tutorial
          </button>
          <button onClick={dismiss}>Just let me play</button>
        </div>
      </div>
    </div>
  );
}
