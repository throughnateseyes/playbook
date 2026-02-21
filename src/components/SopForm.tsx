                                                                                                                                                                                                                                                                                                                                                                                                                                        "use client";

import React, { useReducer, useState, useCallback, useRef, useEffect } from "react";
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
  email: string;
  phone: string;
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
  return { name: "", role: "", department: "", description: "", email: "", phone: "", avatarUrl: "", teamsUrl: "", linkedinUrl: "" };
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
          email: c.email ?? "",
          phone: c.phone ?? "",
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
        ...(c.email.trim() ? { email: c.email } : {}),
        ...(c.phone.trim() ? { phone: c.phone } : {}),
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
  | { type: "REORDER_STEP"; from: number; to: number }
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
    case "REORDER_STEP": {
      if (action.from === action.to) return state;
      const steps = [...state.steps];
      const [moved] = steps.splice(action.from, 1);
      steps.splice(action.to, 0, moved);
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

// ── Popover components ───────────────────────────────────────────────────────

function ImageIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="1.5" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.25" />
      <circle cx="5.5" cy="5.5" r="1.25" stroke="currentColor" strokeWidth="1.25" />
      <path d="M1.5 11l3.5-3.5 2.5 2.5 2-1.5L14.5 13" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <polyline points="4,4 1,8 4,12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <polyline points="12,4 15,8 12,12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="9" y1="2" x2="7" y2="14" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function StepAttachmentPopover({
  stepIndex,
  visibleFields,
  onSelect,
  onClose,
}: {
  stepIndex: number;
  visibleFields: Set<string>;
  onSelect: (stepIndex: number, field: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const options = [
    { key: "imageUrl", label: "Add Photo", icon: <ImageIcon /> },
    { key: "script", label: "Add Script", icon: <CodeIcon /> },
  ].filter((opt) => !visibleFields.has(opt.key));

  if (options.length === 0) return null;

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-1.5 z-20 min-w-[160px] rounded-xl border border-border-muted bg-surface shadow-lg py-1"
    >
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onSelect(stepIndex, opt.key)}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-foreground hover:bg-surface-2 transition-colors duration-100"
        >
          <span className="text-text-muted">{opt.icon}</span>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const CONTACT_DETAIL_OPTIONS = [
  { key: "teamsUrl", label: "Teams" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "linkedinUrl", label: "LinkedIn" },
  { key: "avatarUrl", label: "Avatar URL" },
] as const;

function ContactDetailPopover({
  contactIndex,
  visibleFields,
  onSelect,
  onClose,
}: {
  contactIndex: number;
  visibleFields: Set<string>;
  onSelect: (contactIndex: number, field: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const options = CONTACT_DETAIL_OPTIONS.filter((opt) => !visibleFields.has(opt.key));

  if (options.length === 0) return null;

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-1.5 z-20 min-w-[160px] rounded-xl border border-border-muted bg-surface shadow-lg py-1"
    >
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          onClick={() => onSelect(contactIndex, opt.key)}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-foreground hover:bg-surface-2 transition-colors duration-100"
        >
          {opt.label}
        </button>
      ))}
    </div>
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
  const [visibleStepFields, setVisibleStepFields] = useState<Map<number, Set<string>>>(() => {
    const map = new Map<number, Set<string>>();
    if (initialData) {
      initial.steps.forEach((s, i) => {
        const fields = new Set<string>();
        if (s.imageUrl) fields.add("imageUrl");
        if (s.script) fields.add("script");
        if (fields.size > 0) map.set(i, fields);
      });
    }
    return map;
  });
  const [openStepPopover, setOpenStepPopover] = useState<number | null>(null);
  const [visibleContactFields, setVisibleContactFields] = useState<Map<number, Set<string>>>(() => {
    const map = new Map<number, Set<string>>();
    if (initialData) {
      initial.contacts.forEach((c, i) => {
        const fields = new Set<string>();
        if (c.email) fields.add("email");
        if (c.phone) fields.add("phone");
        if (c.avatarUrl) fields.add("avatarUrl");
        if (c.teamsUrl) fields.add("teamsUrl");
        if (c.linkedinUrl) fields.add("linkedinUrl");
        if (fields.size > 0) map.set(i, fields);
      });
    }
    return map;
  });
  const [openContactPopover, setOpenContactPopover] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    if (initialData) {
      const collapsed = new Set<string>();
      if (initial.edgeCases.every((ec) => !ec.title.trim() && !ec.description.trim())) collapsed.add("edgeCases");
      if (!initial.escalationWhen.trim() && !initial.escalationWho.trim()) collapsed.add("escalation");
      if (initial.contacts.every((c) => !c.name.trim())) collapsed.add("contacts");
      return collapsed;
    }
    return new Set(["edgeCases", "escalation", "contacts"]);
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const stepImageInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [stepImageDragging, setStepImageDragging] = useState<number | null>(null);
  const [showRefDropzone, setShowRefDropzone] = useState(false);

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const showStepField = useCallback((stepIndex: number, field: string) => {
    setVisibleStepFields((prev) => {
      const next = new Map(prev);
      const fields = new Set(prev.get(stepIndex) ?? []);
      fields.add(field);
      next.set(stepIndex, fields);
      return next;
    });
    setOpenStepPopover(null);
  }, []);

  const hideStepField = useCallback((stepIndex: number, field: string) => {
    setVisibleStepFields((prev) => {
      const next = new Map(prev);
      const fields = new Set(prev.get(stepIndex) ?? []);
      fields.delete(field);
      if (fields.size === 0) next.delete(stepIndex);
      else next.set(stepIndex, fields);
      return next;
    });
  }, []);

  const handleRemoveStep = useCallback((index: number) => {
    dispatch({ type: "REMOVE_STEP", index });
    setVisibleStepFields((prev) => {
      const next = new Map<number, Set<string>>();
      for (const [k, v] of prev) {
        if (k < index) next.set(k, v);
        else if (k > index) next.set(k - 1, v);
      }
      return next;
    });
    setOpenStepPopover(null);
  }, []);

  const showContactField = useCallback((contactIndex: number, field: string) => {
    setVisibleContactFields((prev) => {
      const next = new Map(prev);
      const fields = new Set(prev.get(contactIndex) ?? []);
      fields.add(field);
      next.set(contactIndex, fields);
      return next;
    });
    setOpenContactPopover(null);
  }, []);

  const hideContactField = useCallback((contactIndex: number, field: string) => {
    setVisibleContactFields((prev) => {
      const next = new Map(prev);
      const fields = new Set(prev.get(contactIndex) ?? []);
      fields.delete(field);
      if (fields.size === 0) next.delete(contactIndex);
      else next.set(contactIndex, fields);
      return next;
    });
  }, []);

  const handleRemoveContact = useCallback((index: number) => {
    dispatch({ type: "REMOVE_CONTACT", index });
    setVisibleContactFields((prev) => {
      const next = new Map<number, Set<string>>();
      for (const [k, v] of prev) {
        if (k < index) next.set(k, v);
        else if (k > index) next.set(k - 1, v);
      }
      return next;
    });
    setOpenContactPopover(null);
  }, []);

  const toggleSection = useCallback((section: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      const wasCollapsed = next.has(section);
      if (wasCollapsed) {
        next.delete(section);
        // Auto-add a starter item when expanding an empty section
        if (section === "edgeCases" && form.edgeCases.length === 0) {
          dispatch({ type: "ADD_EDGE_CASE" });
        } else if (section === "contacts" && form.contacts.length === 0) {
          dispatch({ type: "ADD_CONTACT" });
        }
      } else {
        next.add(section);
      }
      return next;
    });
  }, [form.edgeCases.length, form.contacts.length]);

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
        <section className="pt-8 pb-4">
          <div className="space-y-7">
            <div>
              <input
                type="text"
                value={form.title}
                onChange={(e) => {
                  dispatch({ type: "SET_FIELD", field: "title", value: e.target.value });
                  clearError("title");
                }}
                aria-label="SOP name"
                className="w-full text-2xl font-semibold tracking-tight text-foreground placeholder:text-text-faint bg-transparent border-none outline-none focus:outline-none py-1"
                placeholder="Choose SOP name"
              />
              {errors.title ? (
                <p className="text-xs text-red-500 mt-1.5" data-error>{errors.title}</p>
              ) : (
                <p className={`text-[11px] text-text-faint mt-1.5 transition-opacity duration-150 ${form.title.trim() ? "opacity-0" : "opacity-100"}`}>
                  SOP name required
                </p>
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
                  className="w-full pl-3.5 pr-12 py-2 rounded-lg border border-border-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background"
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
        <section className="pt-4 pb-10">
          <div className="flex items-center justify-between py-3 mb-4">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text-secondary">Steps</h3>
          </div>
          {errors.steps && <p className="text-xs text-red-500 mb-4" data-error>{errors.steps}</p>}
          <div className="space-y-3">
            {form.steps.map((step, index) => (
              <div
                key={index}
                className={`group/step relative border rounded-lg p-5 transition-all duration-150 animate-fade-in-up ${
                  draggingIndex === index
                    ? "opacity-50 border-border-strong"
                    : dragOverIndex === index && draggingIndex !== null
                    ? "border-t-2 border-accent"
                    : "border-border-muted"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggingIndex !== null && draggingIndex !== index) {
                    setDragOverIndex(index);
                  }
                }}
                onDragLeave={() => setDragOverIndex(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggingIndex !== null && draggingIndex !== index) {
                    dispatch({ type: "REORDER_STEP", from: draggingIndex, to: index });
                    // Re-index visible step fields after reorder
                    setVisibleStepFields((prev) => {
                      const arr = Array.from(prev.entries()).sort((a, b) => a[0] - b[0]);
                      const reordered = arr.map(([, v]) => v);
                      const item = reordered[draggingIndex];
                      if (item !== undefined) {
                        reordered.splice(draggingIndex, 1);
                        reordered.splice(index, 0, item);
                      }
                      const next = new Map<number, Set<string>>();
                      reordered.forEach((v, i) => { if (v && v.size > 0) next.set(i, v); });
                      return next;
                    });
                  }
                  setDraggingIndex(null);
                  setDragOverIndex(null);
                }}
              >
                <button
                  type="button"
                  onClick={() => handleRemoveStep(index)}
                  disabled={form.steps.length === 1}
                  className="absolute top-4 right-4 p-1 rounded-lg text-text-faint hover:text-foreground hover:bg-surface-2 opacity-0 group-hover/step:opacity-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150"
                  title="Remove step"
                >
                  <XIcon />
                </button>
                <div className="flex items-start gap-3 pr-8">
                  <div className="relative self-stretch flex items-center justify-center min-w-[2rem]">
                    <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[13px] font-semibold tabular-nums text-text-muted select-none leading-none">
                      {index + 1}
                    </span>
                    <div
                      draggable
                      onDragStart={() => setDraggingIndex(index)}
                      onDragEnd={() => { setDraggingIndex(null); setDragOverIndex(null); }}
                      className="flex items-center justify-center w-8 h-8 cursor-grab active:cursor-grabbing text-text-muted hover:text-text-secondary hover:bg-surface-2 rounded-md transition-all duration-150 select-none"
                      aria-hidden="true"
                      title="Drag to reorder"
                    >
                      <GripVertical size={18} strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => {
                        dispatch({ type: "SET_STEP", index, field: "title", value: e.target.value });
                        clearError("steps");
                      }}
                      className="w-full px-3.5 py-2 rounded-lg border border-border-muted text-sm text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background"
                      placeholder="Step title"
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
                    {/* Attachment popover trigger + individually revealed fields */}
                    {(() => {
                      const visible = visibleStepFields.get(index) ?? new Set<string>();
                      const allShown = visible.has("imageUrl") && visible.has("script");
                      return (
                        <>
                          {!allShown && (
                            <div className="relative mt-3">
                              <button
                                type="button"
                                onClick={() => setOpenStepPopover(openStepPopover === index ? null : index)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-text-muted border border-border-muted rounded-full hover:bg-surface-2 hover:text-foreground transition-colors duration-150"
                              >
                                + Add attachment
                              </button>
                              {openStepPopover === index && (
                                <StepAttachmentPopover
                                  stepIndex={index}
                                  visibleFields={visible}
                                  onSelect={showStepField}
                                  onClose={() => setOpenStepPopover(null)}
                                />
                              )}
                            </div>
                          )}
                          {visible.has("imageUrl") && (
                            <div className="mt-3 animate-fade-in-up">
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-[11px] font-medium uppercase tracking-wide text-text-muted">Image</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    dispatch({ type: "SET_STEP", index, field: "imageUrl", value: "" });
                                    hideStepField(index, "imageUrl");
                                  }}
                                  className="p-0.5 text-text-faint hover:text-foreground transition-colors"
                                  title="Remove image field"
                                >
                                  <XIcon />
                                </button>
                              </div>
                              <div
                                onDragOver={(e) => { e.preventDefault(); setStepImageDragging(index); }}
                                onDragLeave={() => setStepImageDragging(null)}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setStepImageDragging(null);
                                  const file = e.dataTransfer.files[0];
                                  if (file && file.type.startsWith("image/")) {
                                    const url = URL.createObjectURL(file);
                                    dispatch({ type: "SET_STEP", index, field: "imageUrl", value: url });
                                  }
                                }}
                                onClick={() => stepImageInputRefs.current[index]?.click()}
                                className={[
                                  "border border-dashed rounded-lg px-4 py-3 text-center cursor-pointer transition-colors duration-150",
                                  stepImageDragging === index
                                    ? "border-accent bg-accent/5"
                                    : "border-border-muted hover:border-border-strong hover:bg-surface-2/50",
                                ].join(" ")}
                              >
                                <p className="text-xs text-text-muted">
                                  Drag & drop an image, or{" "}
                                  <span className="font-medium text-foreground">Browse</span>
                                </p>
                                <input
                                  ref={(el) => { stepImageInputRefs.current[index] = el; }}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const url = URL.createObjectURL(file);
                                      dispatch({ type: "SET_STEP", index, field: "imageUrl", value: url });
                                    }
                                    e.target.value = "";
                                  }}
                                />
                              </div>
                              <input
                                type="text"
                                value={step.imageUrl}
                                onChange={(e) => dispatch({ type: "SET_STEP", index, field: "imageUrl", value: e.target.value })}
                                className="w-full mt-2 px-3.5 py-2 rounded-lg border border-border-muted text-sm text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background"
                                placeholder="Or paste image URL"
                              />
                            </div>
                          )}
                          {visible.has("script") && (
                            <div className="mt-3 animate-fade-in-up">
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-[11px] font-medium uppercase tracking-wide text-text-muted">Script</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    dispatch({ type: "SET_STEP", index, field: "script", value: "" });
                                    hideStepField(index, "script");
                                  }}
                                  className="p-0.5 text-text-faint hover:text-foreground transition-colors"
                                  title="Remove script field"
                                >
                                  <XIcon />
                                </button>
                              </div>
                              <textarea
                                value={step.script}
                                onChange={(e) => dispatch({ type: "SET_STEP", index, field: "script", value: e.target.value })}
                                rows={3}
                                className="w-full px-3.5 py-2 rounded-lg border border-border-muted text-sm leading-relaxed text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background font-mono resize-none"
                                placeholder="Script / code block"
                              />
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={() => dispatch({ type: "ADD_STEP" })}
              className="px-3 py-1.5 text-xs font-medium text-text-secondary border border-border-muted rounded-lg hover:bg-surface-2 hover:text-foreground hover:border-border-strong hover:shadow-sm active:bg-surface-3 transition-all duration-150"
            >
              + Add step
            </button>
          </div>
        </section>

        {/* ── Edge Cases ─────────────────────────────────────────── */}
        <section className={`pt-4 ${collapsedSections.has("edgeCases") ? "pb-0" : "pb-8"}`}>
          <button
            type="button"
            onClick={() => toggleSection("edgeCases")}
            className="group/header relative flex w-full items-center justify-between py-3 cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-lg"
          >
            <span className="absolute -inset-x-2 inset-y-0 rounded-lg bg-transparent group-hover/header:bg-surface-2 transition-colors duration-150 -z-10" />
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text-secondary">Edge Cases</h3>
            <ChevronDown
              size={16}
              strokeWidth={2}
              className={`text-text-faint transition-transform duration-200 ${
                collapsedSections.has("edgeCases") ? "" : "rotate-180"
              }`}
            />
          </button>
          {collapsedSections.has("edgeCases") ? (
            <div className="h-px bg-border-muted mt-1" />
          ) : (
            <div className="animate-accordion-open mt-3">
              <div className="space-y-3">
                {form.edgeCases.map((edge, index) => (
                  <div key={index} className="group border border-border-muted rounded-lg p-4 animate-fade-in-up">
                    <div className="flex items-start justify-between border-b border-border-muted pb-2 mb-2 -mx-4 px-4">
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
              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={() => dispatch({ type: "ADD_EDGE_CASE" })}
                  className="px-3 py-1.5 text-xs font-medium text-text-secondary border border-border-muted rounded-lg hover:bg-surface-2 hover:text-foreground hover:border-border-strong hover:shadow-sm active:bg-surface-3 transition-all duration-150"
                >
                  + Add edge case
                </button>
              </div>
              <div className="h-px bg-border-muted mt-6" />
            </div>
          )}
        </section>

        {/* ── Escalation ────────────────────────────────────────── */}
        <section className={`pt-4 ${collapsedSections.has("escalation") ? "pb-0" : "pb-8"}`}>
          <button
            type="button"
            onClick={() => toggleSection("escalation")}
            className="group/header relative flex w-full items-center justify-between py-3 cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-lg"
          >
            <span className="absolute -inset-x-2 inset-y-0 rounded-lg bg-transparent group-hover/header:bg-surface-2 transition-colors duration-150 -z-10" />
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text-secondary">Escalation</h3>
            <ChevronDown
              size={16}
              strokeWidth={2}
              className={`text-text-faint transition-transform duration-200 ${
                collapsedSections.has("escalation") ? "" : "rotate-180"
              }`}
            />
          </button>
          {collapsedSections.has("escalation") ? (
            <div className="h-px bg-border-muted mt-1" />
          ) : (
            <div className="animate-accordion-open mt-3">
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
              <div className="h-px bg-border-muted mt-6" />
            </div>
          )}
        </section>

        {/* ── Contacts ──────────────────────────────────────────── */}
        <section className={`pt-4 ${collapsedSections.has("contacts") ? "pb-0" : "pb-8"}`}>
          <button
            type="button"
            onClick={() => toggleSection("contacts")}
            className="group/header relative flex w-full items-center justify-between py-3 cursor-pointer transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-lg"
          >
            <span className="absolute -inset-x-2 inset-y-0 rounded-lg bg-transparent group-hover/header:bg-surface-2 transition-colors duration-150 -z-10" />
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text-secondary">Contacts</h3>
            <ChevronDown
              size={16}
              strokeWidth={2}
              className={`text-text-faint transition-transform duration-200 ${
                collapsedSections.has("contacts") ? "" : "rotate-180"
              }`}
            />
          </button>
          {collapsedSections.has("contacts") ? (
            <div className="h-px bg-border-muted mt-1" />
          ) : (
            <div className="animate-accordion-open mt-3">
              <div className="space-y-3">
                {form.contacts.map((contact, index) => {
                const visible = visibleContactFields.get(index) ?? new Set<string>();
                const allDetailShown = CONTACT_DETAIL_OPTIONS.every((opt) => visible.has(opt.key));
                return (
                  <div key={index} className="group relative border border-border-muted rounded-lg p-4 animate-fade-in-up">
                    <button
                      type="button"
                      onClick={() => handleRemoveContact(index)}
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

                    {/* Progressive detail fields */}
                    {!allDetailShown && (
                      <div className="relative mt-3">
                        <button
                          type="button"
                          onClick={() => setOpenContactPopover(openContactPopover === index ? null : index)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-text-muted border border-border-muted rounded-full hover:bg-surface-2 hover:text-foreground transition-colors duration-150"
                        >
                          + Add detail
                        </button>
                        {openContactPopover === index && (
                          <ContactDetailPopover
                            contactIndex={index}
                            visibleFields={visible}
                            onSelect={showContactField}
                            onClose={() => setOpenContactPopover(null)}
                          />
                        )}
                      </div>
                    )}

                    {visible.has("teamsUrl") && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] font-medium uppercase tracking-wide text-text-muted">Teams</label>
                          <button type="button" onClick={() => { dispatch({ type: "SET_CONTACT", index, field: "teamsUrl", value: "" }); hideContactField(index, "teamsUrl"); }} className="p-0.5 text-text-faint hover:text-foreground transition-colors" title="Remove field"><XIcon /></button>
                        </div>
                        <input type="text" value={contact.teamsUrl} onChange={(e) => dispatch({ type: "SET_CONTACT", index, field: "teamsUrl", value: e.target.value })} className="w-full px-3.5 py-2 rounded-lg border border-border-muted text-sm text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background" placeholder="Teams URL" />
                      </div>
                    )}
                    {visible.has("email") && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] font-medium uppercase tracking-wide text-text-muted">Email</label>
                          <button type="button" onClick={() => { dispatch({ type: "SET_CONTACT", index, field: "email", value: "" }); hideContactField(index, "email"); }} className="p-0.5 text-text-faint hover:text-foreground transition-colors" title="Remove field"><XIcon /></button>
                        </div>
                        <input type="text" value={contact.email} onChange={(e) => dispatch({ type: "SET_CONTACT", index, field: "email", value: e.target.value })} className="w-full px-3.5 py-2 rounded-lg border border-border-muted text-sm text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background" placeholder="Email address" />
                      </div>
                    )}
                    {visible.has("phone") && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] font-medium uppercase tracking-wide text-text-muted">Phone</label>
                          <button type="button" onClick={() => { dispatch({ type: "SET_CONTACT", index, field: "phone", value: "" }); hideContactField(index, "phone"); }} className="p-0.5 text-text-faint hover:text-foreground transition-colors" title="Remove field"><XIcon /></button>
                        </div>
                        <input type="text" value={contact.phone} onChange={(e) => dispatch({ type: "SET_CONTACT", index, field: "phone", value: e.target.value })} className="w-full px-3.5 py-2 rounded-lg border border-border-muted text-sm text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background" placeholder="Phone number" />
                      </div>
                    )}
                    {visible.has("linkedinUrl") && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] font-medium uppercase tracking-wide text-text-muted">LinkedIn</label>
                          <button type="button" onClick={() => { dispatch({ type: "SET_CONTACT", index, field: "linkedinUrl", value: "" }); hideContactField(index, "linkedinUrl"); }} className="p-0.5 text-text-faint hover:text-foreground transition-colors" title="Remove field"><XIcon /></button>
                        </div>
                        <input type="text" value={contact.linkedinUrl} onChange={(e) => dispatch({ type: "SET_CONTACT", index, field: "linkedinUrl", value: e.target.value })} className="w-full px-3.5 py-2 rounded-lg border border-border-muted text-sm text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background" placeholder="LinkedIn URL" />
                      </div>
                    )}
                    {visible.has("avatarUrl") && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="block text-[11px] font-medium uppercase tracking-wide text-text-muted">Avatar</label>
                          <button type="button" onClick={() => { dispatch({ type: "SET_CONTACT", index, field: "avatarUrl", value: "" }); hideContactField(index, "avatarUrl"); }} className="p-0.5 text-text-faint hover:text-foreground transition-colors" title="Remove field"><XIcon /></button>
                        </div>
                        <input type="text" value={contact.avatarUrl} onChange={(e) => dispatch({ type: "SET_CONTACT", index, field: "avatarUrl", value: e.target.value })} className="w-full px-3.5 py-2 rounded-lg border border-border-muted text-sm text-foreground placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent bg-background" placeholder="Avatar URL" />
                      </div>
                    )}
                  </div>
                );
              })}
              </div>
              <div className="flex justify-end mt-3">
                <button
                  type="button"
                  onClick={() => dispatch({ type: "ADD_CONTACT" })}
                  className="px-3 py-1.5 text-xs font-medium text-text-secondary border border-border-muted rounded-lg hover:bg-surface-2 hover:text-foreground hover:border-border-strong hover:shadow-sm active:bg-surface-3 transition-all duration-150"
                >
                  + Add contact
                </button>
              </div>
              <div className="h-px bg-border-muted mt-6" />
            </div>
          )}
        </section>

        {/* ── Reference Materials ────────────────────────────────── */}
        <section className="pt-4 pb-8">
          <div className="py-3">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-text-secondary">Reference Materials</h3>
          </div>
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                setShowRefDropzone(true);
                fileInputRef.current?.click();
              }}
              className="px-3 py-1.5 text-xs font-medium text-text-secondary border border-border-muted rounded-lg hover:bg-surface-2 hover:text-foreground hover:border-border-strong hover:shadow-sm active:bg-surface-3 transition-all duration-150"
            >
              + Add material
            </button>
          </div>

          {/* Dropzone — shown on demand */}
          {showRefDropzone && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={[
                "border-2 border-dashed rounded-lg px-6 py-8 text-center cursor-pointer transition-colors duration-150 mb-4",
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
          )}

          {/* File list */}
          {form.referenceMaterials.some((r) => r.title.trim() || r.file) && (
            <div className="space-y-2">
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
