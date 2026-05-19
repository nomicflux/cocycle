import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useUnlocked } from "../state/derived";
import NerveGeomPanel from "./NerveGeomPanel";
import NerveSetPanel from "./NerveSetPanel";
export default function NervePanel() {
    const unlocked = useUnlocked();
    const showGeom = unlocked.has("nerve-geom");
    const showSets = unlocked.has("nerve-set");
    if (!showGeom && !showSets)
        return null;
    return (_jsxs("div", { className: "nerve-combined", children: [showGeom && _jsx(NerveGeomPanel, {}), showSets && _jsx(NerveSetPanel, {})] }));
}
