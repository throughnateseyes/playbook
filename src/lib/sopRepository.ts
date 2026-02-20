import type { SOP } from "../types";
import { normalizeSOPs, normalizeSOP } from "./normalize";

// ── Interface ─────────────────────────────────────────────

export interface SOPRepository {
  list(): SOP[];
  get(id: string): SOP | undefined;
  create(sop: SOP): SOP;
  update(id: string, patch: Partial<SOP>): SOP;
  delete(id: string): void;
}

// ── localStorage implementation ───────────────────────────

export class LocalSOPRepository implements SOPRepository {
  private readonly storageKey: string;

  constructor(workspaceId: string) {
    this.storageKey = `playbook_sops_${workspaceId}`;
  }

  private readAll(): SOP[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return [];
      return normalizeSOPs(JSON.parse(raw));
    } catch {
      return [];
    }
  }

  private writeAll(sops: SOP[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(sops));
    } catch {
      /* quota exceeded — silently fail */
    }
  }

  list(): SOP[] {
    return this.readAll();
  }

  get(id: string): SOP | undefined {
    return this.readAll().find((s) => s.id === id);
  }

  create(sop: SOP): SOP {
    const all = this.readAll();
    const normalized = normalizeSOP(sop);
    all.push(normalized);
    this.writeAll(all);
    return normalized;
  }

  update(id: string, patch: Partial<SOP>): SOP {
    const all = this.readAll();
    const idx = all.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error(`SOP not found: ${id}`);
    const updated = normalizeSOP({ ...all[idx], ...patch });
    all[idx] = updated;
    this.writeAll(all);
    return updated;
  }

  delete(id: string): void {
    const all = this.readAll().filter((s) => s.id !== id);
    this.writeAll(all);
  }

  /** Write initial SOPs only if storage is empty. Returns current data either way. */
  seed(sops: SOP[]): SOP[] {
    const existing = this.readAll();
    if (existing.length > 0) return existing;
    this.writeAll(sops);
    return sops;
  }
}
