import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useStore } from "../state/store";
import { useNerve, useCohomology, useCupResult, useUnlocked, useDeltaShadow, useIsCoboundary, useClassCoordinates, useRing, applyCoboundary, } from "../state/derived";
import { simplexKey } from "../state/types";
import { faces } from "../math/coboundary";
const SUPS = ["⁰", "¹", "²", "³"];
function sup(n) { return SUPS[n] ?? String(n); }
function ringSymbol(spec) {
    switch (spec.kind) {
        case "Z": return { name: "ℤ", needsParens: false };
        case "Zp": return { name: `ℤ/${spec.p}`, needsParens: true };
        case "Q": return { name: "ℚ", needsParens: false };
        case "Zi": return { name: "ℤ[i]", needsParens: false };
        case "Zw": return { name: "ℤ[ω]", needsParens: false };
    }
}
function formatGroup(rank, torsion, spec) {
    const { name, needsParens } = ringSymbol(spec);
    const parts = [];
    if (rank > 0) {
        parts.push(rank === 1 ? name : needsParens ? `(${name})^${rank}` : `${name}^${rank}`);
    }
    for (const t of torsion)
        parts.push(`${name}/${t}`);
    return parts.length ? parts.join(" ⊕ ") : "0";
}
function termFormat(ring, x, leading) {
    if (leading)
        return ring.format(x);
    const isNeg = ring.isPositive(ring.neg(x));
    const mag = isNeg ? ring.neg(x) : x;
    return `${isNeg ? "− " : "+ "}${ring.format(mag)}`;
}
function ringSpecKey(spec) {
    return spec.kind === "Zp" ? `Zp:${spec.p}` : spec.kind;
}
function keyToRingSpec(key) {
    if (key.startsWith("Zp:"))
        return { kind: "Zp", p: parseInt(key.slice(3), 10) };
    if (key === "Z" || key === "Q" || key === "Zi" || key === "Zw")
        return { kind: key };
    return { kind: "Z" };
}
function RingPicker() {
    const ring = useStore((s) => s.ring);
    const setRing = useStore((s) => s.setRing);
    return (_jsxs("label", { className: "ring-picker", children: ["Coefficients:", _jsxs("select", { value: ringSpecKey(ring), onChange: (e) => setRing(keyToRingSpec(e.target.value)), children: [_jsx("option", { value: "Z", children: "\u2124" }), _jsx("option", { value: "Zp:2", children: "\u2124/2" }), _jsx("option", { value: "Zp:3", children: "\u2124/3" }), _jsx("option", { value: "Zp:4", children: "\u2124/4" }), _jsx("option", { value: "Zp:5", children: "\u2124/5" }), _jsx("option", { value: "Zp:6", children: "\u2124/6" }), _jsx("option", { value: "Zp:7", children: "\u2124/7" }), _jsx("option", { value: "Zp:8", children: "\u2124/8" }), _jsx("option", { value: "Zp:9", children: "\u2124/9" }), _jsx("option", { value: "Zp:12", children: "\u2124/12" }), _jsx("option", { value: "Q", children: "\u211A" }), _jsx("option", { value: "Zi", children: "\u2124[i]" }), _jsx("option", { value: "Zw", children: "\u2124[\u03C9]" })] })] }));
}
function CochainInput({ value, ring, onCommit, }) {
    const shape = ring.inputShape();
    switch (shape.kind) {
        case "integer":
            return _jsx(IntegerInput, { value: value, ring: ring, onCommit: onCommit });
        case "fraction":
            return _jsx(FractionInput, { value: value, ring: ring, onCommit: onCommit });
        case "mod-cycle":
            return _jsx(ModCycleInput, { value: value, p: shape.p, ring: ring, onCommit: onCommit });
        case "complex":
            return _jsx(ComplexInput, { value: value, imagSymbol: shape.imagSymbol, onCommit: onCommit });
    }
}
function IntegerInput({ value, ring, onCommit, }) {
    const [text, setText] = useState(String(value[0]));
    const lastSynced = useRef(String(value[0]));
    useEffect(() => {
        const s = String(value[0]);
        if (s !== lastSynced.current) {
            setText(s);
            lastSynced.current = s;
        }
    }, [value]);
    return (_jsx("input", { className: "cochain-input cochain-input--integer", type: "number", inputMode: "numeric", value: text, onChange: (e) => {
            const next = e.target.value;
            setText(next);
            if (next === "" || next === "-") {
                onCommit(ring.fromInt(0));
                lastSynced.current = "0";
                return;
            }
            const v = parseInt(next, 10);
            if (Number.isFinite(v)) {
                onCommit(ring.fromInt(v));
                lastSynced.current = String(v);
            }
        } }));
}
function FractionInput({ value, ring, onCommit, }) {
    const [num, den] = value;
    const [numText, setNumText] = useState(String(num));
    const [denText, setDenText] = useState(String(den));
    const lastSynced = useRef({ num: String(num), den: String(den) });
    useEffect(() => {
        const ns = String(num), ds = String(den);
        if (ns !== lastSynced.current.num || ds !== lastSynced.current.den) {
            setNumText(ns);
            setDenText(ds);
            lastSynced.current = { num: ns, den: ds };
        }
    }, [num, den]);
    const tryCommit = (nStr, dStr) => {
        const n = nStr === "" || nStr === "-" ? 0 : parseInt(nStr, 10);
        const d = dStr === "" ? 1 : parseInt(dStr, 10);
        if (!Number.isFinite(n) || !Number.isFinite(d) || d < 1)
            return;
        const parsed = ring.parse(`${n}/${d}`);
        if (parsed !== null) {
            onCommit(parsed);
            lastSynced.current = { num: String(parsed[0]), den: String(parsed[1]) };
        }
    };
    const snapOnBlur = () => {
        let n = numText === "" || numText === "-" ? 0 : parseInt(numText, 10);
        let d = denText === "" ? 1 : parseInt(denText, 10);
        if (!Number.isFinite(n))
            n = 0;
        if (!Number.isFinite(d) || d < 1)
            d = 1;
        const parsed = ring.parse(`${n}/${d}`);
        if (parsed === null)
            return;
        setNumText(String(parsed[0]));
        setDenText(String(parsed[1]));
        onCommit(parsed);
        lastSynced.current = { num: String(parsed[0]), den: String(parsed[1]) };
    };
    return (_jsxs("span", { className: "cochain-input cochain-input--fraction", children: [_jsx("input", { type: "number", inputMode: "numeric", value: numText, onChange: (e) => { setNumText(e.target.value); tryCommit(e.target.value, denText); }, onBlur: snapOnBlur }), _jsx("span", { className: "fraction-bar", children: "/" }), _jsx("input", { type: "number", inputMode: "numeric", min: "1", value: denText, onChange: (e) => { setDenText(e.target.value); tryCommit(numText, e.target.value); }, onBlur: snapOnBlur })] }));
}
function ModCycleInput({ value, p, ring, onCommit, }) {
    const v = value[0];
    const goPrev = () => onCommit(ring.fromInt((v - 1 + p) % p));
    const goNext = () => onCommit(ring.fromInt((v + 1) % p));
    return (_jsxs("span", { className: "cochain-input cochain-input--mod-cycle", children: [_jsx("button", { type: "button", onClick: goPrev, title: "previous", children: "\u25C0" }), _jsx("span", { className: "mod-cycle-value", children: v }), _jsx("button", { type: "button", onClick: goNext, title: "next", children: "\u25B6" })] }));
}
function ComplexInput({ value, imagSymbol, onCommit, }) {
    const [a, b] = value;
    const [aText, setAText] = useState(String(a));
    const [bText, setBText] = useState(String(b));
    const lastSynced = useRef({ a: String(a), b: String(b) });
    useEffect(() => {
        const as = String(a), bs = String(b);
        if (as !== lastSynced.current.a || bs !== lastSynced.current.b) {
            setAText(as);
            setBText(bs);
            lastSynced.current = { a: as, b: bs };
        }
    }, [a, b]);
    const commit = (aStr, bStr) => {
        const an = aStr === "" || aStr === "-" ? 0 : parseInt(aStr, 10);
        const bn = bStr === "" || bStr === "-" ? 0 : parseInt(bStr, 10);
        if (!Number.isFinite(an) || !Number.isFinite(bn))
            return;
        onCommit([an, bn]);
        lastSynced.current = { a: String(an), b: String(bn) };
    };
    return (_jsxs("span", { className: "cochain-input cochain-input--complex", children: [_jsx("input", { type: "number", inputMode: "numeric", value: aText, onChange: (e) => { setAText(e.target.value); commit(e.target.value, bText); } }), _jsx("span", { className: "complex-plus", children: " + " }), _jsx("input", { type: "number", inputMode: "numeric", value: bText, onChange: (e) => { setBText(e.target.value); commit(aText, e.target.value); } }), _jsx("span", { className: "complex-imag-sym", children: imagSymbol })] }));
}
function PairSelector({ pair, setPair, minPair, maxPair, }) {
    const goPrev = () => { if (pair > minPair)
        setPair((pair - 1)); };
    const goNext = () => { if (pair < maxPair)
        setPair((pair + 1)); };
    return (_jsxs("div", { className: "pair-selector", children: [_jsx("button", { onClick: goPrev, disabled: pair <= minPair, children: "\u25C0" }), _jsxs("span", { className: "pair-label", children: ["Focus: C", sup(pair), " \u2192 C", sup(pair + 1)] }), _jsx("button", { onClick: goNext, disabled: pair >= maxPair, children: "\u25B6" })] }));
}
function FaceTerm({ sign, face, leading, onClick }) {
    const op = leading ? (sign > 0 ? "" : "−") : sign > 0 ? "+ " : "− ";
    return (_jsxs("span", { className: "delta-eq-term", children: [op, "c(", _jsx("button", { className: "face-chip", onClick: onClick, children: `{${face.join(",")}}` }), ")"] }));
}
function ValueTerm({ sign, value, leading, ring, }) {
    const product = ring.mul(ring.fromInt(sign), value);
    return _jsx("span", { className: "delta-eq-num", children: termFormat(ring, product, leading) });
}
function DeltaEquationRows({ fromK }) {
    const nerve = useNerve();
    const ring = useRing();
    const cochainValues = useStore((s) => s.cochainValues);
    const selectSimplex = useStore((s) => s.selectSimplex);
    const targets = nerve.byDim[fromK + 1] ?? [];
    if (targets.length === 0) {
        return _jsxs("div", { className: "hint", children: ["no ", fromK + 1, "-simplices"] });
    }
    return (_jsx("div", { className: "delta-eq-list", children: targets.map((tau) => {
            const fs = faces(tau);
            const parts = fs.map(({ face, sign }) => ({
                face, sign, v: cochainValues.get(simplexKey(face)) ?? ring.zero,
            }));
            const sum = parts.reduce((a, p) => ring.add(a, ring.mul(ring.fromInt(p.sign), p.v)), ring.zero);
            const sumIsZero = ring.isZero(sum);
            return (_jsxs("div", { className: "delta-eq-row", children: [_jsxs("code", { className: "delta-eq-target", children: ["\u03B4c(", `{${tau.join(",")}}`, ")"] }), _jsx("span", { children: "=" }), _jsx("span", { className: "delta-eq-symbolic", children: parts.map((p, i) => (_jsx(FaceTerm, { sign: p.sign, face: p.face, leading: i === 0, onClick: () => selectSimplex(p.face) }, i))) }), _jsx("span", { children: "=" }), _jsx("span", { className: "delta-eq-numeric", children: parts.map((p, i) => (_jsx(ValueTerm, { sign: p.sign, value: p.v, leading: i === 0, ring: ring }, i))) }), _jsx("span", { children: "=" }), _jsxs("span", { className: `delta-eq-result ${sumIsZero ? "delta-eq-result--zero" : "delta-eq-result--nonzero"}`, children: [ring.format(sum), " ", sumIsZero ? "✓" : "✗"] })] }, simplexKey(tau)));
        }) }));
}
function LayerEditor({ k }) {
    const nerve = useNerve();
    const ring = useRing();
    const cochainValues = useStore((s) => s.cochainValues);
    const setCochainValue = useStore((s) => s.setCochainValue);
    const shadow = useDeltaShadow(k);
    const simplices = nerve.byDim[k] ?? [];
    const showShadow = k > 0;
    if (simplices.length === 0)
        return _jsxs("div", { className: "hint", children: ["no ", k, "-simplices"] });
    return (_jsxs("div", { className: "cochain-editor", children: [showShadow && (_jsxs("div", { className: "cochain-row cochain-row--shadow shadow-row--header", children: [_jsx("span", { children: "simplex" }), _jsxs("span", { children: ["c", sup(k)] }), _jsxs("span", { children: ["\u03B4c", sup(k - 1), " (shadow)"] })] })), simplices.map((s) => {
                const key = simplexKey(s);
                const v = cochainValues.get(key) ?? ring.zero;
                const sh = shadow.get(key) ?? ring.zero;
                const hasShadow = shadow.has(key);
                const matches = showShadow && hasShadow && ring.eq(v, sh);
                return (_jsxs("div", { className: `cochain-row${showShadow ? " cochain-row--shadow" : ""}`, children: [_jsx("code", { children: `{${s.join(",")}}` }), _jsx(CochainInput, { value: v, ring: ring, onCommit: (nv) => setCochainValue(s, nv) }), showShadow && (_jsx("span", { className: `shadow-cell${matches ? " shadow-cell--match" : ""}`, children: hasShadow ? ring.format(sh) : "·" }))] }, key));
            })] }));
}
function LayerStatus({ k }) {
    const nerve = useNerve();
    const ring = useRing();
    const cochainValues = useStore((s) => s.cochainValues);
    const isCo = useIsCoboundary(k);
    const delta = applyCoboundary(cochainValues, nerve, k, ring);
    const isCocycle = delta.size === 0;
    return (_jsxs("div", { className: "layer-status", children: [_jsxs("span", { children: ["c", sup(k), " \u2208 Z", sup(k), "?", " ", _jsx("span", { className: isCocycle ? "anno-yes" : "anno-no", children: isCocycle ? "✓" : "✗" })] }), _jsxs("span", { children: ["c", sup(k), " \u2208 B", sup(k), "?", " ", _jsx("span", { className: isCo ? "anno-yes" : "anno-no", children: isCo ? "✓" : "✗" })] })] }));
}
function CohomologyChip({ k }) {
    const cohK = useCohomology(k);
    const coords = useClassCoordinates(k);
    const ring = useRing();
    const ringSpec = useStore((s) => s.ring);
    const applyCochain = useStore((s) => s.applyCochain);
    const clearCochain = useStore((s) => s.clearCochain);
    const setCohomologyDegree = useStore((s) => s.setCohomologyDegree);
    const setBasisCursor = useStore((s) => s.setBasisCursor);
    const [pos, setPos] = useState(-1);
    const generators = cohK.cocycleBasis.filter((c) => !c.isCoboundary);
    const N = generators.length;
    const hText = formatGroup(cohK.rank, cohK.torsion, ringSpec);
    const coordsText = coords === null
        ? null
        : coords.length === 0
            ? null
            : `[${coords.map((x) => ring.format(x)).join(", ")}]`;
    useEffect(() => { if (pos >= N)
        setPos(-1); }, [N, pos]);
    const goto = (next) => {
        if (N === 0)
            return;
        const cycleLen = N + 1;
        const cycled = (((next + 1) % cycleLen) + cycleLen) % cycleLen - 1;
        setPos(cycled);
        setBasisCursor(cycled);
        setCohomologyDegree(k);
        if (cycled === -1)
            clearCochain();
        else
            applyCochain(k, generators[cycled].cochain.values);
    };
    const posLabel = pos === -1 ? "0" : `g${pos + 1}`;
    const clearLocal = () => {
        setPos(-1);
        setBasisCursor(-1);
        setCohomologyDegree(k);
        clearCochain();
    };
    return (_jsxs("div", { className: "h-chip-row", children: [_jsxs("span", { className: "h-chip h-chip--inert", children: ["H", sup(k), " = ", hText] }), N > 0 ? (_jsx("span", { className: `h-chip-class ${coords === null ? "h-chip-class--none" : ""}`, title: coords === null
                    ? "current c is not a cocycle, or its class needs torsion reduction"
                    : "coordinates of current c in H^k, in the basis g1, g2, …", children: coords === null ? "class = —" : `class = ${coordsText ?? "0"}` })) : (_jsx("span", { className: "h-chip-meta", children: "no free generators" })), N > 0 && (_jsxs("span", { className: "h-chip-nav", children: [_jsxs("span", { className: "h-chip-nav-label", children: ["set c", sup(k), " to:"] }), _jsx("button", { onClick: () => goto(pos - 1), title: "previous", children: "\u2039" }), _jsx("span", { className: "h-chip-pos", children: posLabel }), _jsx("button", { onClick: () => goto(pos + 1), title: "next", children: "\u203A" }), _jsxs("span", { className: "h-chip-meta", children: ["(basis: g1", N > 1 ? `, …, g${N}` : "", ")"] })] })), _jsxs("button", { className: "h-chip-clear", onClick: clearLocal, title: `Clear any manual values typed into c${sup(k)}`, children: ["Clear c", sup(k)] })] }));
}
function LayerCard({ k }) {
    return (_jsxs("div", { className: "layer-card", children: [_jsxs("h3", { className: "layer-card__title", children: ["C", sup(k)] }), k > 0 && (_jsxs("section", { className: "delta-eq-section", children: [_jsxs("h4", { children: ["\u03B4", sup(k - 1), " acting on current c", sup(k - 1)] }), _jsx(DeltaEquationRows, { fromK: k - 1 })] })), _jsxs("section", { children: [_jsxs("h4", { className: "layer-card__section-title", children: ["C", sup(k), " editor"] }), _jsx(LayerEditor, { k: k })] }), _jsx(LayerStatus, { k: k }), _jsx(CohomologyChip, { k: k })] }));
}
function CupProductSection() {
    const nerve = useNerve();
    const ring = useRing();
    const q = useStore((s) => s.cohomologyDegree);
    const pickedDegree = useStore((s) => s.cupPickedDegree);
    const pickedIndex = useStore((s) => s.cupPickedIndex);
    const basisOnLeft = useStore((s) => s.cupBasisOnLeft);
    const setPickedDegree = useStore((s) => s.setCupPickedDegree);
    const setPickedIndex = useStore((s) => s.setCupPickedIndex);
    const setBasisOnLeft = useStore((s) => s.setCupBasisOnLeft);
    const basisH = useCohomology(pickedDegree);
    const generators = basisH.cocycleBasis.filter((c) => !c.isCoboundary);
    const idx = Math.min(pickedIndex, Math.max(0, generators.length - 1));
    const tooHigh = pickedDegree + q > 2;
    const preview = useCupResult();
    const delta = preview
        ? applyCoboundary(preview.result.values, nerve, preview.result.degree, ring)
        : new Map();
    return (_jsxs("section", { className: "cup-section", children: [_jsxs("h3", { children: ["Cup product H", _jsx("sup", { children: "p" }), " \u2323 H", _jsx("sup", { children: "q" }), " \u2192 H", _jsx("sup", { children: "p+q" })] }), _jsxs("div", { className: "cup-controls", children: [_jsxs("label", { children: ["p:", _jsxs("select", { value: pickedDegree, onChange: (e) => setPickedDegree(Number(e.target.value)), children: [_jsx("option", { value: 0, children: "0" }), _jsx("option", { value: 1, children: "1" }), _jsx("option", { value: 2, children: "2" })] })] }), _jsxs("span", { className: "cup-q", children: ["q = ", q, " (current focused degree)"] }), generators.length > 0 && (_jsxs("label", { children: ["generator of H", sup(pickedDegree), ":", _jsx("select", { value: idx, onChange: (e) => setPickedIndex(Number(e.target.value)), children: generators.map((_, i) => (_jsxs("option", { value: i, children: ["g", i + 1] }, i))) })] })), _jsxs("label", { children: [_jsx("input", { type: "radio", checked: basisOnLeft, onChange: () => setBasisOnLeft(true) }), "basis \u2323 current"] }), _jsxs("label", { children: [_jsx("input", { type: "radio", checked: !basisOnLeft, onChange: () => setBasisOnLeft(false) }), "current \u2323 basis"] })] }), generators.length === 0 ? (_jsxs("div", { className: "hint", children: ["no free generators in H", sup(pickedDegree)] })) : tooHigh ? (_jsxs("div", { className: "hint", children: ["p + q = ", pickedDegree + q, " > 2 \u2014 pick p \u2264 ", 2 - q] })) : preview ? (_jsxs("div", { className: "cup-result", children: [_jsxs("div", { className: "hint", children: ["result in C", sup(preview.result.degree), ":"] }), preview.result.values.size === 0 ? (_jsx("div", { className: "hint", children: "all zeros" })) : (_jsx("ul", { children: [...preview.result.values.entries()].map(([key, v]) => (_jsxs("li", { children: [_jsx("code", { children: `{${key}}` }), ": ", ring.format(v)] }, key))) })), _jsxs("span", { className: `delta-eq-result ${delta.size === 0 ? "delta-eq-result--zero" : "delta-eq-result--nonzero"}`, children: ["\u03B4(result) ", delta.size === 0 ? "= 0  ✓ (cocycle)" : "≠ 0  ✗"] })] })) : null] }));
}
function ChainView() {
    const unlocked = useUnlocked();
    const cohomologyDegree = useStore((s) => s.cohomologyDegree);
    const setCohomologyDegree = useStore((s) => s.setCohomologyDegree);
    const showCupProduct = useStore((s) => s.showCupProduct);
    const showH1 = unlocked.has("h1");
    const showH2 = unlocked.has("h2");
    const maxPair = showH2 ? 1 : 0;
    const initialPair = cohomologyDegree === 2 ? 1 : Math.min(cohomologyDegree, maxPair);
    const [pair, setPairLocal] = useState(initialPair);
    const setPair = (p) => {
        setPairLocal(p);
        setCohomologyDegree(p);
    };
    if (!showH1) {
        return (_jsxs("div", { className: "chain-view", children: [_jsx(LayerCard, { k: 0 }), showCupProduct && _jsx(CupProductSection, {})] }));
    }
    return (_jsxs("div", { className: "chain-view", children: [_jsx(PairSelector, { pair: pair, setPair: setPair, minPair: 0, maxPair: maxPair }), _jsx(LayerCard, { k: pair }), _jsx(LayerCard, { k: (pair + 1) }), showCupProduct && _jsx(CupProductSection, {})] }));
}
export default function CohomologyPanel() {
    const unlocked = useUnlocked();
    return (_jsxs("div", { className: "panel cohomology-panel", children: [_jsxs("div", { className: "panel-header", children: [_jsx("h2", { children: "Cohomology" }), unlocked.has("ring-picker") && _jsx(RingPicker, {})] }), _jsx("div", { className: "panel-body", children: _jsx(ChainView, {}) })] }));
}
