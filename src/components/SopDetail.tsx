"use client";

import React, { useState } from "react";
import { ChevronDown, Star, Copy, Check, FileText, Image } from "lucide-react";
import type { SOP, Step, StepAttachment } from "../types";

// ─── SectionLabel ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400 mb-5">
      {children}
    </p>
  );
}

// ─── ScriptBlock ──────────────────────────────────────────────────────────────

function ScriptBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-200">
        <span className="text-[10px] uppercase tracking-[0.1em] text-neutral-400 font-semibold">
          Script
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          {copied ? (
            <Check size={11} strokeWidth={2} />
          ) : (
            <Copy size={11} strokeWidth={1.75} />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="px-4 py-3.5 text-[12px] font-mono text-neutral-700 leading-relaxed overflow-x-auto whitespace-pre-wrap">
        {code}
      </pre>
    </div>
  );
}

// ─── AttachmentsGrid ──────────────────────────────────────────────────────────

function AttachmentsGrid({ items }: { items: StepAttachment[] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {items.map((item, i) => (
        <a
          key={i}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-150"
        >
          {item.type === "image" ? (
            <Image size={13} strokeWidth={1.5} className="flex-shrink-0 text-neutral-400" />
          ) : (
            <FileText size={13} strokeWidth={1.5} className="flex-shrink-0 text-neutral-400" />
          )}
          <span className="text-[12px] text-neutral-600 truncate">
            {item.label ?? item.url}
          </span>
        </a>
      ))}
    </div>
  );
}

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
  const hasContent = !!(step.description || step.script || step.attachments?.length);

  return (
    <div className="border-t border-neutral-100 first:border-0">
      <button
        type="button"
        onClick={() => hasContent && setOpen((o) => !o)}
        className={[
          "w-full flex items-start gap-4 py-4 text-left group",
          hasContent ? "cursor-pointer" : "cursor-default",
        ].join(" ")}
        aria-expanded={hasContent ? open : undefined}
      >
        {/* Static number badge — not independently hoverable */}
        <span className="flex-shrink-0 w-5 h-5 rounded-full border border-neutral-200 bg-white text-[10px] font-semibold text-neutral-400 flex items-center justify-center mt-[2px]">
          {index + 1}
        </span>
        <span className="flex-1 text-[14px] font-medium text-neutral-800 leading-snug">
          {highlightText(step.title)}
        </span>
        {hasContent && (
          <ChevronDown
            size={13}
            strokeWidth={1.5}
            className={[
              "flex-shrink-0 mt-0.5 text-neutral-300 group-hover:text-neutral-400 transition-transform duration-200 ease-out",
              open ? "rotate-180" : "",
            ].join(" ")}
          />
        )}
      </button>

      {/* Expanded content — only rendered when content exists */}
      {hasContent && (
        <div
          className={[
            "overflow-hidden transition-all duration-200 ease-out",
            open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0",
          ].join(" ")}
        >
          <div className="pl-9 pr-2 pb-5 space-y-4">
            {step.description && (
              <p className="text-[13px] text-neutral-500 leading-relaxed">
                {highlightText(step.description)}
              </p>
            )}
            {step.script && <ScriptBlock code={step.script} />}
            {step.attachments?.length ? (
              <AttachmentsGrid items={step.attachments} />
            ) : null}
          </div>
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

export default function SopDetail({
  sop,
  highlightText,
  onEdit,
  isPinned,
  onTogglePin,
}: SopDetailProps) {
  return (
    <div className="pb-4">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-start gap-3 mb-3">
          <h1 className="flex-1 min-w-0 text-[26px] font-semibold text-neutral-900 tracking-tight leading-snug">
            {highlightText(sop.title)}
          </h1>
          {/* Icon-only action buttons */}
          <div className="flex items-center gap-0.5 flex-shrink-0 pt-0.5">
            <button
              onClick={onTogglePin}
              className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:shadow-sm active:bg-neutral-200 hover:text-neutral-700 transition-all duration-150"
              aria-label={isPinned ? "Unpin" : "Pin"}
            >
              <Star
                size={14}
                strokeWidth={1.75}
                fill={isPinned ? "currentColor" : "none"}
                className={isPinned ? "text-neutral-700" : ""}
              />
            </button>
            <button
              onClick={onEdit}
              className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:shadow-sm active:bg-neutral-200 hover:text-neutral-700 transition-all duration-150"
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
        <p className="text-[11px] text-neutral-400 uppercase tracking-widest">
          {[sop.category, ...sop.tags.slice(0, 3)].filter(Boolean).join(" · ")}
        </p>
      </div>

      {/* ── Overview ───────────────────────────────────────────────────────── */}
      {sop.overview && (
        <section className="border-t border-neutral-100 pt-6 pb-8">
          <SectionLabel>Overview</SectionLabel>
          <p className="text-[15px] text-neutral-700 leading-relaxed">
            {highlightText(sop.overview)}
          </p>
        </section>
      )}

      {/* ── Steps ──────────────────────────────────────────────────────────── */}
      {sop.steps.length > 0 && (
        <section className="border-t border-neutral-100 pt-6 pb-8">
          <SectionLabel>Steps</SectionLabel>
          <div>
            {sop.steps.map((step, i) => (
              <StepRow key={i} index={i} step={step} highlightText={highlightText} />
            ))}
          </div>
        </section>
      )}

      {/* ── Edge Cases ─────────────────────────────────────────────────────── */}
      {sop.edgeCases.length > 0 && (
        <section className="border-t border-neutral-100 pt-6 pb-8">
          <SectionLabel>Edge Cases</SectionLabel>
          <div className="space-y-6">
            {sop.edgeCases.map((ec, i) => (
              <div key={i}>
                <p className="text-[13px] font-semibold text-neutral-800 mb-1.5">
                  {highlightText(ec.title)}
                </p>
                <p className="text-[14px] text-neutral-600 leading-relaxed">
                  {highlightText(ec.description)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Escalation ─────────────────────────────────────────────────────── */}
      {(sop.escalation.when || sop.escalation.contact) && (
        <section className="border-t border-neutral-100 pt-6 pb-8">
          <SectionLabel>Escalation</SectionLabel>
          <div className="space-y-5">
            {sop.escalation.when && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 mb-1.5">
                  When
                </p>
                <p className="text-[14px] text-neutral-700 leading-relaxed">
                  {highlightText(sop.escalation.when)}
                </p>
              </div>
            )}
            {sop.escalation.contact && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 mb-1.5">
                  Contact
                </p>
                <p className="text-[14px] text-neutral-700 leading-relaxed">
                  {highlightText(sop.escalation.contact)}
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Contacts ───────────────────────────────────────────────────────── */}
      {sop.contacts.length > 0 && (
        <section className="border-t border-neutral-100 pt-6 pb-8">
          <SectionLabel>Contacts</SectionLabel>
          <div className="divide-y divide-neutral-100">
            {sop.contacts.map((c, i) => (
              <div key={i} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-100 text-neutral-500 text-[11px] font-semibold flex items-center justify-center">
                  {c.name
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
                    <span className="text-[14px] font-semibold text-neutral-900">
                      {highlightText(c.name)}
                    </span>
                    <span className="text-[12px] text-neutral-400">{c.label}</span>
                    {c.team && (
                      <span className="text-[11px] text-neutral-400">· {c.team}</span>
                    )}
                  </div>
                  <p className="text-[13px] text-neutral-500 leading-relaxed">
                    {highlightText(c.reason)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Reference Materials ────────────────────────────────────────────── */}
      {sop.photos.length > 0 && (
        <section className="border-t border-neutral-100 pt-6 pb-8">
          <SectionLabel>Reference Materials</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            {sop.photos.map((photo, i) => (
              <div
                key={i}
                className="aspect-video bg-neutral-50 rounded-lg border border-neutral-200 flex items-center justify-center p-4 text-center hover:bg-neutral-100/80 transition-colors cursor-pointer"
              >
                <span className="text-[13px] text-neutral-600 font-medium">
                  {highlightText(photo)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
