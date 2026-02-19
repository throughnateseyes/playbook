import type {
  SOP,
  Step,
  EdgeCase,
  Escalation,
  Contact,
  StepAttachment,
  ReferenceMaterial,
} from "../types";

// ── Internal helpers ───────────────────────────────────

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function arr<T>(value: unknown, mapFn: (item: unknown) => T): T[] {
  if (!Array.isArray(value)) return [];
  return value.map(mapFn);
}

function obj(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

// ── Per-entity normalizers ─────────────────────────────

function normalizeStepAttachment(raw: unknown): StepAttachment {
  const r = obj(raw);
  const t = str(r.type);
  return {
    type: t === "image" ? "image" : "file",
    url: str(r.url),
    ...(typeof r.label === "string" ? { label: r.label } : {}),
  };
}

function normalizeStep(raw: unknown): Step {
  if (typeof raw === "string") return { title: raw };
  const r = obj(raw);
  return {
    title: str(r.title),
    ...(typeof r.description === "string" ? { description: r.description } : {}),
    ...(typeof r.script === "string" ? { script: r.script } : {}),
    ...(Array.isArray(r.attachments)
      ? { attachments: r.attachments.map(normalizeStepAttachment) }
      : {}),
  };
}

function normalizeEdgeCase(raw: unknown): EdgeCase {
  const r = obj(raw);
  return {
    title: str(r.title),
    description: str(r.description),
  };
}

function normalizeEscalation(raw: unknown): Escalation {
  const r = obj(raw);
  return {
    when: str(r.when),
    contact: str(r.contact),
  };
}

function normalizeContact(raw: unknown): Contact {
  const r = obj(raw);
  return {
    label: str(r.label),
    name: str(r.name),
    team: str(r.team),
    reason: str(r.reason),
    ...(typeof r.teamsUrl === "string" ? { teamsUrl: r.teamsUrl } : {}),
    ...(typeof r.linkedinUrl === "string" ? { linkedinUrl: r.linkedinUrl } : {}),
  };
}

function normalizeReferenceMaterial(raw: unknown): ReferenceMaterial {
  const r = obj(raw);
  return {
    title: str(r.title),
    fileUrl: str(r.fileUrl),
    ...(typeof r.thumbnailUrl === "string" ? { thumbnailUrl: r.thumbnailUrl } : {}),
  };
}

// ── Exported normalizers ───────────────────────────────

export function normalizeSOP(raw: unknown): SOP {
  const r = obj(raw);
  return {
    id: str(r.id, String(Date.now())),
    title: str(r.title, "Untitled"),
    category: str(r.category, "Operations"),
    tags: arr(r.tags, (t) => str(t)),
    lastUpdated: str(r.lastUpdated),
    overview: str(r.overview),
    steps: arr(r.steps, normalizeStep),
    edgeCases: arr(r.edgeCases, normalizeEdgeCase),
    escalation: normalizeEscalation(r.escalation),
    contacts: arr(r.contacts, normalizeContact),
    referenceMaterials: arr(r.referenceMaterials, normalizeReferenceMaterial),
  };
}

export function normalizeSOPs(raw: unknown): SOP[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeSOP);
}
