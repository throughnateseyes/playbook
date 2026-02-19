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
}

export interface SOP {
  id: string;
  title: string;
  category: string;
  tags: string[];
  lastUpdated: string;
  overview: string;
  steps: string[];
  edgeCases: EdgeCase[];
  escalation: Escalation;
  contacts: Contact[];
  photos: string[];
}
