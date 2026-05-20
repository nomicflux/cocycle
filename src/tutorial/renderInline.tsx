import type { ReactNode } from "react";

const TOKEN = /(\*\*[^*]+\*\*|\*[^*]+\*|\^\{[^}]+\}|_\{[^}]+\})/g;

export function renderInline(text: string): ReactNode[] {
  return text.split(TOKEN).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("^{") && part.endsWith("}")) {
      return <sup key={i}>{part.slice(2, -1)}</sup>;
    }
    if (part.startsWith("_{") && part.endsWith("}")) {
      return <sub key={i}>{part.slice(2, -1)}</sub>;
    }
    return <span key={i}>{part}</span>;
  });
}
