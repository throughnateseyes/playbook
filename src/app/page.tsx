"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, AlignLeft, AlertTriangle, GitBranch, Phone, ChevronRight, Pin, Clock, Wrench, Headset, Receipt, KeyRound } from "lucide-react";
import { UserMenu } from "../components/UserMenu";
import { WorkspaceSwitcher } from "../components/WorkspaceSwitcher";
import { normalizeSOPs } from '../lib/normalize';
import { useDebouncedValue } from '../lib/hooks/useDebouncedValue';
import { useSOPRepository } from '../lib/hooks/useSOPRepository';
import { INITIAL_SOPS } from './playbook/page';
import type { SOP } from '../types';

// ─── Search index types (mirrored from CommandPalette) ──────────────────────

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

// ─── Search helpers (mirrored from CommandPalette) ──────────────────────────

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

function getStepText(step: unknown): string {
  if (typeof step === "string") return step;
  if (step !== null && typeof step === "object") {
    const s = step as Record<string, unknown>;
    return String(s.title ?? s.text ?? "");
  }
  return "";
}

function buildSearchIndex(sops: SOP[]): SearchEntry[] {
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

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const regex = new RegExp(`(${escapeRegex(query)})`, "gi");
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

function SectionIcon({ label }: { label: string }) {
  const cls = "text-text-faint flex-shrink-0 mt-px";
  if (label.startsWith("Step")) return <AlignLeft size={12} className={cls} />;
  if (label === "Edge Case") return <AlertTriangle size={12} className={cls} />;
  if (label === "Escalation") return <GitBranch size={12} className={cls} />;
  if (label === "Contact") return <Phone size={12} className={cls} />;
  return <AlignLeft size={12} className={cls} />;
}

// ─── Page data ──────────────────────────────────────────────────────────────

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  Operations: Wrench,
  "Resident Support": Headset,
  Finance: Receipt,
  Leasing: KeyRound,
};

// ─── Home component ─────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter();
  const { sops } = useSOPRepository('parkmerced', normalizeSOPs(INITIAL_SOPS));

  // ── Inline search state ───────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebouncedValue(query, 150);
  const searchIndex = useMemo(() => buildSearchIndex(sops), [sops]);

  const categoryPills = useMemo(() => {
    const seen = new Set<string>();
    for (const sop of sops) {
      if (!seen.has(sop.category)) seen.add(sop.category);
    }
    return [
      { label: "Pinned", Icon: Pin },
      { label: "Recent", Icon: Clock },
      ...Array.from(seen).map((cat) => ({ label: cat, Icon: CATEGORY_ICONS[cat] ?? FileText })),
    ];
  }, [sops]);

  // Placeholder: derive pinned/recent from sops until real pin/history state exists
  const pinnedSops = useMemo(() => sops.slice(0, 3), [sops]);
  const recentSops = useMemo(() => sops.slice(0, 4), [sops]);

  const results = useMemo((): SearchEntry[] => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];
    const sopMatches: SopEntry[] = [];
    const sectionMatches: SectionEntry[] = [];
    for (const entry of searchIndex) {
      if (entry.type === "sop") {
        if (entry.sopTitle.toLowerCase().includes(q)) sopMatches.push(entry);
      } else {
        if (entry.text.toLowerCase().includes(q)) sectionMatches.push(entry);
      }
    }
    return [...sopMatches, ...sectionMatches.slice(0, 15)];
  }, [searchIndex, debouncedQuery]);

  const sopResults = results.filter((r): r is SopEntry => r.type === "sop");
  const sectionResults = results.filter((r): r is SectionEntry => r.type === "section");
  const sectionOffset = sopResults.length;
  const activeQuery = debouncedQuery || query;
  const hasResults = results.length > 0;
  const showEmpty = !!debouncedQuery.trim() && !hasResults;

  // Reset selection when results change
  useEffect(() => { setSelectedIndex(0); }, [results]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector('[data-selected="true"]') as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // Click outside → close dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ⌘K → focus input + open dropdown
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setDropdownOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSelectSOP = (id: string) => {
    router.push(`/playbook?sidebar=collapsed&sop=${id}`);
  };

  const handleSelect = useCallback((entry: SearchEntry) => {
    setDropdownOpen(false);
    setQuery("");
    if (entry.type === "sop") {
      router.push(`/playbook?sidebar=collapsed&sop=${entry.sopId}`);
    } else {
      router.push(`/playbook?sidebar=collapsed&sop=${entry.sopId}&q=${encodeURIComponent(debouncedQuery || query)}`);
    }
  }, [router, debouncedQuery, query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!dropdownOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setDropdownOpen(true);
      }
      return;
    }
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
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        } else if (query.trim()) {
          setDropdownOpen(false);
          setQuery("");
          router.push(`/playbook?sidebar=collapsed&q=${encodeURIComponent(query.trim())}`);
        }
        break;
      case "Escape":
        e.preventDefault();
        setDropdownOpen(false);
        inputRef.current?.blur();
        break;
    }
  }, [dropdownOpen, results, selectedIndex, handleSelect]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── Top Nav ──────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between h-14 px-4 border-b border-border bg-background">
        <div className="flex items-center">
          <WorkspaceSwitcher />
        </div>
        <div className="flex items-center gap-3">
          <UserMenu />
        </div>
      </nav>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* ── Hero ───────────────────────────────────────────────── */}
        <div className="pt-24 pb-8 text-center px-6">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground leading-tight">
            What do you need help with, <span className="font-serif font-semibold">Nate</span>?
          </h1>
        </div>

        {/* ── Inline Search ──────────────────────────────────────── */}
        <div className="flex justify-center px-6 mb-6">
          {dropdownOpen && (
            <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" />
          )}
          <div
            ref={wrapperRef}
            className={[
              "relative w-full transition-all duration-300 ease-out",
              dropdownOpen ? "max-w-2xl z-50" : "max-w-xl",
            ].join(" ")}
          >
            {/* Input surface — in normal flow */}
            <div className={[
              "border bg-background transition-all duration-300 ease-out",
              dropdownOpen
                ? "rounded-t-xl border-b-0 border-border shadow-lg"
                : "rounded-xl border-border-muted shadow-sm",
            ].join(" ")}>
              <div className="flex items-center h-12 px-4 gap-3">
                <Search size={16} strokeWidth={1.5} className="text-text-faint flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setDropdownOpen(true); }}
                  onFocus={() => setDropdownOpen(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search the Parkmerced playbook for the right SOP."
                  className="flex-1 min-w-0 bg-transparent text-[15px] text-foreground placeholder:text-text-faint outline-none"
                  aria-autocomplete="list"
                  aria-controls="landing-search-results"
                  aria-activedescendant={results[selectedIndex] ? `ls-result-${results[selectedIndex].id}` : undefined}
                />
                {!query ? (
                  <span className="text-[11px] text-text-faint font-mono select-none tabular-nums flex-shrink-0">
                    ⌘K
                  </span>
                ) : (
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                    className="p-1 text-text-faint hover:text-text-secondary transition-colors rounded flex-shrink-0"
                    aria-label="Clear search"
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M10 3L3 10M3 3l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Results dropdown — floats above page content */}
            {dropdownOpen && (
              <div className="absolute left-0 right-0 top-full z-50 border-x border-b border-border rounded-b-xl bg-background shadow-lg overflow-hidden">
                <div className="border-t border-border-muted" />
                <div
                  ref={listRef}
                  id="landing-search-results"
                  role="listbox"
                  className="overflow-y-auto max-h-[380px] py-2"
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
                      {/* SOP results */}
                      {sopResults.length > 0 && (
                        <div>
                          <div className="px-4 pt-2 pb-1.5">
                            <span className="text-[10px] uppercase tracking-wider font-medium text-text-faint">SOPs</span>
                          </div>
                          {sopResults.map((entry, i) => {
                            const isSelected = i === selectedIndex;
                            return (
                              <div
                                key={entry.id}
                                id={`ls-result-${entry.id}`}
                                role="option"
                                aria-selected={isSelected}
                                data-selected={isSelected}
                                className={[
                                  "flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors duration-100 select-none",
                                  isSelected ? "bg-surface-2" : "hover:bg-surface",
                                ].join(" ")}
                                onClick={() => handleSelect(entry)}
                                onMouseEnter={() => setSelectedIndex(i)}
                              >
                                <FileText size={14} className="text-text-faint flex-shrink-0" strokeWidth={1.5} />
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm text-foreground">
                                    <HighlightMatch text={entry.sopTitle} query={activeQuery} />
                                  </span>
                                </div>
                                <span className="text-xs text-text-faint flex-shrink-0">{entry.sopCategory}</span>
                                <ChevronRight size={12} className="text-text-faint flex-shrink-0" strokeWidth={1.5} />
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Section results */}
                      {sectionResults.length > 0 && (
                        <div className={sopResults.length > 0 ? "mt-1 pt-2 border-t border-border-muted" : ""}>
                          <div className="px-4 pt-1.5 pb-1.5">
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-text-faint">Matches in sections</span>
                          </div>
                          {sectionResults.map((entry, i) => {
                            const flatIndex = sectionOffset + i;
                            const isSelected = flatIndex === selectedIndex;
                            const snippet = getSnippet(entry.text, activeQuery);
                            return (
                              <div
                                key={entry.id}
                                id={`ls-result-${entry.id}`}
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
                                  <p className="text-[13px] font-semibold text-foreground truncate leading-snug">{entry.sopTitle}</p>
                                  <p className="text-[11px] text-text-muted leading-none mt-0.5 mb-1">{entry.sectionLabel}</p>
                                  <p className="text-[12px] text-text-faint leading-relaxed line-clamp-2">
                                    <HighlightMatch text={snippet} query={activeQuery} />
                                  </p>
                                </div>
                                <ChevronRight size={11} className="text-text-faint flex-shrink-0 mt-1" strokeWidth={1.5} />
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
                    {([
                      { key: "↵", label: "select" },
                      { key: "↑↓", label: "navigate" },
                      { key: "esc", label: "close" },
                    ] as const).map(({ key, label }) => (
                      <span key={label} className="flex items-center gap-1.5 text-text-faint">
                        <kbd className="px-1.5 py-0.5 bg-surface-2 border border-border rounded text-[11px] font-mono leading-none">{key}</kbd>
                        <span className="text-[11px]">{label}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* ── Category Pills ────────────────────────────────────── */}
        <div className="flex gap-1.5 flex-wrap justify-center px-6 mb-12">
          {categoryPills.map(({ label, Icon }) => (
            <button
              key={label}
              type="button"
              className="inline-flex items-center gap-1.5 h-8 px-3 text-[13px] rounded-full border border-border-muted bg-surface text-text-secondary hover:bg-surface-2 hover:border-border-strong active:bg-surface-3 transition-all duration-150 cursor-pointer"
            >
              <Icon size={13} strokeWidth={1.75} className="text-text-faint flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* ── Content Section ────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-6 pb-16">
          {/* Two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left — Pinned SOPs (card style) */}
            <div>
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text-secondary mb-4">
                Pinned
              </h2>
              <div className="space-y-3">
                {pinnedSops.map((sop) => (
                  <button
                    key={sop.id}
                    type="button"
                    onClick={() => handleSelectSOP(sop.id)}
                    className="w-full text-left bg-surface border border-border-muted rounded-xl p-4 hover:border-border-strong hover:shadow-sm active:bg-surface-2 transition-all duration-150 cursor-pointer"
                  >
                    <p className="text-[15px] font-medium text-foreground mb-1.5">
                      {sop.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-text-muted">{sop.category}</span>
                      <span className="text-[11px] text-text-faint">·</span>
                      <span className="text-[11px] text-text-faint">{sop.lastUpdated}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right — Recent SOPs (compact list) */}
            <div>
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text-secondary mb-4">
                Recent
              </h2>
              <div className="bg-surface border border-border-muted rounded-xl divide-y divide-border-muted">
                {recentSops.map((sop) => (
                  <button
                    key={sop.id}
                    type="button"
                    onClick={() => handleSelectSOP(sop.id)}
                    className="w-full text-left px-4 py-3 hover:bg-surface-2 first:rounded-t-xl last:rounded-b-xl transition-all duration-150 cursor-pointer"
                  >
                    <p className="text-[14px] font-medium text-foreground">{sop.title}</p>
                    <p className="text-[12px] text-text-faint mt-0.5">{sop.lastUpdated}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
