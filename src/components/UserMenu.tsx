"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "next-themes";
import { User, Settings, LogOut, Sun, Moon, Monitor, Check } from "lucide-react";

const THEME_OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 rounded-full bg-surface-2 text-text-muted text-[12px] font-semibold flex items-center justify-center hover:bg-surface-3 active:bg-surface-3 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="User menu"
        aria-expanded={open}
      >
        NP
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-background border border-border rounded-xl shadow-lg py-1 z-50">
          {/* Workspace info */}
          <div className="px-3 py-2 border-b border-border-muted">
            <p className="text-[13px] font-semibold text-foreground">Nate P.</p>
            <p className="text-[11px] text-text-muted">Parkmerced</p>
          </div>

          {/* Navigation items */}
          <div className="py-1">
            <button
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-foreground hover:bg-surface-2 transition-colors"
            >
              <User size={14} strokeWidth={1.75} className="text-text-faint" />
              Profile
            </button>
            <button
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-foreground hover:bg-surface-2 transition-colors"
            >
              <Settings size={14} strokeWidth={1.75} className="text-text-faint" />
              Settings
            </button>
          </div>

          {/* Theme selector */}
          <div className="border-t border-border-muted py-1">
            <div className="px-3 py-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                Theme
              </span>
            </div>
            {mounted && THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-foreground hover:bg-surface-2 transition-colors"
              >
                <Icon size={14} strokeWidth={1.75} className="text-text-faint" />
                <span className="flex-1 text-left">{label}</span>
                {theme === value && (
                  <Check size={14} strokeWidth={2} className="text-accent flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Sign out */}
          <div className="border-t border-border-muted py-1">
            <button
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-text-secondary hover:bg-surface-2 transition-colors"
            >
              <LogOut size={14} strokeWidth={1.75} className="text-text-faint" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
