import { describe, it, expect } from "vitest";
import { parseSOP, sopSchema } from "../sopSchema";

const validSOP = {
  id: "sop-1",
  title: "Test SOP",
  category: "Operations",
  tags: ["tag1", "tag2"],
  lastUpdated: "2025-01-15",
  overview: "This is a test SOP",
  steps: [{ text: "Do the thing" }],
  edgeCases: [{ title: "Edge", description: "Case description" }],
  escalation: { when: "Something breaks", who: "Jane Doe" },
  contacts: [{ name: "John", role: "Lead", department: "Eng" }],
  referenceMaterials: [{ title: "Doc" }],
};

describe("parseSOP", () => {
  it("accepts a valid full SOP", () => {
    const result = parseSOP(validSOP);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Test SOP");
      expect(result.data.steps).toHaveLength(1);
    }
  });

  it("rejects missing required title", () => {
    const result = parseSOP({ ...validSOP, title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing required category", () => {
    const result = parseSOP({ ...validSOP, category: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a step missing text", () => {
    const result = parseSOP({ ...validSOP, steps: [{ script: "echo hi" }] });
    expect(result.success).toBe(false);
  });

  it("accepts steps with optional fields omitted", () => {
    const result = parseSOP({
      ...validSOP,
      steps: [{ text: "Basic step" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts steps with all optional fields present", () => {
    const result = parseSOP({
      ...validSOP,
      steps: [{ text: "Full step", title: "Step 1", imageUrl: "/img.png", script: "echo ok" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts contacts with optional fields omitted", () => {
    const result = parseSOP({
      ...validSOP,
      contacts: [{ name: "Alice", role: "Eng", department: "IT" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts contacts with all optional fields", () => {
    const result = parseSOP({
      ...validSOP,
      contacts: [{
        name: "Bob",
        role: "VP",
        department: "Sales",
        description: "Key contact",
        avatarUrl: "https://example.com/bob.jpg",
        teamsUrl: "https://teams.example.com/bob",
        linkedinUrl: "https://linkedin.com/bob",
      }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts reference materials without fileUrl", () => {
    const result = parseSOP({
      ...validSOP,
      referenceMaterials: [{ title: "Draft doc" }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts reference materials with fileUrl", () => {
    const result = parseSOP({
      ...validSOP,
      referenceMaterials: [{ title: "Guide", fileUrl: "/guide.pdf" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects escalation missing who", () => {
    const result = parseSOP({
      ...validSOP,
      escalation: { when: "Failure" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects escalation missing when", () => {
    const result = parseSOP({
      ...validSOP,
      escalation: { who: "Someone" },
    });
    expect(result.success).toBe(false);
  });

  it("handles completely missing data", () => {
    const result = parseSOP(undefined);
    expect(result.success).toBe(false);
  });

  it("strips extra fields via parse()", () => {
    const data = { ...validSOP, extraField: "should be stripped" };
    const result = sopSchema.parse(data);
    expect(result).not.toHaveProperty("extraField");
  });
});
