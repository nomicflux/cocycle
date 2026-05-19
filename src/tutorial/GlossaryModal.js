import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useStore } from "../state/store";
import { CHAPTERS } from "./chapters";
import { GLOSSARY } from "./glossary";
function renderInline(text) {
    const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
    const parts = text.split(re);
    return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return _jsx("strong", { children: part.slice(2, -2) }, i);
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
            return _jsx("em", { children: part.slice(1, -1) }, i);
        }
        return _jsx("span", { children: part }, i);
    });
}
function GlossaryItem({ entry }) {
    return (_jsxs("div", { className: "glossary-entry", children: [_jsxs("div", { className: "glossary-term", children: [_jsx("strong", { children: entry.term }), entry.symbol && _jsx("code", { className: "glossary-symbol", children: entry.symbol })] }), _jsx("div", { className: "glossary-short", children: renderInline(entry.short) }), _jsx("div", { className: "glossary-long", children: renderInline(entry.long) })] }));
}
export default function GlossaryModal() {
    const open = useStore((s) => s.glossaryOpen);
    const setOpen = useStore((s) => s.setGlossaryOpen);
    if (!open)
        return null;
    const byChapter = CHAPTERS.map((c) => ({
        chapter: c,
        entries: GLOSSARY.filter((g) => g.introducedIn === c.id),
    })).filter((g) => g.entries.length > 0);
    return (_jsx("div", { className: "welcome-backdrop", onClick: () => setOpen(false), children: _jsxs("div", { className: "glossary-modal", role: "dialog", "aria-modal": "true", "aria-label": "Glossary", onClick: (e) => e.stopPropagation(), children: [_jsxs("header", { className: "glossary-header", children: [_jsx("h2", { children: "Glossary" }), _jsx("button", { className: "glossary-close", onClick: () => setOpen(false), "aria-label": "Close glossary", children: "\u00D7" })] }), _jsx("div", { className: "glossary-body", children: byChapter.map(({ chapter, entries }) => (_jsxs("section", { className: "glossary-section", children: [_jsx("h3", { className: "glossary-chapter-title", children: chapter.title }), entries.map((e) => (_jsx(GlossaryItem, { entry: e }, e.term)))] }, chapter.id))) })] }) }));
}
