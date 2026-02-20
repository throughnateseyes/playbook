import { z } from "zod";

export const stepSchema = z.object({
  text: z.string(),
  title: z.string().optional(),
  imageUrl: z.string().optional(),
  script: z.string().optional(),
});

export const edgeCaseSchema = z.object({
  title: z.string(),
  description: z.string(),
});

export const escalationSchema = z.object({
  when: z.string(),
  who: z.string(),
});

export const contactSchema = z.object({
  name: z.string(),
  role: z.string(),
  department: z.string(),
  description: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().optional(),
  teamsUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
});

export const referenceMaterialSchema = z.object({
  title: z.string(),
  caption: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  fileUrl: z.string().optional(),
});

export const sopSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()),
  lastUpdated: z.string(),
  overview: z.string(),
  steps: z.array(stepSchema),
  edgeCases: z.array(edgeCaseSchema),
  escalation: escalationSchema,
  contacts: z.array(contactSchema),
  referenceMaterials: z.array(referenceMaterialSchema),
});

export type SOPInput = z.input<typeof sopSchema>;

export function parseSOP(data: unknown) {
  return sopSchema.safeParse(data);
}

// ── Form-level validation ─────────────────────────────────
// Validates raw form input before normalization. All fields are
// strings (empty = not set) — no .url() constraints on optional URLs.

const stepFormSchema = z.object({
  title: z.string(),
  text: z.string(),
  imageUrl: z.string(),
  script: z.string(),
});

const edgeCaseFormSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const contactFormSchema = z.object({
  name: z.string(),
  role: z.string(),
  department: z.string(),
  description: z.string(),
  email: z.string(),
  phone: z.string(),
  avatarUrl: z.string(),
  teamsUrl: z.string(),
  linkedinUrl: z.string(),
});

const referenceMaterialFormSchema = z.object({
  title: z.string(),
  caption: z.string(),
  thumbnailUrl: z.string(),
  fileUrl: z.string(),
  fileName: z.string(),
  file: z.any(),
});

export const sopFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  tags: z.string(),
  overview: z.string(),
  steps: z
    .array(stepFormSchema)
    .refine((arr) => arr.some((s) => s.title.trim() || s.text.trim()), {
      message: "At least one step with content is required",
    }),
  edgeCases: z.array(edgeCaseFormSchema),
  escalationWhen: z.string(),
  escalationWho: z.string(),
  contacts: z.array(contactFormSchema),
  referenceMaterials: z.array(referenceMaterialFormSchema),
});

export type SOPFormInput = z.input<typeof sopFormSchema>;

export function parseSOPForm(data: unknown) {
  return sopFormSchema.safeParse(data);
}
