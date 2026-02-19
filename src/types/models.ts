// ── SOP-related types ──────────────────────────────────

export interface EdgeCase {
  title: string;
  description: string;
}

export interface Escalation {
  when: string;
  contact: string;
}

export interface Contact {
  label: string;
  name: string;
  team: string;
  reason: string;
  teamsUrl?: string;
  linkedinUrl?: string;
}

export interface StepAttachment {
  type: "image" | "file";
  url: string;
  label?: string;
}

export interface Step {
  title: string;
  description?: string;
  script?: string;
  attachments?: StepAttachment[];
}

export interface ReferenceMaterial {
  title: string;
  fileUrl: string;
  thumbnailUrl?: string;
}

export interface SOP {
  id: string;
  title: string;
  category: string;
  tags: string[];
  lastUpdated: string;
  overview: string;
  steps: Step[];
  edgeCases: EdgeCase[];
  escalation: Escalation;
  contacts: Contact[];
  referenceMaterials: ReferenceMaterial[];
}

// ── Workspace / User types (Supabase-ready) ────────────

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export type UserRole = "admin" | "member";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  workspaceId: string;
  avatarUrl?: string;
}
