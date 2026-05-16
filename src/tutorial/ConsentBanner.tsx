import { useState } from "react";
import { useStore } from "../state/store";

export default function ConsentBanner() {
  const consent = useStore((s) => s.consent);
  const setConsent = useStore((s) => s.setConsent);
  const [showMore, setShowMore] = useState(false);
  if (consent !== "pending") return null;
  return (
    <div className="consent-banner" role="dialog" aria-label="Privacy preferences">
      <div className="consent-text">
        We store only your tutorial progress and mode in this browser's local
        storage. No tracking, no third parties.
        {showMore && (
          <div className="consent-more">
            If you decline, the tutorial still works — but your chapter and mode
            won't be remembered across page reloads.
          </div>
        )}
      </div>
      <div className="consent-buttons">
        <button onClick={() => setConsent("accepted")}>Accept</button>
        <button onClick={() => setConsent("declined")}>Decline</button>
        <button className="link" onClick={() => setShowMore((v) => !v)}>
          {showMore ? "Less" : "Learn more"}
        </button>
      </div>
    </div>
  );
}
