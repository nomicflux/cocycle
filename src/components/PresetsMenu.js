import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useStore } from "../state/store";
import { presets } from "../presets/examples";
export default function PresetsMenu() {
    const loadDiscs = useStore((s) => s.loadDiscs);
    return (_jsxs("select", { defaultValue: "", onChange: (e) => {
            const p = presets.find((x) => x.id === e.target.value);
            if (p)
                loadDiscs(p.discs, p.space);
            e.target.value = "";
        }, children: [_jsx("option", { value: "", disabled: true, children: "Load preset\u2026" }), presets.map((p) => (_jsx("option", { value: p.id, title: p.description, children: p.name }, p.id)))] }));
}
