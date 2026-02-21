"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Mail, Building2, Settings } from "lucide-react";

const WORKSPACES = [
  { id: "parkmerced", name: "Parkmerced" },
  { id: "acme", name: "Acme Team" },
  { id: "demo", name: "Demo Workspace" },
];

export function WorkspaceSwitcher({ collapsed, onManageWorkspaces }: { collapsed?: boolean; onManageWorkspaces?: () => void }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState("parkmerced");
  const ref = useRef<HTMLDivElement>(null);

  const active = WORKSPACES.find((w) => w.id === activeId)!;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  // Collapsed mode — icon only with tooltip
  if (collapsed) {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="relative group w-9 h-9 flex items-center justify-center rounded-xl text-text-faint hover:bg-surface-2 hover:text-foreground active:bg-surface-3 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Switch workspace"
          aria-expanded={open}
        >
          <Building2 size={18} strokeWidth={1.75} />
          <span className="absolute left-full ml-3 px-2 py-1 bg-foreground text-background text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
            {active.name}
          </span>
        </button>

        {open && (
          <div className="absolute top-0 left-full ml-2 w-56 bg-background border border-border rounded-xl shadow-lg py-1 z-50">
            <div className="px-3 py-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                Workspaces
              </span>
            </div>
            {WORKSPACES.map((ws) => (
              <button
                key={ws.id}
                onClick={() => { setActiveId(ws.id); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-foreground hover:bg-surface-2 transition-colors"
              >
                <span className="w-6 h-6 rounded-md bg-surface-2 text-text-muted text-[11px] font-semibold flex items-center justify-center flex-shrink-0">
                  {ws.name[0]}
                </span>
                <span className="flex-1 text-left truncate">{ws.name}</span>
                {ws.id === activeId && (
                  <Check size={14} strokeWidth={2} className="text-accent flex-shrink-0" />
                )}
              </button>
            ))}
            <div className="border-t border-border-muted my-1" />
            <button
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-text-secondary hover:bg-surface-2 transition-colors"
            >
              <Mail size={14} strokeWidth={1.75} className="text-text-faint" />
              <span>Invites</span>
            </button>
            <button
              onClick={() => { onManageWorkspaces?.(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-text-secondary hover:bg-surface-2 transition-colors"
            >
              <Settings size={14} strokeWidth={1.75} className="text-text-faint flex-shrink-0" />
              <div className="flex flex-col items-start">
                <span>Manage workspaces</span>
                <span className="text-[11px] text-text-faint leading-tight">Create, rename, members</span>
              </div>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Expanded mode — full button with name + chevron
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[13px] font-semibold text-foreground hover:bg-surface-2 active:bg-surface-3 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Switch workspace"
        aria-expanded={open}
      >
        <span className="w-6 h-6 rounded-md bg-surface-2 text-text-muted text-[11px] font-semibold flex items-center justify-center flex-shrink-0">
          {active.name[0]}
        </span>
        <span className="flex-1 text-left truncate">{active.name}</span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={[
            "text-text-faint transition-transform duration-150",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-background border border-border rounded-xl shadow-lg py-1 z-50">
          <div className="px-3 py-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              Workspaces
            </span>
          </div>
          {WORKSPACES.map((ws) => (
            <button
              key={ws.id}
              onClick={() => { setActiveId(ws.id); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-foreground hover:bg-surface-2 transition-colors"
            >
              <span className="w-6 h-6 rounded-md bg-surface-2 text-text-muted text-[11px] font-semibold flex items-center justify-center flex-shrink-0">
                {ws.name[0]}
              </span>
              <span className="flex-1 text-left truncate">{ws.name}</span>
              {ws.id === activeId && (
                <Check size={14} strokeWidth={2} className="text-accent flex-shrink-0" />
              )}
            </button>
          ))}
          <div className="border-t border-border-muted my-1" />
          <button
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-text-secondary hover:bg-surface-2 transition-colors"
          >
            <Mail size={14} strokeWidth={1.75} className="text-text-faint" />
            <span>Invites</span>
          </button>
          <button
            onClick={() => { onManageWorkspaces?.(); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-text-secondary hover:bg-surface-2 transition-colors"
          >
            <Settings size={14} strokeWidth={1.75} className="text-text-faint flex-shrink-0" />
            <div className="flex flex-col items-start">
              <span>Manage workspaces</span>
              <span className="text-[11px] text-text-faint leading-tight">Create, rename, members</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
