import { jsx as _jsx } from "react/jsx-runtime";
import { useStore } from "../state/store";
export default function TutorialLauncher() {
    const mode = useStore((s) => s.tutorialMode);
    const enterTutorial = useStore((s) => s.enterTutorial);
    if (mode === "tutorial")
        return null;
    return (_jsx("button", { className: "tutorial-launcher", onClick: enterTutorial, children: "Tutorial" }));
}
