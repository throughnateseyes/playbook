"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, FileText, AlignLeft, AlertTriangle, GitBranch, Phone, ChevronRight } from "lucide-react";
import type { SOP } from "../types";
import { useDebouncedValue } from "../lib/hooks/useDebouncedValue";

// ─── Types ────────────────────────────────────────────────────────────────────

type SopEntry = {
  type: "sop";
  id: string;
  sopId: string;
  sopTitle: string;
  sopCategory: string;
};

type SectionEntry = {
  type: "section";
  id: string;
  sopId: string;
  sopTitle: string;
  sectionLabel: string;
  text: string;
};

type SearchEntry = SopEntry | SectionEntry;

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  sops: SOP[];
  onSelectSOP: (sop: SOP) => void;
  onNavigateToSection: (sopId: string, query: string) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSnippet(text: string, query: string, maxLen = 120): string {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, maxLen) + (text.length > maxLen ? "…" : "");
  const start = Math.max(0, idx - 35);
  const end = Math.min(text.length, idx + query.length + 65);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}

// Safely extract a displayable string from a step, regardless of shape.
// Handles Step objects { title, description, script }, legacy strings,
// and any unexpected runtime shapes — never throws.
function getStepText(step: unknown): string {
  if (typeof step === "string") return step;
  if (step !== null && typeof step === "object") {
    const s = step as Record<string, unknown>;
    // Current shape: { title }. Legacy / alternate shape: { text }.
    return String(s.title ?? s.text ?? "");
  }
  return "";
}

function buildSearchIndex(sops: SOP[]): SearchEntry[] {
  const entries: SearchEntry[] = [];
  for (const sop of sops) {
    entries.push({
      type: "sop",
      id: `sop:${sop.id}`,
      sopId: sop.id,
      sopTitle: sop.title,
      sopCategory: sop.category,
    });

    if (sop.overview) {
      entries.push({
        type: "section",
        id: `sec:${sop.id}:overview`,
        sopId: sop.id,
        sopTitle: sop.title,
        sectionLabel: "Overview",
        text: sop.overview,
      });
    }

    sop.steps.forEach((step, i) => {
      const title = getStepText(step);
      const stepObj = (step !== null && typeof step === "object") ? step as unknown as Record<string, unknown> : null;
      const parts = [title, stepObj?.text as string | undefined, stepObj?.script as string | undefined].filter(Boolean) as string[];
      const text = parts.join(" — ");
      if (text.trim()) {
        entries.push({
          type: "section",
          id: `sec:${sop.id}:step:${i}`,
          sopId: sop.id,
          sopTitle: sop.title,
          sectionLabel: `Step ${i + 1}`,
          text,
        });
      }
    });

    sop.edgeCases.forEach((ec, i) => {
      const text = [ec.title, ec.description].filter(Boolean).join(": ");
      if (text.trim()) {
        entries.push({
          type: "section",
          id: `sec:${sop.id}:edge:${i}`,
          sopId: sop.id,
          sopTitle: sop.title,
          sectionLabel: "Edge Case",
          text,
        });
      }
    });

    const escalationText = [sop.escalation.when, sop.escalation.who]
      .filter(Boolean)
      .join(" — ");
    if (escalationText.trim()) {
      entries.push({
        type: "section",
        id: `sec:${sop.id}:escalation`,
        sopId: sop.id,
        sopTitle: sop.title,
        sectionLabel: "Escalation",
        text: escalationText,
      });
    }

    sop.contacts.forEach((c, i) => {
      const text = [c.name, c.role, c.description].filter(Boolean).join(" · ");
      if (text.trim()) {
        entries.push({
          type: "section",
          id: `sec:${sop.id}:contact:${i}`,
          sopId: sop.id,
          sopTitle: sop.title,
          sectionLabel: "Contact",
          text,
        });
      }
    });
  }
  return entries;
}

// ─── HighlightMatch ───────────────────────────────────────────────────────────

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span
            key={i}
            className="bg-highlight text-highlight-text leading-[inherit] whitespace-pre-wrap"
          >
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
}

// ─── SectionIcon ─────────────────────────────────────────────────────────────

function SectionIcon({ label }: { label: string }) {
  const cls = "text-text-faint flex-shrink-0 mt-px";
  if (label.startsWith("Step")) return <AlignLeft size={12} className={cls} />;
  if (label === "Edge Case") return <AlertTriangle size={12} className={cls} />;
  if (label === "Escalation") return <GitBranch size={12} className={cls} />;
  if (label === "Contact") return <Phone size={12} className={cls} />;
  return <AlignLeft size={12} className={cls} />;
}

// ─── CommandPalette ───────────────────────────────────────────────────────────

const CommandPalette = React.memo(function CommandPalette({
  isOpen,
  onClose,
  sops,
  onSelectSOP,
  onNavigateToSection,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebouncedValue(query, 150);

  // Build search index once per sops change
  const searchIndex = useMemo(() => buildSearchIndex(sops), [sops]);

  // Filter + rank results
  const results = useMemo((): SearchEntry[] => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];

    const sopMatches: SopEntry[] = [];
    const sectionMatches: SectionEntry[] = [];

    for (const entry of searchIndex) {
      if (entry.type === "sop") {
        if (entry.sopTitle.toLowerCase().includes(q)) {
          sopMatches.push(entry);
        }
      } else {
        if (entry.text.toLowerCase().includes(q)) {
          sectionMatches.push(entry);
        }
      }
    }

    return [...sopMatches, ...sectionMatches.slice(0, 15)];
  }, [searchIndex, debouncedQuery]);

  const sopResults = results.filter((r): r is SopEntry => r.type === "sop");
  const sectionResults = results.filter(
    (r): r is SectionEntry => r.type === "section"
  );
  const sopOffset = 0;
  const sectionOffset = sopResults.length;

  // Reset selection index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Reset query + selection when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(
      '[data-selected="true"]'
    ) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleSelect = useCallback(
    (entry: SearchEntry) => {
      if (entry.type === "sop") {
        const sop = sops.find((s) => s.id === entry.sopId);
        if (sop) onSelectSOP(sop);
        onClose();
      } else {
        // Don't call onClose() here — onNavigateToSection's page.tsx callback
        // already calls setCommandPaletteOpen(false). Calling onClose() here
        // would batch with setSearchQuery(query) and clear it before marks render.
        onNavigateToSection(entry.sopId, debouncedQuery || query);
      }
    },
    [sops, onSelectSOP, onNavigateToSection, onClose, debouncedQuery, query]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) handleSelect(results[selectedIndex]);
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "Tab": {
          // Simple focus trap
          const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
            'input, button, [tabindex]:not([tabindex="-1"])'
          );
          if (!focusable || focusable.length === 0) break;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
          break;
        }
      }
    },
    [results, selectedIndex, handleSelect, onClose]
  );

  if (!isOpen) return null;

  const activeQuery = debouncedQuery || query;
  const hasResults = results.length > 0;
  const showEmpty = debouncedQuery.trim() && !hasResults;

  return <CommandPaletteInner {...{ modalRef, inputRef, listRef, query, setQuery, handleKeyDown, activeQuery, hasResults, showEmpty, debouncedQuery, results, selectedIndex, setSelectedIndex, sopResults, sectionResults, sopOffset, sectionOffset, handleSelect, onClose }} />;
});

export default CommandPalette;

// Separated so the enter animation runs fresh on every open (component mounts = isOpen flips to true)
function CommandPaletteInner({
  modalRef, inputRef, listRef,
  query, setQuery, handleKeyDown,
  activeQuery, hasResults, showEmpty, debouncedQuery,
  results, selectedIndex, setSelectedIndex,
  sopResults, sectionResults, sopOffset, sectionOffset,
  handleSelect, onClose,
}: {
  modalRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  listRef: React.RefObject<HTMLDivElement | null>;
  query: string;
  setQuery: (v: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  activeQuery: string;
  hasResults: boolean;
  showEmpty: boolean | string;
  debouncedQuery: string;
  results: SearchEntry[];
  selectedIndex: number;
  setSelectedIndex: (i: number) => void;
  sopResults: SopEntry[];
  sectionResults: SectionEntry[];
  sopOffset: number;
  sectionOffset: number;
  handleSelect: (entry: SearchEntry) => void;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center pt-[14vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      {/* Backdrop — no blur: backdrop-filter forces GPU compositing on every frame */}
      <div
        className="absolute inset-0 bg-black/[0.12]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Palette container — only the card animates (scale + opacity) */}
      <div
        ref={modalRef}
        className={[
          "relative w-full max-w-[680px] mx-4 bg-background rounded-2xl border border-border shadow-xl overflow-hidden",
          "transition-all duration-[140ms] ease-out",
          visible ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]",
        ].join(" ")}
        onKeyDown={handleKeyDown}
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-muted">
          <Search size={15} className="text-text-faint flex-shrink-0" strokeWidth={1.75} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you need help with?"
            className="flex-1 text-sm text-foreground placeholder:text-text-faint bg-transparent outline-none"
            aria-label="Search"
            aria-autocomplete="list"
            aria-controls="cp-results"
            aria-activedescendant={
              results[selectedIndex]
                ? `cp-result-${results[selectedIndex].id}`
                : undefined
            }
          />
          {query && (
            <button
              tabIndex={-1}
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 text-text-faint hover:text-text-secondary transition-colors rounded"
              aria-label="Clear"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path
                  d="M10 3L3 10M3 3l7 7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Results list */}
        <div
          ref={listRef}
          id="cp-results"
          role="listbox"
          className="overflow-y-auto max-h-[440px] py-2"
        >
          {!query.trim() ? (
            <div className="px-4 py-10 text-center text-sm text-text-faint">
              Type to search SOPs and sections
            </div>
          ) : showEmpty ? (
            <div className="px-4 py-10 text-center text-sm text-text-faint">
              No results for &ldquo;{debouncedQuery}&rdquo;
            </div>
          ) : (
            <>
              {/* SOP results group */}
              {sopResults.length > 0 && (
                <div>
                  <div className="px-4 pt-2 pb-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-medium text-text-faint">
                      SOPs
                    </span>
                  </div>
                  {sopResults.map((entry, i) => {
                    const flatIndex = sopOffset + i;
                    const isSelected = flatIndex === selectedIndex;
                    return (
                      <div
                        key={entry.id}
                        id={`cp-result-${entry.id}`}
                        role="option"
                        aria-selected={isSelected}
                        data-selected={isSelected}
                        className={[
                          "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-100 select-none",
                          isSelected ? "bg-surface-2" : "hover:bg-surface",
                        ].join(" ")}
                        onClick={() => handleSelect(entry)}
                        onMouseEnter={() => setSelectedIndex(flatIndex)}
                      >
                        <FileText
                          size={14}
                          className="text-text-faint flex-shrink-0"
                          strokeWidth={1.5}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-foreground">
                            <HighlightMatch
                              text={entry.sopTitle}
                              query={activeQuery}
                            />
                          </span>
                        </div>
                        <span className="text-xs text-text-faint flex-shrink-0">
                          {entry.sopCategory}
                        </span>
                        <ChevronRight
                          size={12}
                          className="text-text-faint flex-shrink-0"
                          strokeWidth={1.5}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Section results group */}
              {sectionResults.length > 0 && (
                <div
                  className={
                    sopResults.length > 0
                      ? "mt-1 pt-2 border-t border-border-muted"
                      : ""
                  }
                >
                  <div className="px-4 pt-1.5 pb-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-text-faint">
                      Matches in sections
                    </span>
                  </div>
                  {sectionResults.map((entry, i) => {
                    const flatIndex = sectionOffset + i;
                    const isSelected = flatIndex === selectedIndex;
                    const snippet = getSnippet(entry.text, activeQuery);
                    return (
                      <div
                        key={entry.id}
                        id={`cp-result-${entry.id}`}
                        role="option"
                        aria-selected={isSelected}
                        data-selected={isSelected}
                        className={[
                          "flex items-start gap-3 mx-2 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-100 select-none",
                          isSelected ? "bg-surface-2" : "hover:bg-surface",
                        ].join(" ")}
                        onClick={() => handleSelect(entry)}
                        onMouseEnter={() => setSelectedIndex(flatIndex)}
                      >
                        <div className="mt-[3px]">
                          <SectionIcon label={entry.sectionLabel} />
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Primary: SOP title */}
                          <p className="text-[13px] font-semibold text-foreground truncate leading-snug">
                            {entry.sopTitle}
                          </p>
                          {/* Secondary: section label */}
                          <p className="text-[11px] text-text-muted leading-none mt-0.5 mb-1">
                            {entry.sectionLabel}
                          </p>
                          {/* Tertiary: snippet */}
                          <p className="text-[12px] text-text-faint leading-relaxed line-clamp-2">
                            <HighlightMatch text={snippet} query={activeQuery} />
                          </p>
                        </div>
                        <ChevronRight
                          size={11}
                          className="text-text-faint flex-shrink-0 mt-1"
                          strokeWidth={1.5}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer hints */}
        {hasResults && (
          <div className="px-4 py-2.5 border-t border-border-muted flex items-center gap-5">
            {(
              [
                { key: "↵", label: "select" },
                { key: "↑↓", label: "navigate" },
                { key: "esc", label: "close" },
              ] as const
            ).map(({ key, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-text-faint">
                <kbd className="px-1.5 py-0.5 bg-surface-2 border border-border rounded text-[11px] font-mono leading-none">
                  {key}
                </kbd>
                <span className="text-[11px]">{label}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
