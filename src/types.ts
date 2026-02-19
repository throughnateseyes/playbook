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
