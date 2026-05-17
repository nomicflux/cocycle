import { useUnlocked } from "../state/derived";
import NerveGeomPanel from "./NerveGeomPanel";
import NerveSetPanel from "./NerveSetPanel";

export default function NervePanel() {
  const unlocked = useUnlocked();
  const showGeom = unlocked.has("nerve-geom");
  const showSets = unlocked.has("nerve-set");
  if (!showGeom && !showSets) return null;
  return (
    <div className="nerve-combined">
      {showGeom && <NerveGeomPanel />}
      {showSets && <NerveSetPanel />}
    </div>
  );
}
