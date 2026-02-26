import type { SOP } from "../types";

// ─── Search index types ──────────────────────────────────────────────────────

export type SopEntry = {
  type: "sop";
  id: string;
  sopId: string;
  sopTitle: string;
  sopCategory: string;
};

export type SectionEntry = {
  type: "section";
  id: string;
  sopId: string;
  sopTitle: string;
  sectionLabel: string;
  text: string;
};

export type SearchEntry = SopEntry | SectionEntry;

// ─── Search helpers ──────────────────────────────────────────────────────────

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function getSnippet(text: string, query: string, maxLen = 120): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, maxLen) + (text.length > maxLen ? "…" : "");
  const start = Math.max(0, idx - 35);
  const end = Math.min(text.length, idx + query.length + 65);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}

export function getStepText(step: unknown): string {
  if (typeof step === "string") return step;
  if (step !== null && typeof step === "object") {
    const s = step as Record<string, unknown>;
    return String(s.title ?? s.text ?? "");
  }
  return "";
}

export function buildSearchIndex(sops: SOP[]): SearchEntry[] {
  const entries: SearchEntry[] = [];
  for (const sop of sops) {
    entries.push({ type: "sop", id: `sop:${sop.id}`, sopId: sop.id, sopTitle: sop.title, sopCategory: sop.category });

    if (sop.overview) {
      entries.push({ type: "section", id: `sec:${sop.id}:overview`, sopId: sop.id, sopTitle: sop.title, sectionLabel: "Overview", text: sop.overview });
    }

    sop.steps.forEach((step, i) => {
      const title = getStepText(step);
      const stepObj = (step !== null && typeof step === "object") ? step as unknown as Record<string, unknown> : null;
      const parts = [title, stepObj?.text as string | undefined, stepObj?.script as string | undefined].filter(Boolean) as string[];
      const text = parts.join(" — ");
      if (text.trim()) {
        entries.push({ type: "section", id: `sec:${sop.id}:step:${i}`, sopId: sop.id, sopTitle: sop.title, sectionLabel: `Step ${i + 1}`, text });
      }
    });

    sop.edgeCases.forEach((ec, i) => {
      const text = [ec.title, ec.description].filter(Boolean).join(": ");
      if (text.trim()) {
        entries.push({ type: "section", id: `sec:${sop.id}:edge:${i}`, sopId: sop.id, sopTitle: sop.title, sectionLabel: "Edge Case", text });
      }
    });

    const escalationText = [sop.escalation.when, sop.escalation.who].filter(Boolean).join(" — ");
    if (escalationText.trim()) {
      entries.push({ type: "section", id: `sec:${sop.id}:escalation`, sopId: sop.id, sopTitle: sop.title, sectionLabel: "Escalation", text: escalationText });
    }

    sop.contacts.forEach((c, i) => {
      const text = [c.name, c.role, c.description].filter(Boolean).join(" · ");
      if (text.trim()) {
        entries.push({ type: "section", id: `sec:${sop.id}:contact:${i}`, sopId: sop.id, sopTitle: sop.title, sectionLabel: "Contact", text });
      }
    });
  }
  return entries;
}
