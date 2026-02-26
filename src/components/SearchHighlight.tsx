import { AlignLeft, AlertTriangle, GitBranch, Phone } from "lucide-react";
import { escapeRegex } from "../lib/search";

// ─── HighlightMatch ──────────────────────────────────────────────────────────

export function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${escapeRegex(query)})`, "i");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} className="bg-highlight text-highlight-text leading-[inherit] whitespace-pre-wrap">{part}</span>
        ) : (
          part
        )
      )}
    </>
  );
}

// ─── SectionIcon ─────────────────────────────────────────────────────────────

export function SectionIcon({ label }: { label: string }) {
  const cls = "text-text-faint flex-shrink-0 mt-px";
  if (label.startsWith("Step")) return <AlignLeft size={12} className={cls} />;
  if (label === "Edge Case") return <AlertTriangle size={12} className={cls} />;
  if (label === "Escalation") return <GitBranch size={12} className={cls} />;
  if (label === "Contact") return <Phone size={12} className={cls} />;
  return <AlignLeft size={12} className={cls} />;
}
