import type {
  SOP,
  Step,
  EdgeCase,
  Escalation,
  Contact,
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

function normalizeStep(raw: unknown): Step {
  if (typeof raw === "string") return { text: raw };
  const r = obj(raw);
  return {
    text: str(r.text || r.description || r.title),
    ...(typeof r.title === "string" ? { title: r.title } : {}),
    ...(typeof r.imageUrl === "string" ? { imageUrl: r.imageUrl } : {}),
    ...(typeof r.script === "string" ? { script: r.script } : {}),
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
    who: str(r.who || r.contact),
  };
}

function normalizeContact(raw: unknown): Contact {
  const r = obj(raw);
  return {
    name: str(r.name),
    role: str(r.role || r.label),
    department: str(r.department || r.team),
    ...(typeof (r.description ?? r.reason) === "string"
      ? { description: str(r.description || r.reason) }
      : {}),
    ...(typeof r.avatarUrl === "string" ? { avatarUrl: r.avatarUrl } : {}),
    ...(typeof r.teamsUrl === "string" ? { teamsUrl: r.teamsUrl } : {}),
    ...(typeof r.linkedinUrl === "string" ? { linkedinUrl: r.linkedinUrl } : {}),
  };
}

function normalizeReferenceMaterial(raw: unknown): ReferenceMaterial {
  const r = obj(raw);
  return {
    title: str(r.title),
    ...(typeof r.thumbnailUrl === "string" ? { thumbnailUrl: r.thumbnailUrl } : {}),
    ...(typeof r.fileUrl === "string" ? { fileUrl: r.fileUrl } : {}),
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
