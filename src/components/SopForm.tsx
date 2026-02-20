"use client";

import React, { useReducer, useState, useCallback, useRef } from "react";
import { ChevronDown } from "lucide-react";
import type { SOP } from "../types";
import { normalizeSOP } from "../lib/normalize";
import { parseSOPForm } from "../lib/sopSchema";

// ── Form data types ──────────────────────────────────────────────────────────

interface StepFormData {
  title: string;
  text: string;
  imageUrl: string;
  script: string;
}

interface EdgeCaseFormData {
  title: string;
  description: string;
}

interface ContactFormData {
  name: string;
  role: string;
  department: string;
  description: string;
  avatarUrl: string;
  teamsUrl: string;
  linkedinUrl: string;
}

interface ReferenceMaterialFormData {
  title: string;
  thumbnailUrl: string;
  fileUrl: string;
}

interface SOPFormData {
  title: string;
  category: string;
  tags: string;
  overview: string;
  steps: StepFormData[];
  edgeCases: EdgeCaseFormData[];
  escalationWhen: string;
  escalationWho: string;
  contacts: ContactFormData[];
  referenceMaterials: ReferenceMaterialFormData[];
}

// ── Converters ───────────────────────────────────────────────────────────────

function emptyStep(): StepFormData {
  return { title: "", text: "", imageUrl: "", script: "" };
}

function emptyEdgeCase(): EdgeCaseFormData {
  return { title: "", description: "" };
}

function emptyContact(): ContactFormData {
  return { name: "", role: "", department: "", description: "", avatarUrl: "", teamsUrl: "", linkedinUrl: "" };
}

function emptyReferenceMaterial(): ReferenceMaterialFormData {
  return { title: "", thumbnailUrl: "", fileUrl: "" };
}

function emptyFormData(defaultCategory: string): SOPFormData {
  return {
    title: "",
    category: defaultCategory,
    tags: "",
    overview: "",
    steps: [emptyStep()],
    edgeCases: [emptyEdgeCase()],
    escalationWhen: "",
    escalationWho: "",
    contacts: [emptyContact()],
    referenceMaterials: [emptyReferenceMaterial()],
  };
}

function sopToFormData(sop: SOP): SOPFormData {
  return {
    title: sop.title,
    category: sop.category,
    tags: sop.tags.join(", "),
    overview: sop.overview,
    steps: sop.steps.length > 0
      ? sop.steps.map((s) => ({
          title: s.title ?? "",
          text: s.text,
          imageUrl: s.imageUrl ?? "",
          script: s.script ?? "",
        }))
      : [emptyStep()],
    edgeCases: sop.edgeCases.length > 0
      ? sop.edgeCases.map((ec) => ({ title: ec.title, description: ec.description }))
      : [emptyEdgeCase()],
    escalationWhen: sop.escalation.when,
    escalationWho: sop.escalation.who,
    contacts: sop.contacts.length > 0
      ? sop.contacts.map((c) => ({
          name: c.name,
          role: c.role,
          department: c.department,
          description: c.description ?? "",
          avatarUrl: c.avatarUrl ?? "",
          teamsUrl: c.teamsUrl ?? "",
          linkedinUrl: c.linkedinUrl ?? "",
        }))
      : [emptyContact()],
    referenceMaterials: sop.referenceMaterials.length > 0
      ? sop.referenceMaterials.map((r) => ({
          title: r.title,
          thumbnailUrl: r.thumbnailUrl ?? "",
          fileUrl: r.fileUrl ?? "",
        }))
      : [emptyReferenceMaterial()],
  };
}

function formDataToSOP(form: SOPFormData, existingId?: string): SOP {
  return normalizeSOP({
    id: existingId ?? String(Date.now()),
    title: form.title,
    category: form.category,
    tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    lastUpdated: existingId ? "Updated just now" : "Just now",
    overview: form.overview,
    steps: form.steps
      .filter((s) => s.title.trim() || s.text.trim())
      .map((s) => ({
        text: s.text || s.title,
        ...(s.title.trim() ? { title: s.title } : {}),
        ...(s.imageUrl.trim() ? { imageUrl: s.imageUrl } : {}),
        ...(s.script.trim() ? { script: s.script } : {}),
      })),
    edgeCases: form.edgeCases.filter((ec) => ec.title.trim() || ec.description.trim()),
    escalation: { when: form.escalationWhen, who: form.escalationWho },
    contacts: form.contacts
      .filter((c) => c.name.trim())
      .map((c) => ({
        name: c.name,
        role: c.role,
        department: c.department,
        ...(c.description.trim() ? { description: c.description } : {}),
        ...(c.avatarUrl.trim() ? { avatarUrl: c.avatarUrl } : {}),
        ...(c.teamsUrl.trim() ? { teamsUrl: c.teamsUrl } : {}),
        ...(c.linkedinUrl.trim() ? { linkedinUrl: c.linkedinUrl } : {}),
      })),
    referenceMaterials: form.referenceMaterials
      .filter((r) => r.title.trim())
      .map((r) => ({
        title: r.title,
        ...(r.thumbnailUrl.trim() ? { thumbnailUrl: r.thumbnailUrl } : {}),
        ...(r.fileUrl.trim() ? { fileUrl: r.fileUrl } : {}),
      })),
  });
}

// ── Reducer ──────────────────────────────────────────────────────────────────

type FormAction =
  | { type: "SET_FIELD"; field: keyof SOPFormData; value: string }
  | { type: "SET_STEP"; index: number; field: keyof StepFormData; value: string }
  | { type: "ADD_STEP" }
  | { type: "REMOVE_STEP"; index: number }
  | { type: "MOVE_STEP"; index: number; direction: "up" | "down" }
  | { type: "SET_EDGE_CASE"; index: number; field: keyof EdgeCaseFormData; value: string }
  | { type: "ADD_EDGE_CASE" }
  | { type: "REMOVE_EDGE_CASE"; index: number }
  | { type: "SET_CONTACT"; index: number; field: keyof ContactFormData; value: string }
  | { type: "ADD_CONTACT" }
  | { type: "REMOVE_CONTACT"; index: number }
  | { type: "SET_REFERENCE"; index: number; field: keyof ReferenceMaterialFormData; value: string }
  | { type: "ADD_REFERENCE" }
  | { type: "REMOVE_REFERENCE"; index: number }
  | { type: "RESET"; data: SOPFormData };

function formReducer(state: SOPFormData, action: FormAction): SOPFormData {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };

    case "SET_STEP": {
      const steps = [...state.steps];
      steps[action.index] = { ...steps[action.index], [action.field]: action.value };
      return { ...state, steps };
    }
    case "ADD_STEP":
      return { ...state, steps: [...state.steps, emptyStep()] };
    case "REMOVE_STEP":
      return { ...state, steps: state.steps.filter((_, i) => i !== action.index) };
    case "MOVE_STEP": {
      const steps = [...state.steps];
      const target = action.direction === "up" ? action.index - 1 : action.index + 1;
      if (target < 0 || target >= steps.length) return state;
      [steps[action.index], steps[target]] = [steps[target], steps[action.index]];
      return { ...state, steps };
    }

    case "SET_EDGE_CASE": {
      const edgeCases = [...state.edgeCases];
      edgeCases[action.index] = { ...edgeCases[action.index], [action.field]: action.value };
      return { ...state, edgeCases };
    }
    case "ADD_EDGE_CASE":
      return { ...state, edgeCases: [...state.edgeCases, emptyEdgeCase()] };
    case "REMOVE_EDGE_CASE":
      return { ...state, edgeCases: state.edgeCases.filter((_, i) => i !== action.index) };

    case "SET_CONTACT": {
      const contacts = [...state.contacts];
      contacts[action.index] = { ...contacts[action.index], [action.field]: action.value };
      return { ...state, contacts };
    }
    case "ADD_CONTACT":
      return { ...state, contacts: [...state.contacts, emptyContact()] };
    case "REMOVE_CONTACT":
      return { ...state, contacts: state.contacts.filter((_, i) => i !== action.index) };

    case "SET_REFERENCE": {
      const referenceMaterials = [...state.referenceMaterials];
      referenceMaterials[action.index] = { ...referenceMaterials[action.index], [action.field]: action.value };
      return { ...state, referenceMaterials };
    }
    case "ADD_REFERENCE":
      return { ...state, referenceMaterials: [...state.referenceMaterials, emptyReferenceMaterial()] };
    case "REMOVE_REFERENCE":
      return { ...state, referenceMaterials: state.referenceMaterials.filter((_, i) => i !== action.index) };

    case "RESET":
      return action.data;

    default:
      return state;
  }
}

// ── Icons (inline SVGs to avoid extra lucide imports) ────────────────────────

function ArrowUpIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-secondary">
      <path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-text-secondary">
      <path d="M8 4v8M12 8l-4 4-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-text-secondary">
      <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ── Shared input classes ─────────────────────────────────────────────────────

const INPUT_CLS = "w-full px-4 py-2.5 rounded-xl border border-border-strong text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background";
const INNER_INPUT_CLS = "w-full px-3 py-2 rounded-lg border border-border-strong text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-ring bg-background";
const TEXTAREA_CLS = INPUT_CLS;
const INNER_TEXTAREA_CLS = INNER_INPUT_CLS;

// ── Component ────────────────────────────────────────────────────────────────

export interface SopFormProps {
  mode: "create" | "edit";
  initialData?: SOP;
  categories: string[];
  onSave: (sop: SOP) => void;
  onCancel: () => void;
}

export default function SopForm({
  mode,
  initialData,
  categories,
  onSave,
  onCancel,
}: SopFormProps) {
  const initial = initialData ? sopToFormData(initialData) : emptyFormData(categories[0] ?? "Operations");
  const [form, dispatch] = useReducer(formReducer, initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(() => {
    if (!initialData) return new Set<number>();
    // Auto-expand steps that have optional fields filled
    const expanded = new Set<number>();
    initial.steps.forEach((s, i) => {
      if (s.imageUrl || s.script) expanded.add(i);
    });
    return expanded;
  });
  const [expandedContacts, setExpandedContacts] = useState<Set<number>>(() => {
    if (!initialData) return new Set<number>();
    const expanded = new Set<number>();
    initial.contacts.forEach((c, i) => {
      if (c.avatarUrl || c.teamsUrl || c.linkedinUrl) expanded.add(i);
    });
    return expanded;
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const toggleStepExpand = useCallback((index: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const toggleContactExpand = useCallback((index: number) => {
    setExpandedContacts((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    const result = parseSOPForm(form);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join(".");
        if (!newErrors[key]) newErrors[key] = issue.message;
      }
      setErrors(newErrors);
      // Scroll to first error
      requestAnimationFrame(() => {
        const firstError = scrollRef.current?.querySelector("[data-error]");
        firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }
    setErrors({});
    const sop = formDataToSOP(form, initialData?.id);
    onSave(sop);
  }, [form, initialData, onSave]);

  const isValid = form.title.trim().length > 0 && form.category.trim().length > 0;

  return (
    <>
      {/* Header */}
      <div className="flex-shrink-0 px-8 py-6 border-b border-border bg-background">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-foreground tracking-tight mb-2">
              {mode === "edit" ? "Edit SOP" : "Create New SOP"}
            </h2>
            <p className="text-sm text-text-secondary">
              {mode === "edit"
                ? "Update this standard operating procedure"
                : "Define a new standard operating procedure for your team"}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-surface-2 active:bg-surface-3 rounded-lg transition-colors ml-4"
            aria-label="Close panel"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-8">
        <div className="space-y-8">
          {/* ── Section 1: Basic Information ──────────────────────────────── */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-6 tracking-tight flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">1</span>
              Basic Information
            </h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => {
                    dispatch({ type: "SET_FIELD", field: "title", value: e.target.value });
                    clearError("title");
                  }}
                  className={INPUT_CLS}
                  placeholder="Enter SOP title"
                />
                {errors.title && <p className="text-xs text-red-500 mt-1.5" data-error>{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => {
                    dispatch({ type: "SET_FIELD", field: "category", value: e.target.value });
                    clearError("category");
                  }}
                  className={INPUT_CLS}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && <p className="text-xs text-red-500 mt-1.5" data-error>{errors.category}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Tags</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => dispatch({ type: "SET_FIELD", field: "tags", value: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="e.g., Urgent, After-Hours"
                />
                <p className="mt-2 text-xs text-text-muted">Separate multiple tags with commas</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Overview</label>
                <textarea
                  value={form.overview}
                  onChange={(e) => dispatch({ type: "SET_FIELD", field: "overview", value: e.target.value })}
                  rows={3}
                  className={TEXTAREA_CLS}
                  placeholder="Brief overview of this procedure"
                />
              </div>
            </div>
          </section>

          <div className="border-t border-border" />

          {/* ── Section 2: Steps ──────────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">2</span>
                Steps
              </h3>
              <button
                type="button"
                onClick={() => dispatch({ type: "ADD_STEP" })}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors font-medium"
              >
                + Add Step
              </button>
            </div>
            {errors.steps && <p className="text-xs text-red-500 mb-4" data-error>{errors.steps}</p>}
            <div className="space-y-4">
              {form.steps.map((step, index) => (
                <div key={index} className="bg-surface border border-border rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => {
                          dispatch({ type: "SET_STEP", index, field: "title", value: e.target.value });
                          clearError("steps");
                        }}
                        className={INNER_INPUT_CLS}
                        placeholder="Step title (optional)"
                      />
                      <textarea
                        value={step.text}
                        onChange={(e) => {
                          dispatch({ type: "SET_STEP", index, field: "text", value: e.target.value });
                          clearError("steps");
                        }}
                        rows={2}
                        className={INNER_TEXTAREA_CLS}
                        placeholder="Detailed instructions for this step"
                      />
                      <button
                        type="button"
                        onClick={() => toggleStepExpand(index)}
                        className="flex items-center gap-1 text-[13px] text-text-muted hover:text-accent transition-colors"
                      >
                        <ChevronDown
                          size={13}
                          strokeWidth={2}
                          className={`transition-transform duration-150 ${expandedSteps.has(index) ? "rotate-180" : ""}`}
                        />
                        {expandedSteps.has(index) ? "Hide optional fields" : "Image URL, Script"}
                      </button>
                      {expandedSteps.has(index) && (
                        <div className="space-y-3 pt-1">
                          <input
                            type="text"
                            value={step.imageUrl}
                            onChange={(e) => dispatch({ type: "SET_STEP", index, field: "imageUrl", value: e.target.value })}
                            className={INNER_INPUT_CLS}
                            placeholder="Image URL (optional)"
                          />
                          <textarea
                            value={step.script}
                            onChange={(e) => dispatch({ type: "SET_STEP", index, field: "script", value: e.target.value })}
                            rows={3}
                            className={`${INNER_TEXTAREA_CLS} font-mono`}
                            placeholder="Script / code block (optional)"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "MOVE_STEP", index, direction: "up" })}
                        disabled={index === 0}
                        className="p-1 hover:bg-surface-3 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move up"
                      >
                        <ArrowUpIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "MOVE_STEP", index, direction: "down" })}
                        disabled={index === form.steps.length - 1}
                        className="p-1 hover:bg-surface-3 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move down"
                      >
                        <ArrowDownIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "REMOVE_STEP", index })}
                        disabled={form.steps.length === 1}
                        className="p-1 hover:bg-red-100 active:bg-red-200 rounded text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Remove step"
                      >
                        <XIcon />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="border-t border-border" />

          {/* ── Section 3: Edge Cases ─────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">3</span>
                Edge Cases
              </h3>
              <button
                type="button"
                onClick={() => dispatch({ type: "ADD_EDGE_CASE" })}
                className="px-3 py-1.5 text-sm bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 active:bg-amber-200 transition-colors font-medium"
              >
                + Add Edge Case
              </button>
            </div>
            <div className="space-y-4">
              {form.edgeCases.map((edge, index) => (
                <div key={index} className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <input
                      type="text"
                      value={edge.title}
                      onChange={(e) => dispatch({ type: "SET_EDGE_CASE", index, field: "title", value: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700/50 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-amber-500 bg-background"
                      placeholder="Edge case title"
                    />
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "REMOVE_EDGE_CASE", index })}
                      className="ml-2 p-1 hover:bg-red-100 active:bg-red-200 rounded text-red-600 transition-colors"
                      title="Remove edge case"
                    >
                      <XIcon />
                    </button>
                  </div>
                  <textarea
                    value={edge.description}
                    onChange={(e) => dispatch({ type: "SET_EDGE_CASE", index, field: "description", value: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700/50 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-amber-500 bg-background"
                    placeholder="Description"
                  />
                </div>
              ))}
            </div>
          </section>

          <div className="border-t border-border" />

          {/* ── Section 4: Escalation ─────────────────────────────────────── */}
          <section>
            <h3 className="text-lg font-semibold text-foreground mb-6 tracking-tight flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold">4</span>
              Escalation
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">When to Escalate</label>
                <textarea
                  value={form.escalationWhen}
                  onChange={(e) => dispatch({ type: "SET_FIELD", field: "escalationWhen", value: e.target.value })}
                  rows={2}
                  className={TEXTAREA_CLS}
                  placeholder="Describe escalation criteria"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Who to Contact</label>
                <input
                  type="text"
                  value={form.escalationWho}
                  onChange={(e) => dispatch({ type: "SET_FIELD", field: "escalationWho", value: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="Contact name and role"
                />
              </div>
            </div>
          </section>

          <div className="border-t border-border" />

          {/* ── Section 5: Contacts ───────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">5</span>
                Contacts
              </h3>
              <button
                type="button"
                onClick={() => dispatch({ type: "ADD_CONTACT" })}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors font-medium"
              >
                + Add Contact
              </button>
            </div>
            <div className="space-y-4">
              {form.contacts.map((contact, index) => (
                <div key={index} className="bg-surface border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={contact.name}
                        onChange={(e) => dispatch({ type: "SET_CONTACT", index, field: "name", value: e.target.value })}
                        className={INNER_INPUT_CLS}
                        placeholder="Name"
                      />
                      <input
                        type="text"
                        value={contact.role}
                        onChange={(e) => dispatch({ type: "SET_CONTACT", index, field: "role", value: e.target.value })}
                        className={INNER_INPUT_CLS}
                        placeholder="Role"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "REMOVE_CONTACT", index })}
                      className="ml-2 p-1 hover:bg-red-100 active:bg-red-200 rounded text-red-600 transition-colors"
                      title="Remove contact"
                    >
                      <XIcon />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <input
                      type="text"
                      value={contact.department}
                      onChange={(e) => dispatch({ type: "SET_CONTACT", index, field: "department", value: e.target.value })}
                      className={INNER_INPUT_CLS}
                      placeholder="Department"
                    />
                  </div>
                  <textarea
                    value={contact.description}
                    onChange={(e) => dispatch({ type: "SET_CONTACT", index, field: "description", value: e.target.value })}
                    rows={2}
                    className={INNER_TEXTAREA_CLS}
                    placeholder="When to contact this person (optional)"
                  />
                  <button
                    type="button"
                    onClick={() => toggleContactExpand(index)}
                    className="flex items-center gap-1 text-[13px] text-text-muted hover:text-accent transition-colors mt-3"
                  >
                    <ChevronDown
                      size={13}
                      strokeWidth={2}
                      className={`transition-transform duration-150 ${expandedContacts.has(index) ? "rotate-180" : ""}`}
                    />
                    {expandedContacts.has(index) ? "Hide optional links" : "Avatar, Teams, LinkedIn URLs"}
                  </button>
                  {expandedContacts.has(index) && (
                    <div className="space-y-3 mt-3">
                      <input
                        type="text"
                        value={contact.avatarUrl}
                        onChange={(e) => dispatch({ type: "SET_CONTACT", index, field: "avatarUrl", value: e.target.value })}
                        className={INNER_INPUT_CLS}
                        placeholder="Avatar URL (optional)"
                      />
                      <input
                        type="text"
                        value={contact.teamsUrl}
                        onChange={(e) => dispatch({ type: "SET_CONTACT", index, field: "teamsUrl", value: e.target.value })}
                        className={INNER_INPUT_CLS}
                        placeholder="Teams URL (optional)"
                      />
                      <input
                        type="text"
                        value={contact.linkedinUrl}
                        onChange={(e) => dispatch({ type: "SET_CONTACT", index, field: "linkedinUrl", value: e.target.value })}
                        className={INNER_INPUT_CLS}
                        placeholder="LinkedIn URL (optional)"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <div className="border-t border-border" />

          {/* ── Section 6: Reference Materials ────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-bold">6</span>
                Reference Materials
              </h3>
              <button
                type="button"
                onClick={() => dispatch({ type: "ADD_REFERENCE" })}
                className="px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 active:bg-green-200 transition-colors font-medium"
              >
                + Add Reference
              </button>
            </div>
            <div className="space-y-4">
              {form.referenceMaterials.map((ref, index) => (
                <div key={index} className="bg-surface border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <input
                      type="text"
                      value={ref.title}
                      onChange={(e) => dispatch({ type: "SET_REFERENCE", index, field: "title", value: e.target.value })}
                      className={`flex-1 ${INNER_INPUT_CLS}`}
                      placeholder="Document title"
                    />
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "REMOVE_REFERENCE", index })}
                      className="ml-2 p-1 hover:bg-red-100 active:bg-red-200 rounded text-red-600 transition-colors"
                      title="Remove reference"
                    >
                      <XIcon />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={ref.thumbnailUrl}
                      onChange={(e) => dispatch({ type: "SET_REFERENCE", index, field: "thumbnailUrl", value: e.target.value })}
                      className={INNER_INPUT_CLS}
                      placeholder="Thumbnail URL (optional)"
                    />
                    <input
                      type="text"
                      value={ref.fileUrl}
                      onChange={(e) => dispatch({ type: "SET_REFERENCE", index, field: "fileUrl", value: e.target.value })}
                      className={INNER_INPUT_CLS}
                      placeholder="File URL (optional)"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="h-4" />
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-t border-border bg-surface">
        <p className="text-xs text-text-muted">
          <span className="text-red-500">*</span> Required fields
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-text-secondary bg-background border border-border-strong rounded-xl hover:bg-surface active:bg-surface-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            className="px-5 py-2.5 text-sm font-medium text-accent-foreground bg-accent rounded-xl hover:bg-accent/90 active:bg-accent/80 disabled:bg-surface-3 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            {mode === "edit" ? "Save Changes" : "Save SOP"}
          </button>
        </div>
      </div>
    </>
  );
}
