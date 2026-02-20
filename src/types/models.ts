// ── SOP-related types ──────────────────────────────────

export interface EdgeCase {
  title: string;
  description: string;
}

export interface Escalation {
  when: string;
  who: string;
}

export interface Contact {
  name: string;
  role: string;
  department: string;
  description?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  teamsUrl?: string;
  linkedinUrl?: string;
}

export interface Step {
  text: string;
  title?: string;
  imageUrl?: string;
  script?: string;
}

export interface ReferenceMaterial {
  title: string;
  caption?: string;
  thumbnailUrl?: string;
  fileUrl?: string;
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
