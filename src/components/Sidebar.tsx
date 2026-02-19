"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Menu, Home, LayoutList, Star, Wrench, Headset, Receipt, KeyRound, Plus } from "lucide-react";
import type { SOP } from "../types";

// ─── Constants ────────────────────────────────────────────────────────────────

const VIEW_ITEMS = [
  { id: "home",   label: "Home",     icon: Home },
  { id: "all",    label: "All SOPs", icon: LayoutList },
  { id: "pinned", label: "Pinned",   icon: Star },
] as const;

const CATEGORY_VIEW_ITEMS = [
  { id: "category:Operations",       label: "Operations",       icon: Wrench   },
  { id: "category:Resident Support", label: "Resident Support", icon: Headset  },
  { id: "category:Finance",          label: "Finance",          icon: Receipt  },
  { id: "category:Leasing",          label: "Leasing",          icon: KeyRound },
] as const;

// ─── Tag helpers ──────────────────────────────────────────────────────────────

function getUrgencyPill(tags: string[]): string | null {
  if (tags.some(t => ["Urgent", "After-Hours", "Emergency", "Critical"].includes(t))) return "Urgent";
  if (tags.some(t => ["Standard", "Policy", "Routine"].includes(t))) return "Standard";
  return null;
}

function getFrequencyPill(tags: string[]): string | null {
  if (tags.some(t => ["Daily", "Daily Workflow"].includes(t))) return "Daily";
  if (tags.some(t => ["Weekly", "Onboarding", "Inspection"].includes(t))) return "Weekly";
  if (tags.some(t => ["Rare"].includes(t))) return "Rare";
  return null;
}

// ─── SopListItem ──────────────────────────────────────────────────────────────

interface SopListItemProps {
  sop: SOP;
  isSelected: boolean;
  isPinned: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
}

const SopListItem = React.memo(function SopListItem({
  sop,
  isSelected,
  isPinned,
  onSelect,
  onTogglePin,
}: SopListItemProps) {
  const urgencyPill = getUrgencyPill(sop.tags);
  const freqPill = getFrequencyPill(sop.tags);

  return (
    <div
      role="button"
      tabIndex={0}
      className={[
        "group relative flex items-center pl-4 pr-3 py-2 rounded-lg cursor-pointer transition-all duration-150 select-none",
        isSelected
          ? "bg-surface-2"
          : "hover:bg-surface-2 active:bg-surface-2",
      ].join(" ")}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
    >
      <div className="flex-1 min-w-0 pr-6">
        <div
          className={[
            "text-[13px] leading-snug truncate text-foreground",
            isSelected ? "font-medium" : "",
          ].join(" ")}
        >
          {sop.title}
        </div>
        {(urgencyPill || freqPill) && (
          <div className="flex items-center gap-1 mt-[3px]">
            {urgencyPill && (
              <span className="text-[11px] text-text-muted leading-none">
                {urgencyPill}
              </span>
            )}
            {freqPill && (
              <span className="text-[11px] text-text-muted leading-none">
                {freqPill}
              </span>
            )}
          </div>
        )}
      </div>

      <button
        className={[
          "absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded transition-all duration-150",
          isPinned
            ? "text-amber-400 opacity-100"
            : "text-text-faint opacity-0 group-hover:opacity-100 hover:text-text-muted",
        ].join(" ")}
        onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
        aria-label={isPinned ? "Unpin" : "Pin"}
      >
        <Star
          size={12}
          strokeWidth={isPinned ? 0 : 1.75}
          fill={isPinned ? "currentColor" : "none"}
        />
      </button>
    </div>
  );
});

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  sops: SOP[];
  selectedSOP: SOP | null;
  onSelectSOP: (sop: SOP) => void;
  searchQuery: string;
  pinnedIds: Set<string>;
  onTogglePin: (id: string) => void;
  onAddSOP: () => void;
}

const Sidebar = React.memo(function Sidebar({ sops, selectedSOP, onSelectSOP, searchQuery, pinnedIds, onTogglePin, onAddSOP }: SidebarProps) {
  // TODO: replace with real role check when auth is added
  const canCreateSop = true;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<string>("all");
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => setHasMounted(true), []);

  const activateView = useCallback((id: string) => {
    setActiveView(id);
    setSidebarOpen(true);
  }, []);

  // Category counts (unaffected by search or active view)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sop of sops) {
      counts[sop.category] = (counts[sop.category] ?? 0) + 1;
    }
    return counts;
  }, [sops]);

  const viewSOPs = useMemo(() => {
    if (activeView === "home") return [];
    let base: SOP[];
    if (activeView === "all") base = sops;
    else if (activeView === "pinned") base = sops.filter((s) => pinnedIds.has(s.id));
    else base = sops.filter((s) => `category:${s.category}` === activeView);

    if (!searchQuery.trim()) return base;
    const q = searchQuery.toLowerCase();
    return base.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)) ||
        s.overview.toLowerCase().includes(q)
    );
  }, [sops, activeView, pinnedIds, searchQuery]);

  // ── Expanded sidebar ───────────────────────────────────────────────────────
  if (sidebarOpen) {
    return (
      <div className="w-[268px] bg-background border-r border-border-muted flex flex-col flex-shrink-0 transition-all duration-200 ease-out">
        {/* Header */}
        <div className="h-14 flex items-center px-4 border-b border-border flex-shrink-0">
          <span className="flex-1 text-[15px] font-semibold text-foreground tracking-tight">Playbook</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-text-muted hover:text-foreground hover:bg-surface-2 hover:shadow-sm active:bg-surface-3 rounded-md transition-all duration-150"
            aria-label="Collapse sidebar"
          >
            <Menu size={18} />
          </button>
        </div>

        {/* Scroll body */}
        <div className="flex-1 overflow-y-auto">
          {/* Top views */}
          <nav className="px-3 pt-3 pb-1">
            {VIEW_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = activeView === id;
              const count = id === "pinned" && hasMounted && pinnedIds.size > 0 ? pinnedIds.size : undefined;
              return (
                <button
                  key={id}
                  onClick={() => setActiveView(id)}
                  className={[
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] font-medium transition-all duration-150",
                    isActive
                      ? "bg-surface-2 text-foreground shadow-sm"
                      : "text-text-secondary hover:bg-surface hover:shadow-sm active:bg-surface-2",
                  ].join(" ")}
                >
                  <Icon
                    size={14}
                    strokeWidth={1.75}
                    className={isActive ? "text-foreground" : "text-text-faint"}
                  />
                  <span className="flex-1 text-left">{label}</span>
                  {count != null && (
                    <span className="ty-micro">{count}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="border-t border-border-muted mx-3 my-1" />

          {/* Category views */}
          <nav className="px-3 pt-1 pb-2">
            {CATEGORY_VIEW_ITEMS.map(({ id, label, icon: Icon }) => {
              const isActive = activeView === id;
              const cat = label;
              const count = categoryCounts[cat];
              return (
                <button
                  key={id}
                  onClick={() => setActiveView(isActive ? "all" : id)}
                  className={[
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] transition-all duration-150",
                    isActive
                      ? "bg-surface-2 text-foreground font-semibold"
                      : "font-medium text-text-secondary hover:bg-surface-2 active:bg-surface-2",
                  ].join(" ")}
                >
                  <Icon
                    size={14}
                    strokeWidth={1.75}
                    className={isActive ? "text-foreground" : "text-text-faint"}
                  />
                  <span className="flex-1 text-left">{label}</span>
                  {count != null && (
                    <span className="ty-micro">{count}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="border-t border-border-muted mx-3 my-1" />

          {/* SOP list */}
          <div className="px-3 pb-4 pt-1">
            {/* TODO: hide when canCreateSop is false (role-based) */}
            {canCreateSop && (
              <button
                onClick={onAddSOP}
                className="w-full flex items-center gap-2 px-2 py-1.5 mb-1.5 rounded-lg text-[13px] font-medium text-text-secondary hover:bg-surface-2 active:bg-surface-3 transition-all duration-150"
              >
                <Plus size={14} strokeWidth={2} className="text-text-faint" />
                Add SOP
              </button>
            )}
            {activeView === "home" ? (
              <div className="py-8 text-center">
                <p className="text-sm text-text-muted">Pick a view or search to get started</p>
              </div>
            ) : activeView === "pinned" && pinnedIds.size === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2">
                <Star size={20} className="text-text-faint" strokeWidth={1.5} />
                <p className="text-sm text-text-muted">Pin SOPs for quick access</p>
              </div>
            ) : viewSOPs.length === 0 && searchQuery.trim() ? (
              <div className="py-8 text-center">
                <p className="text-sm text-text-muted">No results for &ldquo;{searchQuery}&rdquo;</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {viewSOPs.map((sop) => (
                  <SopListItem
                    key={sop.id}
                    sop={sop}
                    isSelected={selectedSOP?.id === sop.id}
                    isPinned={pinnedIds.has(sop.id)}
                    onSelect={() => onSelectSOP(sop)}
                    onTogglePin={() => onTogglePin(sop.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Collapsed sidebar ──────────────────────────────────────────────────────
  return (
    <div className="w-[72px] bg-background border-r border-border-muted flex flex-col flex-shrink-0 transition-all duration-200 ease-out">
      {/* Header */}
      <div className="h-14 flex items-center justify-center border-b border-border flex-shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-text-muted hover:text-foreground hover:bg-surface-2 hover:shadow-sm active:bg-surface-3 rounded-md transition-all duration-150"
          aria-label="Expand sidebar"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Icon rail */}
      <div className="flex-1 flex flex-col items-center pt-3 pb-4 gap-0.5">
        {VIEW_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              onClick={() => activateView(id)}
              className={[
                "relative group w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150",
                isActive
                  ? "bg-surface-3 text-foreground shadow-sm"
                  : "text-text-faint hover:bg-surface-2 hover:text-foreground active:bg-surface-3",
              ].join(" ")}
              title={label}
            >
              <Icon size={18} strokeWidth={1.75} />
              <span className="absolute left-full ml-3 px-2 py-1 bg-foreground text-background text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
                {label}
              </span>
            </button>
          );
        })}

        {/* Divider */}
        <div className="w-5 border-t border-border-muted my-1" />

        {CATEGORY_VIEW_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeView === id;
          return (
            <button
              key={id}
              onClick={() => isActive ? setActiveView("all") : activateView(id)}
              className={[
                "relative group w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150",
                isActive
                  ? "bg-surface-3 text-foreground shadow-sm"
                  : "text-text-faint hover:bg-surface-2 hover:text-foreground active:bg-surface-3",
              ].join(" ")}
              title={label}
            >
              <Icon size={18} strokeWidth={1.75} />
              <span className="absolute left-full ml-3 px-2 py-1 bg-foreground text-background text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
});

export default Sidebar;
