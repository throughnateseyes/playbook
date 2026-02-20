import { describe, it, expect } from "vitest";
import { normalizeSOP, normalizeSOPs } from "../normalize";

describe("normalizeSOP", () => {
  it("returns a full SOP shape from an empty object", () => {
    const sop = normalizeSOP({});
    expect(sop.title).toBe("Untitled");
    expect(sop.category).toBe("Operations");
    expect(sop.tags).toEqual([]);
    expect(sop.steps).toEqual([]);
    expect(sop.edgeCases).toEqual([]);
    expect(sop.escalation).toEqual({ when: "", who: "" });
    expect(sop.contacts).toEqual([]);
    expect(sop.referenceMaterials).toEqual([]);
    expect(typeof sop.id).toBe("string");
    expect(sop.id.length).toBeGreaterThan(0);
  });

  it("preserves provided id and title", () => {
    const sop = normalizeSOP({ id: "abc", title: "My SOP" });
    expect(sop.id).toBe("abc");
    expect(sop.title).toBe("My SOP");
  });

  it("normalizes a step from a plain string", () => {
    const sop = normalizeSOP({ steps: ["Do this thing"] });
    expect(sop.steps).toEqual([{ text: "Do this thing" }]);
  });

  it("normalizes a step with title and text", () => {
    const sop = normalizeSOP({
      steps: [{ title: "Step One", text: "Details here", script: "echo hi" }],
    });
    expect(sop.steps[0]).toEqual({
      title: "Step One",
      text: "Details here",
      script: "echo hi",
    });
  });

  it("fills text from title when text is missing (legacy shape)", () => {
    const sop = normalizeSOP({ steps: [{ title: "Only Title" }] });
    expect(sop.steps[0].text).toBe("Only Title");
    expect(sop.steps[0].title).toBe("Only Title");
  });

  it("fills text from description (legacy shape)", () => {
    const sop = normalizeSOP({ steps: [{ description: "Old desc" }] });
    expect(sop.steps[0].text).toBe("Old desc");
  });

  it("includes imageUrl when present on step", () => {
    const sop = normalizeSOP({
      steps: [{ text: "Check diagram", imageUrl: "https://example.com/img.png" }],
    });
    expect(sop.steps[0].imageUrl).toBe("https://example.com/img.png");
  });

  it("omits imageUrl when not present", () => {
    const sop = normalizeSOP({ steps: [{ text: "No image" }] });
    expect(sop.steps[0]).not.toHaveProperty("imageUrl");
  });

  it("maps legacy contact fields (label → role, team → department, reason → description)", () => {
    const sop = normalizeSOP({
      contacts: [{ name: "Alice", label: "Manager", team: "Eng", reason: "Primary contact" }],
    });
    expect(sop.contacts[0]).toMatchObject({
      name: "Alice",
      role: "Manager",
      department: "Eng",
      description: "Primary contact",
    });
  });

  it("prefers new contact field names over legacy", () => {
    const sop = normalizeSOP({
      contacts: [{ name: "Bob", role: "Lead", department: "Sales", description: "Key person" }],
    });
    expect(sop.contacts[0]).toMatchObject({
      name: "Bob",
      role: "Lead",
      department: "Sales",
      description: "Key person",
    });
  });

  it("includes optional contact URLs when present", () => {
    const sop = normalizeSOP({
      contacts: [{
        name: "Carol",
        role: "VP",
        department: "Ops",
        avatarUrl: "https://example.com/avatar.jpg",
        teamsUrl: "https://teams.example.com/carol",
        linkedinUrl: "https://linkedin.com/carol",
      }],
    });
    expect(sop.contacts[0].avatarUrl).toBe("https://example.com/avatar.jpg");
    expect(sop.contacts[0].teamsUrl).toBe("https://teams.example.com/carol");
    expect(sop.contacts[0].linkedinUrl).toBe("https://linkedin.com/carol");
  });

  it("omits optional contact fields when not present", () => {
    const sop = normalizeSOP({
      contacts: [{ name: "Dave", role: "Eng", department: "IT" }],
    });
    expect(sop.contacts[0]).not.toHaveProperty("description");
    expect(sop.contacts[0]).not.toHaveProperty("avatarUrl");
    expect(sop.contacts[0]).not.toHaveProperty("teamsUrl");
    expect(sop.contacts[0]).not.toHaveProperty("linkedinUrl");
  });

  it("maps legacy escalation.contact → who", () => {
    const sop = normalizeSOP({
      escalation: { when: "System is down", contact: "Jane Doe" },
    });
    expect(sop.escalation).toEqual({ when: "System is down", who: "Jane Doe" });
  });

  it("uses escalation.who when provided directly", () => {
    const sop = normalizeSOP({
      escalation: { when: "Urgent", who: "John" },
    });
    expect(sop.escalation.who).toBe("John");
  });

  it("normalizes reference materials with optional fileUrl", () => {
    const sop = normalizeSOP({
      referenceMaterials: [
        { title: "Guide", fileUrl: "https://example.com/guide.pdf" },
        { title: "Draft" },
      ],
    });
    expect(sop.referenceMaterials[0]).toEqual({
      title: "Guide",
      fileUrl: "https://example.com/guide.pdf",
    });
    expect(sop.referenceMaterials[1]).toEqual({ title: "Draft" });
    expect(sop.referenceMaterials[1]).not.toHaveProperty("fileUrl");
  });

  it("handles non-object input gracefully", () => {
    const sop = normalizeSOP(null);
    expect(sop.title).toBe("Untitled");

    const sop2 = normalizeSOP(42);
    expect(sop2.title).toBe("Untitled");

    const sop3 = normalizeSOP("hello");
    expect(sop3.title).toBe("Untitled");
  });
});

describe("normalizeSOPs", () => {
  it("returns empty array for non-array input", () => {
    expect(normalizeSOPs(null)).toEqual([]);
    expect(normalizeSOPs(undefined)).toEqual([]);
    expect(normalizeSOPs("not an array")).toEqual([]);
    expect(normalizeSOPs({})).toEqual([]);
  });

  it("normalizes an array of partial objects", () => {
    const result = normalizeSOPs([
      { id: "1", title: "First" },
      { id: "2", title: "Second" },
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("1");
    expect(result[0].title).toBe("First");
    expect(result[0].steps).toEqual([]);
    expect(result[1].id).toBe("2");
    expect(result[1].title).toBe("Second");
  });
});
