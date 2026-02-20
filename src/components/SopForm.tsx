                                                                                                                                                                                                                                                                                                                                                                                                                                        "use client";

import React, { useReducer, useState, useCallback, useRef } from "react";
import { ChevronDown, FileText, GripVertical, UploadCloud } from "lucide-react";
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
  caption: string;
  thumbnailUrl: string;
  fileUrl: string;
  fileName: string;
  file: File | null;
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
  return { title: "", caption: "", thumbnailUrl: "", fileUrl: "", fileName: "", file: null };
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
          caption: r.caption ?? "",
          thumbnailUrl: r.thumbnailUrl ?? "",
          fileUrl: r.fileUrl ?? "",
          fileName: "",
          file: null,
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
        ...(r.caption.trim() ? { caption: r.caption } : {}),
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
  | { type: "ADD_FILES"; files: File[] }
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
    case "ADD_FILES":
      return {
        ...state,
        referenceMaterials: [
          ...state.referenceMaterials.filter((r) => r.title.trim() || r.file),
          ...action.files.map((f) => ({
            title: f.name.replace(/\.[^/.]+$/, ""),
            caption: "",
            thumbnailUrl: "",
            fileUrl: "",
            fileName: f.name,
            file: f,
          })),
        ],
      };

    case "RESET":
      return action.data;

    default:
      return state;
  }
}

// ── Icons (inline SVGs to avoid extra lucide imports) ────────────────────────

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

  // ── File upload (Reference Materials) ──
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) dispatch({ type: "ADD_FILES", files });
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) dispatch({ type: "ADD_FILES", files });
    e.target.value = "";
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-8">
        {/* ── Basic Information ──────────────────────────────────── */}
        <section className="pt-10 pb-12">
          <div className="space-y-7">
            <div>
              <input
                type="text"
                value={form.title}
                onChange={(e) => {
                  dispatch({ type: "SET_FIELD", field: "title", value: e.target.value });
                  clearError("title");
                }}
                aria-label="SOP title"
                className="w-full text-2xl font-semibold tracking-tight text-foreground placeholder:text-text-faint bg-transparent border-none outline-none focus:outline-none py-1"
                placeholder="Untitled procedure"
              />
              {errors.title ? (
                <p className="text-xs text-red-500 mt-1.5" data-error>{errors.title}</p>
              ) : (
                <p className="text-[11px] text-text-faint mt-1.5">Required</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wide text-text-muted mb-2">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) => {
                    dispatch({ type: "SET_FIELD", field: "category", value: e.target.value });
                    clearError("category");
                  }}
                  className="w-full px-3.5 py-2 rounded-lg border border-border-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.category && <p className="text-xs text-red-500 mt-1.5" data-error>{errors.category}</p>}
              </div>
              <div>
                <label className="block text-[11px] font-medium uppercase tracking-wide text-text-muted mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => dispatch({ type: "SET_FIELD", field: "tags", value: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-lg border border-border-muted text-sm text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background"
                  placeholder="e.g., Urgent, After-Hours"
                />
                <p className="mt-1.5 text-[11px] text-text-faint">Comma-separated</p>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-text-muted mb-2">
                Overview
              </label>
              <textarea
                value={form.overview}
                onChange={(e) => dispatch({ type: "SET_FIELD", field: "overview", value: e.target.value })}
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-lg border border-border-muted text-sm leading-relaxed text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background resize-none"
                placeholder="What is this procedure about?"
              />
            </div>
          </div>
        </section>

        {/* ── Steps ─────────────────────────────────────────────── */}
        <section className="border-t border-border-muted pt-7 pb-9">
          <div className="flex items-center justify-between mb-5">
            <h3 className="ty-section-label">Steps</h3>
            <button
              type="button"
              onClick={() => dispatch({ type: "ADD_STEP" })}
              className="px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-surface-2 hover:text-foreground rounded-lg transition-colors duration-150"
            >
              + Add step
            </button>
          </div>
          {errors.steps && <p className="text-xs text-red-500 mb-4" data-error>{errors.steps}</p>}
          <div className="space-y-3">
            {form.steps.map((step, index) => (
              <div key={index} className="group/step border border-border-muted rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <span className="text-[12px] font-medium text-text-faint tabular-nums w-5 text-right pt-2.5 select-none">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0 space-y-3">
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => {
                        dispatch({ type: "SET_STEP", index, field: "title", value: e.target.value });
                        clearError("steps");
                      }}
                      className="w-full px-3.5 py-2 rounded-lg border border-border-muted text-sm text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background"
                      placeholder="Step title (optional)"
                    />
                    <textarea
                      value={step.text}
                      onChange={(e) => {
                        dispatch({ type: "SET_STEP", index, field: "text", value: e.target.value });
                        clearError("steps");
                      }}
                      rows={2}
                      className="w-full px-3.5 py-2 rounded-lg border border-border-muted text-sm leading-relaxed text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background resize-none"
                      placeholder="Detailed instructions for this step"
                    />
                    <button
                      type="button"
                      onClick={() => toggleStepExpand(index)}
                      className="flex items-center gap-1 text-[11px] font-medium text-text-muted hover:text-foreground transition-colors mt-3"
                    >
                      <ChevronDown
                        size={13}
                        strokeWidth={2}
                        className={`transition-transform duration-150 ${expandedSteps.has(index) ? "rotate-180" : ""}`}
                      />
                      {expandedSteps.has(index) ? "Hide attachments" : "Attachments"}
                    </button>
                    {expandedSteps.has(index) && (
                      <div className="space-y-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-medium uppercase tracking-wide text-text-muted mb-2">Image</label>
                          <input
                            type="text"
                            value={step.imageUrl}
                            onChange={(e) => dispatch({ type: "SET_STEP", index, field: "imageUrl", value: e.target.value })}
                            className="w-full px-3.5 py-2 rounded-lg border border-border-muted text-sm text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background"
                            placeholder="Image URL"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium uppercase tracking-wide text-text-muted mb-2">Script</label>
                          <textarea
                            value={step.script}
                            onChange={(e) => dispatch({ type: "SET_STEP", index, field: "script", value: e.target.value })}
                            rows={3}
                            className="w-full px-3.5 py-2 rounded-lg border border-border-muted text-sm leading-relaxed text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background font-mono resize-none"
                            placeholder="Script / code block"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1 pt-1.5">
                    <span
                      className="p-1 text-text-faint/40 group-hover/step:text-text-faint cursor-grab transition-colors duration-150"
                      aria-hidden="true"
                      title="Drag to reorder"
                    >
                      <GripVertical size={16} strokeWidth={1.75} />
                    </span>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "REMOVE_STEP", index })}
                      disabled={form.steps.length === 1}
                      className="p-1 rounded-lg text-text-faint hover:text-foreground hover:bg-surface-2 opacity-0 group-hover/step:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
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

        {/* ── Edge Cases ─────────────────────────────────────────── */}
        <section className="border-t border-border-muted pt-7 pb-9">
          <div className="flex items-center justify-between mb-5">
            <h3 className="ty-section-label">Edge Cases</h3>
            <button
              type="button"
              onClick={() => dispatch({ type: "ADD_EDGE_CASE" })}
              className="px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-surface-2 hover:text-foreground rounded-lg transition-colors duration-150"
            >
              + Add edge case
            </button>
          </div>
          <div className="space-y-3">
            {form.edgeCases.map((edge, index) => (
              <div key={index} className="group border border-border-muted rounded-lg p-4">
                <div className="flex items-start justify-between mb-1.5">
                  <input
                    type="text"
                    value={edge.title}
                    onChange={(e) => dispatch({ type: "SET_EDGE_CASE", index, field: "title", value: e.target.value })}
                    className="flex-1 w-full text-sm font-medium text-foreground placeholder:text-text-faint bg-transparent border-none outline-none focus:outline-none"
                    placeholder="Edge case title"
                  />
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "REMOVE_EDGE_CASE", index })}
                    className="ml-2 p-1 hover:bg-surface-2 rounded-lg text-text-faint hover:text-foreground opacity-0 group-hover:opacity-100 transition-all duration-150"
                    title="Remove edge case"
                  >
                    <XIcon />
                  </button>
                </div>
                <textarea
                  value={edge.description}
                  onChange={(e) => dispatch({ type: "SET_EDGE_CASE", index, field: "description", value: e.target.value })}
                  rows={2}
                  className="w-full px-0 py-1 text-sm leading-relaxed text-foreground placeholder:text-text-faint bg-transparent border-none outline-none focus:outline-none resize-none"
                  placeholder="Describe how to handle this case…"
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── Escalation ────────────────────────────────────────── */}
        <section className="border-t border-border-muted pt-7 pb-9">
          <h3 className="ty-section-label mb-1.5">Escalation</h3>
          <p className="text-[11px] text-text-faint mb-5">Only include escalation when it requires a different owner or a safety/financial threshold.</p>
          <div className="rounded-lg border border-border-muted p-5 space-y-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-text-muted mb-2">When to escalate</label>
              <textarea
                value={form.escalationWhen}
                onChange={(e) => dispatch({ type: "SET_FIELD", field: "escalationWhen", value: e.target.value })}
                rows={2}
                className="w-full px-3.5 py-2 rounded-lg border border-border-muted text-sm leading-relaxed text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background resize-none"
                placeholder="Describe escalation criteria"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wide text-text-muted mb-2">Who to contact</label>
              <input
                type="text"
                value={form.escalationWho}
                onChange={(e) => dispatch({ type: "SET_FIELD", field: "escalationWho", value: e.target.value })}
                className="w-full px-3.5 py-2 rounded-lg border border-border-muted text-sm text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background"
                placeholder="Name, role, or contact info"
              />
            </div>
          </div>
        </section>

        {/* ── Contacts ──────────────────────────────────────────── */}
        <section className="border-t border-border-muted pt-7 pb-9">
          <div className="flex items-center justify-between mb-5">
            <h3 className="ty-section-label">Contacts</h3>
            <button
              type="button"
              onClick={() => dispatch({ type: "ADD_CONTACT" })}
              className="px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-surface-2 hover:text-foreground rounded-lg transition-colors duration-150"
            >
              + Add contact
            </button>
          </div>
          <div className="space-y-3">
            {form.contacts.map((contact, index) => (
              <div key={index} className="group relative border border-border-muted rounded-lg p-4">
                <button
                  type="button"
                  onClick={() => dispatch({ type: "REMOVE_CONTACT", index })}
                  className="absolute top-3 right-3 p-1 hover:bg-surface-2 rounded-lg text-text-faint hover:text-foreground opacity-0 group-hover:opacity-100 transition-all duration-150"
                  title="Remove contact"
                >
                  <XIcon />
                </button>
                <div className="grid grid-cols-2 gap-3 pr-8">
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => dispatch({ type: "SET_CONTACT", index, field: "name", value: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-border-muted text-sm text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background"
                    placeholder="Name"
                  />
                  <input
                    type="text"
                    value={contact.role}
                    onChange={(e) => dispatch({ type: "SET_CONTACT", index, field: "role", value: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-border-muted text-sm text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background"
                    placeholder="Role"
                  />
                </div>
                <div className="mt-3">
                  <input
                    type="text"
                    value={contact.department}
                    onChange={(e) => dispatch({ type: "SET_CONTACT", index, field: "department", value: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg border border-border-muted text-sm text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background"
                    placeholder="Department"
                  />
                </div>
                <div className="mt-3">
                  <label className="block text-[11px] font-medium uppercase tracking-wide text-text-muted mb-1.5">When to contact</label>
                  <textarea
                    value={contact.description}
                    onChange={(e) => dispatch({ type: "SET_CONTACT", index, field: "description", value: e.target.value })}
                    rows={2}
                    className="w-full px-3.5 py-2 rounded-lg border border-border-muted text-sm leading-relaxed text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background resize-none"
                    placeholder="Describe when to reach out to this person (optional)"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => toggleContactExpand(index)}
                  className="flex items-center gap-1 text-[11px] font-medium text-text-muted hover:text-foreground transition-colors mt-3"
                >
                  <ChevronDown
                    size={13}
                    strokeWidth={2}
                    className={`transition-transform duration-150 ${expandedContacts.has(index) ? "rotate-180" : ""}`}
                  />
                  {expandedContacts.has(index) ? "Hide advanced" : "Advanced"}
                </button>
                {expandedContacts.has(index) && (
                  <div className="space-y-3 mt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={contact.avatarUrl}
                        onChange={(e) => dispatch({ type: "SET_CONTACT", index, field: "avatarUrl", value: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-lg border border-border-muted text-sm text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background"
                        placeholder="Avatar URL"
                      />
                      <input
                        type="text"
                        value={contact.teamsUrl}
                        onChange={(e) => dispatch({ type: "SET_CONTACT", index, field: "teamsUrl", value: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-lg border border-border-muted text-sm text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background"
                        placeholder="Teams URL"
                      />
                    </div>
                    <input
                      type="text"
                      value={contact.linkedinUrl}
                      onChange={(e) => dispatch({ type: "SET_CONTACT", index, field: "linkedinUrl", value: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg border border-border-muted text-sm text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background"
                      placeholder="LinkedIn URL"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Reference Materials ────────────────────────────────── */}
        <section className="border-t border-border-muted pt-7 pb-9">
          <h3 className="ty-section-label mb-5">Reference Materials</h3>

          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={[
              "border-2 border-dashed rounded-lg px-6 py-8 text-center cursor-pointer transition-colors duration-150",
              isDragging
                ? "border-accent bg-accent/5"
                : "border-border-muted hover:border-border-strong hover:bg-surface-2/50",
            ].join(" ")}
          >
            <UploadCloud size={20} strokeWidth={1.5} className="mx-auto mb-2 text-text-faint" />
            <p className="text-sm text-text-muted">
              Drop files here or{" "}
              <span className="font-medium text-foreground">Browse files</span>
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* File list */}
          {form.referenceMaterials.some((r) => r.title.trim() || r.file) && (
            <div className="space-y-2 mt-4">
              {form.referenceMaterials.map((ref, index) =>
                !ref.title.trim() && !ref.file ? null : (
                  <div key={index} className="group relative flex items-start gap-3 border border-border-muted rounded-lg p-3">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center">
                      <FileText size={16} strokeWidth={1.5} className="text-text-faint" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={ref.title}
                          onChange={(e) => dispatch({ type: "SET_REFERENCE", index, field: "title", value: e.target.value })}
                          className="flex-1 min-w-0 text-sm font-medium text-foreground placeholder:text-text-faint bg-transparent border-none outline-none focus:outline-none"
                          placeholder="Document title"
                        />
                        {ref.fileName && (
                          <span className="flex-shrink-0 text-[11px] text-text-faint truncate max-w-[140px]">
                            {ref.fileName}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={ref.caption}
                        onChange={(e) => dispatch({ type: "SET_REFERENCE", index, field: "caption", value: e.target.value })}
                        className="w-full text-sm text-foreground placeholder:text-text-faint bg-transparent border-none outline-none focus:outline-none"
                        placeholder="Caption (optional)"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "REMOVE_REFERENCE", index })}
                      className="absolute top-3 right-3 p-1 hover:bg-surface-2 rounded-lg text-text-faint hover:text-foreground opacity-0 group-hover:opacity-100 transition-all duration-150"
                      title="Remove reference"
                    >
                      <XIcon />
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 flex items-center justify-between px-8 py-4 border-t border-border bg-background">
        <p className="text-xs text-text-faint">Title and category are required</p>
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
