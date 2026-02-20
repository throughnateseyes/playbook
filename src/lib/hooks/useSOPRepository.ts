import { useState, useEffect, useCallback, useRef } from "react";
import type { SOP } from "../../types";
import { LocalSOPRepository } from "../sopRepository";

export function useSOPRepository(
  workspaceId: string,
  initialSops: SOP[],
) {
  const repoRef = useRef(new LocalSOPRepository(workspaceId));
  const [sops, setSops] = useState<SOP[]>(initialSops);

  // Hydrate from localStorage on mount, seeding if needed
  useEffect(() => {
    const loaded = repoRef.current.seed(initialSops);
    setSops(loaded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createSOP = useCallback((sop: SOP): SOP => {
    const created = repoRef.current.create(sop);
    setSops((prev) => [...prev, created]);
    return created;
  }, []);

  const updateSOP = useCallback((id: string, patch: Partial<SOP>): SOP => {
    const updated = repoRef.current.update(id, patch);
    setSops((prev) => prev.map((s) => (s.id === id ? updated : s)));
    return updated;
  }, []);

  const deleteSOP = useCallback((id: string): void => {
    repoRef.current.delete(id);
    setSops((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { sops, createSOP, updateSOP, deleteSOP };
}
