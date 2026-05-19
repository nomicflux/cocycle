import { jsx as _jsx } from "react/jsx-runtime";
export default function SimplexChip({ simplex, selected, onClick }) {
    return (_jsx("button", { type: "button", className: `simplex-chip ${selected ? "selected" : ""}`, onClick: onClick, children: `{${simplex.join(",")}}` }));
}
