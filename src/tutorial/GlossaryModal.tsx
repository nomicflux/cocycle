import type { ReactNode } from "react";
import { useStore } from "../state/store";
import { CHAPTERS } from "./chapters";
import { GLOSSARY, type GlossaryEntry } from "./glossary";

function renderInline(text: string): ReactNode[] {
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  const parts = text.split(re);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
}

function GlossaryItem({ entry }: { entry: GlossaryEntry }) {
  return (
    <div className="glossary-entry">
      <div className="glossary-term">
        <strong>{entry.term}</strong>
        {entry.symbol && <code className="glossary-symbol">{entry.symbol}</code>}
      </div>
      <div className="glossary-short">{renderInline(entry.short)}</div>
      <div className="glossary-long">{renderInline(entry.long)}</div>
    </div>
  );
}

export default function GlossaryModal() {
  const open = useStore((s) => s.glossaryOpen);
  const setOpen = useStore((s) => s.setGlossaryOpen);
  if (!open) return null;

  const byChapter = CHAPTERS.map((c) => ({
    chapter: c,
    entries: GLOSSARY.filter((g) => g.introducedIn === c.id),
  })).filter((g) => g.entries.length > 0);

  return (
    <div className="welcome-backdrop" onClick={() => setOpen(false)}>
      <div
        className="glossary-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Glossary"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="glossary-header">
          <h2>Glossary</h2>
          <button
            className="glossary-close"
            onClick={() => setOpen(false)}
            aria-label="Close glossary"
          >
            ×
          </button>
        </header>
        <div className="glossary-body">
          {byChapter.map(({ chapter, entries }) => (
            <section key={chapter.id} className="glossary-section">
              <h3 className="glossary-chapter-title">{chapter.title}</h3>
              {entries.map((e) => (
                <GlossaryItem key={e.term} entry={e} />
              ))}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
