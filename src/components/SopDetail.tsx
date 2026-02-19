"use client";

import React, { useState, useCallback, useEffect, useMemo, startTransition } from "react";
import { ChevronDown, Star, Copy, Check, FileText, Image, AlertTriangle, User, ExternalLink, Download } from "lucide-react";
import type { SOP, Step, StepAttachment, EdgeCase } from "../types";

// ─── SectionLabel ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="ty-section-label mb-5">
      {children}
    </p>
  );
}

// ─── ScriptBlock ──────────────────────────────────────────────────────────────

const ScriptBlock = React.memo(function ScriptBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [code]);

  return (
    <div className="mt-4 rounded-lg border border-border bg-surface/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <span className="ty-section-label">
          Script
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-text-muted hover:text-foreground transition-colors"
        >
          {copied ? (
            <Check size={11} strokeWidth={2} />
          ) : (
            <Copy size={11} strokeWidth={1.75} />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="px-4 py-3.5 text-[12px] font-mono text-text-secondary leading-relaxed overflow-x-auto whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );
});

// ─── AttachmentsGrid ──────────────────────────────────────────────────────────

const AttachmentsGrid = React.memo(function AttachmentsGrid({ items }: { items: StepAttachment[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item, i) => (
        <a
          key={i}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-background hover:bg-surface hover:border-border-strong transition-all duration-150"
        >
          {item.type === "image" ? (
            <Image size={13} strokeWidth={1.5} className="flex-shrink-0 text-text-faint" />
          ) : (
            <FileText size={13} strokeWidth={1.5} className="flex-shrink-0 text-text-faint" />
          )}
          <span className="text-[12px] text-text-secondary truncate">
            {item.label ?? item.url}
          </span>
        </a>
      ))}
    </div>
  );
});

// ─── StepRow ──────────────────────────────────────────────────────────────────

interface StepRowProps {
  index: number;
  step: Step;
  highlightText: (text: string) => React.ReactNode;
}

const StepRow = React.memo(function StepRow({
  index,
  step,
  highlightText,
}: StepRowProps) {
  const [open, setOpen] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const hasContent = !!(step.description || step.script || step.attachments?.length);

  const handleToggle = useCallback(() => {
    if (!hasContent) return;
    setOpen((o) => {
      const next = !o;
      startTransition(() => setShowContent(next));
      return next;
    });
  }, [hasContent]);

  return (
    <div className="border-t border-border-muted first:border-0">
      <button
        type="button"
        onClick={handleToggle}
        className={[
          "w-full grid grid-cols-[28px_1fr_16px] gap-3 items-start py-5 text-left group",
          hasContent ? "cursor-pointer" : "cursor-default",
        ].join(" ")}
        aria-expanded={hasContent ? open : undefined}
      >
        <span className="text-right text-[12px] font-medium text-text-faint tabular-nums leading-none pt-[2px] select-none">
          {index + 1}
        </span>
        <span className="ty-list-title">
          {highlightText(step.title)}
        </span>
        {hasContent ? (
          <ChevronDown
            size={14}
            strokeWidth={2}
            className={[
              "text-text-faint group-hover:text-text-muted transition-transform duration-200 ease-out mt-[2px]",
              open ? "rotate-180" : "",
            ].join(" ")}
          />
        ) : (
          <span />
        )}
      </button>

      {/* Expanded content — deferred mount, fully unmounted when collapsed */}
      {showContent && hasContent && (
        <div className="pl-10 pr-2 pb-5 space-y-4">
          {step.description && (
            <p className="ty-secondary">
              {highlightText(step.description)}
            </p>
          )}
          {step.script && <ScriptBlock code={step.script} />}
          {step.attachments?.length ? (
            <AttachmentsGrid items={step.attachments} />
          ) : null}
        </div>
      )}
    </div>
  );
});

// ─── EdgeCaseCard ─────────────────────────────────────────────────────────────

interface EdgeCaseCardProps {
  edgeCase: EdgeCase;
  isExpanded: boolean;
  onToggle: () => void;
  highlightText: (text: string) => React.ReactNode;
}

const EdgeCaseCard = React.memo(function EdgeCaseCard({
  edgeCase,
  isExpanded,
  onToggle,
  highlightText,
}: EdgeCaseCardProps) {
  return (
    <div className="border border-border-muted rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-3 px-4 py-3.5 text-left group"
        aria-expanded={isExpanded}
      >
        <AlertTriangle
          size={14}
          strokeWidth={1.75}
          className="flex-shrink-0 text-text-faint mt-[2px]"
        />
        <span className="flex-1 min-w-0 ty-list-title truncate">
          {highlightText(edgeCase.title)}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          className={[
            "flex-shrink-0 text-text-faint group-hover:text-text-muted transition-transform duration-200 ease-out mt-[2px]",
            isExpanded ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>
      {isExpanded && (
        <div className="px-4 pb-3.5 pl-[43px]">
          <p className="ty-secondary">
            {highlightText(edgeCase.description)}
          </p>
        </div>
      )}
    </div>
  );
});

// ─── SopDetail ────────────────────────────────────────────────────────────────

export interface SopDetailProps {
  sop: SOP;
  highlightText: (text: string) => React.ReactNode;
  onEdit: () => void;
  isPinned: boolean;
  onTogglePin: () => void;
}

const SopDetail = React.memo(function SopDetail({
  sop,
  highlightText,
  onEdit,
  isPinned,
  onTogglePin,
}: SopDetailProps) {
  const [expandedEdgeCases, setExpandedEdgeCases] = useState<Set<number>>(new Set());

  const toggleEdgeCase = useCallback((index: number) => {
    setExpandedEdgeCases((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  useEffect(() => {
    setExpandedEdgeCases(new Set());
  }, [sop.id]);

  return (
    <div className="pb-4">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-9">
        <div className="flex items-start gap-3 mb-3">
          <h1 className="ty-title flex-1 min-w-0">
            {highlightText(sop.title)}
          </h1>
          {/* Icon-only action buttons */}
          <div className="flex items-center gap-0.5 flex-shrink-0 pt-0.5">
            <button
              onClick={onTogglePin}
              className="p-2 rounded-lg text-text-faint hover:bg-surface-2 hover:shadow-sm active:bg-surface-3 hover:text-foreground transition-all duration-150"
              aria-label={isPinned ? "Unpin" : "Pin"}
            >
              <Star
                size={14}
                strokeWidth={isPinned ? 0 : 1.75}
                fill={isPinned ? "currentColor" : "none"}
                className={isPinned ? "text-pin" : ""}
              />
            </button>
            <button
              onClick={onEdit}
              className="p-2 rounded-lg text-text-faint hover:bg-surface-2 hover:shadow-sm active:bg-surface-3 hover:text-foreground transition-all duration-150"
              aria-label="Edit"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M11.333 2A1.886 1.886 0 0 1 14 4.667l-9 9-3.667.666.667-3.666 9-9Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
        <p className="ty-meta">
          {[sop.category, ...sop.tags.slice(0, 3)].filter(Boolean).join(" · ")}
        </p>
      </div>

      {/* ── Overview ───────────────────────────────────────────────────────── */}
      {sop.overview && (
        <section className="border-t border-border-muted pt-7 pb-9">
          <SectionLabel>Overview</SectionLabel>
          <p className="ty-body">
            {highlightText(sop.overview)}
          </p>
        </section>
      )}

      {/* ── Steps ──────────────────────────────────────────────────────────── */}
      {sop.steps.length > 0 && (
        <section className="border-t border-border-muted pt-7 pb-9">
          <SectionLabel>Steps</SectionLabel>
          <div>
            {sop.steps.map((step, i) => (
              <StepRow key={i} index={i} step={step} highlightText={highlightText} />
            ))}
          </div>
        </section>
      )}

      {/* ── Edge Cases + Escalation — 2-column layout ────────────────── */}
      {(sop.edgeCases.length > 0 || sop.escalation.when || sop.escalation.contact) && (
        <section className="border-t border-border-muted pt-7 pb-9">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8">
            {/* ── Left column: Edge Cases ─────────────────────────────────── */}
            {sop.edgeCases.length > 0 && (
              <div>
                <SectionLabel>Edge Cases</SectionLabel>
                <div className="space-y-3">
                  {sop.edgeCases.map((ec, i) => (
                    <EdgeCaseCard
                      key={i}
                      edgeCase={ec}
                      isExpanded={expandedEdgeCases.has(i)}
                      onToggle={() => toggleEdgeCase(i)}
                      highlightText={highlightText}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── Right column: Escalation ────────────────────────────────── */}
            {(sop.escalation.when || sop.escalation.contact) && (
              <div>
                <SectionLabel>Escalation</SectionLabel>
                <div className="rounded-lg border border-border-muted overflow-hidden">
                  {sop.escalation.when && (
                    <div className={[
                      "flex items-start gap-3 px-4 py-3",
                      sop.escalation.contact ? "border-b border-border-muted" : "",
                    ].join(" ")}>
                      <AlertTriangle
                        size={13}
                        strokeWidth={1.75}
                        className="flex-shrink-0 text-text-faint mt-[3px]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="ty-section-label mb-1">When</p>
                        <p className="ty-secondary">
                          {highlightText(sop.escalation.when)}
                        </p>
                      </div>
                    </div>
                  )}
                  {sop.escalation.contact && (
                    <div className="flex items-start gap-3 px-4 py-3">
                      <User
                        size={13}
                        strokeWidth={1.75}
                        className="flex-shrink-0 text-text-faint mt-[3px]"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="ty-section-label mb-1">Who</p>
                        <p className="ty-secondary">
                          {highlightText(sop.escalation.contact)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Contacts ─────────────────────────────────────────────────────── */}
      {sop.contacts.length > 0 && (
        <section className="border-t border-border-muted pt-7 pb-9">
          <SectionLabel>Contacts</SectionLabel>
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            {sop.contacts.map((c, i) => (
              <div
                key={i}
                className={[
                  "flex items-start gap-4 px-4 py-3.5",
                  i < sop.contacts.length - 1 ? "border-b border-border-muted" : "",
                ].join(" ")}
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-surface-2 text-text-muted text-[11px] font-semibold flex items-center justify-center">
                  {c.name
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
                    <span className="text-[15px] font-semibold text-foreground">
                      {highlightText(c.name)}
                    </span>
                    <span className="text-[12px] text-text-muted">{c.label}</span>
                    {c.team && (
                      <span className="text-[11px] text-text-muted">· {c.team}</span>
                    )}
                  </div>
                  <p className="ty-secondary">
                    {highlightText(c.reason)}
                  </p>
                  {(c.teamsUrl || c.linkedinUrl) && (
                    <div className="flex items-center gap-2 mt-2">
                      {c.teamsUrl && (
                        <a
                          href={c.teamsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-text-muted border border-border-muted rounded-md hover:bg-surface-2 hover:text-foreground transition-colors duration-150"
                        >
                          Teams
                          <ExternalLink size={10} strokeWidth={2} />
                        </a>
                      )}
                      {c.linkedinUrl && (
                        <a
                          href={c.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-text-muted border border-border-muted rounded-md hover:bg-surface-2 hover:text-foreground transition-colors duration-150"
                        >
                          LinkedIn
                          <ExternalLink size={10} strokeWidth={2} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Reference Materials ────────────────────────────────────────────── */}
      {sop.referenceMaterials.length > 0 && (
        <section className="border-t border-border-muted pt-7 pb-9">
          <SectionLabel>Reference Materials</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sop.referenceMaterials.map((ref, i) => (
              <a
                key={i}
                href={ref.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col rounded-lg border border-border bg-surface overflow-hidden hover:border-border-strong hover:shadow-sm transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="aspect-video bg-surface-2 flex items-center justify-center">
                  {ref.thumbnailUrl ? (
                    <img src={ref.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <FileText size={24} strokeWidth={1.25} className="text-text-faint" />
                  )}
                </div>
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <span className="flex-1 min-w-0 text-[13px] font-medium text-foreground truncate">
                    {highlightText(ref.title)}
                  </span>
                  <Download
                    size={13}
                    strokeWidth={1.75}
                    className="flex-shrink-0 text-text-faint group-hover:text-text-muted transition-colors"
                  />
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
});

export default SopDetail;
