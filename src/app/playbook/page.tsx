"use client";

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { SOP } from '../../types';
import { normalizeSOPs } from '../../lib/normalize';
import Sidebar from '../../components/Sidebar';
import CommandPalette from '../../components/CommandPalette';
import SopDetail from '../../components/SopDetail';
import SopForm from '../../components/SopForm';
import { UserMenu } from '../../components/UserMenu';
import { useSOPRepository } from '../../lib/hooks/useSOPRepository';
import { MOCK_SOPS } from '../../lib/mockSops';

export const INITIAL_SOPS = MOCK_SOPS;

const CATEGORIES = ['Operations', 'Resident Support', 'Finance', 'Leasing'];

const AskAISection = React.memo(function AskAISection({ selectedSOP }: { selectedSOP: SOP }) {
  const [question, setQuestion] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const handleAskAI = () => {
    if (!question.trim()) return;
    setIsThinking(true);
    setAiResponse(null);
    setTimeout(() => {
      setAiResponse(
        `Based on "${selectedSOP.title}", you should start by reviewing: "${selectedSOP.steps[0]?.title ?? selectedSOP.steps[0]?.text ?? ''}". If this issue involves escalation, reference: "${selectedSOP.escalation.when}".`
      );
      setIsThinking(false);
    }, 800);
  };

  return (
    <section className="border-t border-border-muted pt-6 pb-8">
      <p className="ty-section-label mb-5">
        Ask About This Procedure
      </p>

      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Ask a question about this procedure..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
          className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-[14px] text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
        />
        <button
          onClick={handleAskAI}
          disabled={!question.trim()}
          className="px-4 py-2.5 bg-foreground text-background text-[13px] font-medium rounded-xl hover:bg-foreground/80 active:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Ask
        </button>
      </div>

      {isThinking && (
        <div className="flex items-center gap-2 text-[13px] text-text-faint">
          <div className="w-3.5 h-3.5 border-[1.5px] border-text-faint border-t-transparent rounded-full animate-spin"></div>
          <span>Thinking...</span>
        </div>
      )}

      {aiResponse && (
        <div className="mt-3 px-4 py-3.5 bg-surface border border-border rounded-xl">
          <p className="text-[13px] text-text-secondary leading-relaxed">
            {aiResponse}
          </p>
        </div>
      )}
    </section>
  );
});

function PlaybookContent() {
  const searchParams = useSearchParams();
  const sidebarCollapsed = searchParams.get("sidebar") === "collapsed";
  const { sops, createSOP, updateSOP } = useSOPRepository('parkmerced', normalizeSOPs(INITIAL_SOPS));
  const [selectedSOP, setSelectedSOP] = useState<SOP | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [editingSOP, setEditingSOP] = useState<SOP | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const PINS_KEY = "playbook_pins";
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  // Hydration-safe: read localStorage only after mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PINS_KEY);
      if (raw) setPinnedIds(new Set(JSON.parse(raw) as string[]));
    } catch {}
  }, []);
  const togglePin = useCallback((id: string) => {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try { localStorage.setItem(PINS_KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearchQuery(searchQuery), 200);
    return () => clearTimeout(t);
  }, [searchQuery]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const detailContainerRef = useRef<HTMLDivElement>(null);

  const closePanel = useCallback(() => {
    setShowAddPanel(false);
    setIsEditMode(false);
    setEditingSOP(null);
  }, []);

  const scrollToMatch = (index: number) => {
    if (!detailContainerRef.current) return;

    const marks = detailContainerRef.current.querySelectorAll('[data-match="true"]');
    if (marks.length === 0) return;

    const targetIndex = ((index % marks.length) + marks.length) % marks.length;
    const targetMark = marks[targetIndex] as HTMLElement;

    const containerTop = detailContainerRef.current.getBoundingClientRect().top;
    const markTop = targetMark.getBoundingClientRect().top;
    const offset = markTop - containerTop - 80;

    detailContainerRef.current.scrollBy({
      top: offset,
      behavior: "smooth",
    });

    setCurrentMatchIndex(targetIndex);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!selectedSOP || !searchQuery.trim()) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        scrollToMatch(currentMatchIndex - 1);
      } else if (e.metaKey || e.ctrlKey) {
        scrollToMatch(currentMatchIndex + 1);
      } else {
        scrollToMatch(0);
      }
    }
  };

  useEffect(() => {
    if (!selectedSOP || !debouncedSearchQuery.trim() || !detailContainerRef.current) {
      setTotalMatches(0);
      setCurrentMatchIndex(0);
      return;
    }

    setTimeout(() => {
      if (!detailContainerRef.current) return;
      const marks = detailContainerRef.current.querySelectorAll('[data-match="true"]');
      setTotalMatches(marks.length);
      setCurrentMatchIndex(0);
    }, 50);
  }, [debouncedSearchQuery, selectedSOP]);

  useEffect(() => {
    if (selectedSOP && detailContainerRef.current) {
      detailContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [selectedSOP?.id]);

  // ── Cmd+K / '/' → open command palette ──────────────────────────────────────
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }
      if (e.key === '/') {
        const target = e.target as HTMLElement;
        const inInput =
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable;
        if (!inInput) {
          e.preventDefault();
          setCommandPaletteOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, []);

  // ── Navigate palette section match → select SOP + highlight + scroll ────────
  const handleNavigateToSection = useCallback(
    (sopId: string, query: string) => {
      const sop = sops.find((s) => s.id === sopId);
      if (!sop) return;
      setSelectedSOP(sop);
      setSearchQuery(query);
      // Wait for debounce (200ms) + render, then scroll to first highlight
      setTimeout(() => {
        if (!detailContainerRef.current) return;
        detailContainerRef.current.scrollTo({ top: 0 });
        requestAnimationFrame(() => {
          if (!detailContainerRef.current) return;
          const marks = detailContainerRef.current.querySelectorAll('[data-match="true"]');
          if (marks.length === 0) return;
          const mark = marks[0] as HTMLElement;
          const containerTop = detailContainerRef.current.getBoundingClientRect().top;
          const markTop = mark.getBoundingClientRect().top;
          detailContainerRef.current.scrollBy({
            top: markTop - containerTop - 100,
            behavior: 'smooth',
          });
          setCurrentMatchIndex(0);
          setTotalMatches(marks.length);
        });
      }, 280);
    },
    [sops]
  );

  // ── Deep-link: auto-open SOP from landing page URL params ────────────────
  const [deepLinkProcessed, setDeepLinkProcessed] = useState(false);
  useEffect(() => {
    if (deepLinkProcessed) return;
    const sopId = searchParams.get("sop");
    const q = searchParams.get("q");
    if (!sopId) return;

    const sop = sops.find((s) => s.id === sopId);
    if (!sop) return;

    setDeepLinkProcessed(true);

    if (q) {
      // Section match — same codepath as command palette onNavigateToSection
      handleNavigateToSection(sopId, q);
    } else {
      // SOP select — same codepath as command palette onSelectSOP
      setSelectedSOP(sop);
    }

    // Clean URL params without triggering navigation
    window.history.replaceState({}, "", "/playbook");
  }, [sops, searchParams, deepLinkProcessed, handleNavigateToSection]);

  // Stable CommandPalette callbacks — prevent new references on every Home render
  const handlePaletteClose = useCallback(() => {
    setCommandPaletteOpen(false);
    setSearchQuery("");
  }, []);

  const handlePaletteSelectSOP = useCallback((sop: SOP) => {
    setSelectedSOP(sop);
    setCommandPaletteOpen(false);
    setSearchQuery("");
  }, []);

  const handlePaletteNavigate = useCallback((sopId: string, query: string) => {
    handleNavigateToSection(sopId, query);
    setCommandPaletteOpen(false);
  }, [handleNavigateToSection]);

  const handleDetailTogglePin = useCallback(() => {
    if (selectedSOP) togglePin(selectedSOP.id);
  }, [selectedSOP, togglePin]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showAddPanel) {
        closePanel();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [showAddPanel, closePanel]);


  const searchRegex = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return null;
    const escaped = debouncedSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(${escaped})`, 'gi');
  }, [debouncedSearchQuery]);

  const highlightText = useCallback((text: string): React.ReactNode => {
    if (!searchRegex || !selectedSOP) return text;
    const parts = text.split(searchRegex);
    return parts.map((part, index) =>
      searchRegex.test(part) ? (
        <mark key={index} className="bg-highlight text-highlight-text" data-match="true">
          {part}
        </mark>
      ) : part
    );
  }, [searchRegex, selectedSOP]);

  const handleEditClick = useCallback(() => {
    if (selectedSOP) {
      setEditingSOP(selectedSOP);
      setIsEditMode(true);
      setShowAddPanel(true);
    }
  }, [selectedSOP]);

  return (
    <div className="flex h-screen bg-surface font-sans antialiased">
      <Sidebar
        sops={sops}
        selectedSOP={selectedSOP}
        onSelectSOP={setSelectedSOP}
        searchQuery={searchQuery}
        onClearSearch={() => setSearchQuery("")}
        pinnedIds={pinnedIds}
        onTogglePin={togglePin}
        onHomeClick={() => { window.location.href = '/'; }}
        defaultCollapsed={sidebarCollapsed}
      />

      <div className="flex-1 flex flex-col">
        <div className="bg-background border-b border-border px-4 flex items-center h-14">
          {/* Center — search */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-full max-w-md">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>

              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                readOnly
                onClick={() => setCommandPaletteOpen(true)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-16 py-1.5 bg-surface border border-border rounded-lg text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow cursor-pointer select-none"
              />

              {/* ⌘K hint — only when no active search and no match counter */}
              {!searchQuery && !(selectedSOP && debouncedSearchQuery.trim() && totalMatches > 0) && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 ty-micro pointer-events-none select-none font-mono">
                  ⌘K
                </span>
              )}

              {/* X clear button — active search query, no match counter */}
              {searchQuery && !(selectedSOP && debouncedSearchQuery.trim() && totalMatches > 0) && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-faint hover:text-text-secondary transition-colors rounded"
                  aria-label="Clear search"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M9.5 2.5l-7 7M2.5 2.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}

              {/* Match counter — with X prepended when searchQuery is set */}
              {selectedSOP && debouncedSearchQuery.trim() && totalMatches > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="p-1 text-text-faint hover:text-text-secondary transition-colors rounded"
                      aria-label="Clear search"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M9.5 2.5l-7 7M2.5 2.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  )}
                  <span className="text-xs text-text-secondary font-medium">
                    {currentMatchIndex + 1} of {totalMatches}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => scrollToMatch(currentMatchIndex - 1)}
                      className="p-1 hover:bg-surface-2 active:bg-surface-3 rounded transition-colors"
                      title="Previous match (Shift+Enter)"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-text-secondary">
                        <path d="M6 9L3 6l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => scrollToMatch(currentMatchIndex + 1)}
                      className="p-1 hover:bg-surface-2 active:bg-surface-3 rounded transition-colors"
                      title="Next match (Cmd/Ctrl+Enter)"
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-text-secondary">
                        <path d="M6 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right — Add SOP + user menu */}
          <div className="ml-auto flex items-center gap-3">
            {/* TODO: gate behind canCreateSop / admin role when auth is added */}
            <button
              onClick={() => {
                setIsEditMode(false);
                setEditingSOP(null);
                setShowAddPanel(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium text-text-secondary rounded-lg hover:bg-surface-2 hover:shadow-sm active:bg-surface-3 transition-all duration-150"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Add SOP
            </button>
            <UserMenu />
          </div>
        </div>

        <div ref={detailContainerRef} className="flex-1 overflow-y-auto">
          {selectedSOP ? (
            <div className="max-w-3xl mx-auto px-10 py-10">
              <SopDetail
                sop={selectedSOP}
                highlightText={highlightText}
                onEdit={handleEditClick}
                isPinned={pinnedIds.has(selectedSOP.id)}
                onTogglePin={handleDetailTogglePin}
              />
              <AskAISection selectedSOP={selectedSOP} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg className="w-16 h-16 text-text-faint mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-[17px] font-semibold text-foreground mb-1 tracking-tight">Select a procedure</h3>
                <p className="text-sm text-text-secondary">Choose an SOP from the sidebar to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={handlePaletteClose}
        sops={sops}
        onSelectSOP={handlePaletteSelectSOP}
        onNavigateToSection={handlePaletteNavigate}
      />

      {showAddPanel && (
        <>
          <div
            className="fixed inset-0 bg-black/25 z-40 animate-fade-in"
            onClick={closePanel}
          />
          <div className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-background shadow-2xl z-50 animate-slide-in-right flex flex-col">
            <SopForm
              mode={isEditMode ? "edit" : "create"}
              initialData={editingSOP ?? undefined}
              categories={CATEGORIES}
              onSave={(sop) => {
                if (isEditMode && editingSOP) {
                  setSelectedSOP(updateSOP(editingSOP.id, sop));
                } else {
                  setSelectedSOP(createSOP(sop));
                }
                closePanel();
              }}
              onCancel={closePanel}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <PlaybookContent />
    </Suspense>
  );
}
