"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, ChevronDown } from "lucide-react";
import { UserMenu } from "../components/UserMenu";

const PINNED_SOPS = [
  { id: "1", title: "Emergency Maintenance Request", category: "Operations", updatedAt: "Updated 2 days ago" },
  { id: "5", title: "Package Delivery Management", category: "Operations", updatedAt: "Updated 1 day ago" },
  { id: "3", title: "Rent Payment Late Fee Application", category: "Finance", updatedAt: "Updated 3 days ago" },
];

const RECENT_SOPS = [
  { id: "1", title: "Emergency Maintenance Request", category: "Operations", viewedAt: "Viewed 2h ago" },
  { id: "4", title: "Noise Complaint Resolution", category: "Resident Support", viewedAt: "Viewed yesterday" },
  { id: "2", title: "Resident Move-In Process", category: "Leasing", viewedAt: "Viewed 3 days ago" },
  { id: "6", title: "Lease Renewal Outreach", category: "Leasing", viewedAt: "Viewed 1 week ago" },
];

const QUICK_CHIPS = ["Pinned", "Recent", "Escalations", "Parking", "Move-In"];

const BROWSE_CATEGORIES = ["All", "Parking", "Move-In", "Maintenance", "Leasing", "Escalations"];

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [browseCategory, setBrowseCategory] = useState("All");

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    router.push(`/playbook?sidebar=collapsed&q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSelectSOP = (id: string) => {
    router.push(`/playbook?sidebar=collapsed&sop=${id}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* ── Top Nav ──────────────────────────────────────────────── */}
      <nav className="flex items-center justify-end h-14 px-4 border-b border-border bg-background">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/playbook")}
            className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-text-secondary rounded-lg hover:bg-surface-2 transition-colors duration-150"
          >
            <BookOpen size={16} strokeWidth={1.5} />
            Playbook
          </button>
          <UserMenu />
        </div>
      </nav>

      {/* ── Main Content ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* ── Hero ───────────────────────────────────────────────── */}
        <div className="pt-24 pb-8 text-center px-6">
          <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-foreground leading-tight">
            Hello <span className="font-serif italic">Nate</span>, view your
            <br />
            <span className="font-serif italic">Parkmerced playbook</span>
          </h1>
        </div>

        {/* ── Search ─────────────────────────────────────────────── */}
        <div className="max-w-xl mx-auto px-6 mb-6">
          <div className="relative">
            <Search
              size={18}
              strokeWidth={1.5}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="Search SOPs, tags, contacts, or keywords…"
              className="w-full pl-11 pr-14 py-3.5 bg-surface border border-border-muted rounded-xl text-[15px] text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-text-faint font-mono pointer-events-none select-none tabular-nums">
              ⌘K
            </span>
          </div>
        </div>

        {/* ── Quick Chips ────────────────────────────────────────── */}
        <div className="flex gap-2 flex-wrap justify-center px-6 mb-12">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              className="px-3.5 py-1.5 text-sm rounded-full border border-border-muted bg-surface text-text-secondary hover:bg-surface-2 hover:border-border-strong active:bg-surface-3 transition-all duration-150 cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* ── Content Section ────────────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-6 pb-16">
          {/* Browse categories dropdown — right-aligned */}
          <div className="flex justify-end mb-6">
            <div className="relative">
              <select
                value={browseCategory}
                onChange={(e) => setBrowseCategory(e.target.value)}
                className="appearance-none pl-3.5 pr-10 py-2 rounded-lg border border-border-muted text-sm text-text-secondary bg-surface focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-shadow cursor-pointer"
              >
                {BROWSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === "All" ? "Browse categories" : cat}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                strokeWidth={2}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint pointer-events-none"
              />
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left — Pinned SOPs (card style) */}
            <div>
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text-secondary mb-4">
                Pinned
              </h2>
              <div className="space-y-3">
                {PINNED_SOPS.map((sop) => (
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
                      <span className="text-[11px] text-text-faint">{sop.updatedAt}</span>
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
                {RECENT_SOPS.map((sop) => (
                  <button
                    key={sop.id}
                    type="button"
                    onClick={() => handleSelectSOP(sop.id)}
                    className="w-full text-left px-4 py-3 hover:bg-surface-2 first:rounded-t-xl last:rounded-b-xl transition-all duration-150 cursor-pointer"
                  >
                    <p className="text-[14px] font-medium text-foreground">{sop.title}</p>
                    <p className="text-[12px] text-text-faint mt-0.5">{sop.viewedAt}</p>
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
