import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { simplexKey } from "../state/types";
import { useStore } from "../state/store";
import { useNerve } from "../state/derived";
import { cofacesInNerve, faces } from "../math/coboundary";
import SimplexChip from "../components/SimplexChip";
const sameSimplex = (a, b) => a !== null && simplexKey(a) === simplexKey(b);
function SignedLink({ sign, simplex, onClick, leading }) {
    return (_jsxs("span", { children: [leading ? (sign > 0 ? "" : "−") : sign > 0 ? " + " : " − ", _jsx("button", { className: "inline-chip", onClick: onClick, children: `{${simplex.join(",")}}` })] }));
}
function BoundaryDisplay({ selected }) {
    const nerve = useNerve();
    const selectSimplex = useStore((s) => s.selectSimplex);
    const boundary = selected.length > 1 ? faces(selected) : [];
    const cofaces = cofacesInNerve(selected, nerve);
    return (_jsxs("div", { className: "boundary-display", children: [_jsxs("div", { children: ["Selected: ", _jsx("code", { children: `{${selected.join(",")}}` }), " ", "(dim ", selected.length - 1, ")"] }), boundary.length > 0 && (_jsxs("div", { children: ["\u2202\u03C3 = ", boundary.map((f, i) => (_jsx(SignedLink, { sign: f.sign, simplex: f.face, leading: i === 0, onClick: () => selectSimplex(f.face) }, i)))] })), cofaces.length > 0 ? (_jsxs("div", { children: ["coboundary support: ", cofaces.map((f, i) => (_jsx(SignedLink, { sign: f.sign, simplex: f.face, leading: i === 0, onClick: () => selectSimplex(f.face) }, i)))] })) : (_jsx("div", { className: "hint", children: "no cofaces (\u03C3 is a top-dimensional simplex of the nerve)" }))] }));
}
export default function NerveSetPanel() {
    const nerve = useNerve();
    const selectedSimplex = useStore((s) => s.selectedSimplex);
    const selectSimplex = useStore((s) => s.selectSimplex);
    return (_jsxs("div", { className: "panel", children: [_jsx("div", { className: "panel-header", children: _jsx("h2", { children: "Nerve (as sets)" }) }), _jsxs("div", { className: "panel-body", children: [nerve.byDim.map((simplices, k) => (_jsxs("section", { className: "dim-section", children: [_jsxs("h3", { children: ["dim ", k, " ", _jsxs("small", { children: ["(", simplices.length, ")"] })] }), _jsxs("div", { className: "chip-grid", children: [simplices.map((s) => (_jsx(SimplexChip, { simplex: s, selected: sameSimplex(selectedSimplex, s), onClick: () => selectSimplex(sameSimplex(selectedSimplex, s) ? null : s) }, simplexKey(s)))), simplices.length === 0 && _jsx("span", { className: "hint", children: "\u2205" })] })] }, k))), selectedSimplex && _jsx(BoundaryDisplay, { selected: selectedSimplex })] })] }));
}
