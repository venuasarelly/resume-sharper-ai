import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const fieldSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
});

const inputSchema = z.object({
  target: z.object({
    company: z.string().min(1, "Company is required"),
    role: z.string().min(1, "Role is required"),
    jobUrl: z.string().optional().default(""),
  }),
  fields: z.array(fieldSchema),
  skills: z.array(z.string()).default([]),
});

// Maps resume-derived fields onto a target job application and scores the match.
export const mapFieldsFn = createServerFn({ method: "POST" })
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { target, fields, skills } = data;

    // Score overlap between role keywords and resume skills.
    const roleWords = target.role
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((word) => word.length > 2);
    const normalizedSkills = skills.map((skill) => skill.toLowerCase());
    const hits = roleWords.filter((word) =>
      normalizedSkills.some((skill) => skill.includes(word)),
    ).length;
    const matchScore = Math.min(97, 62 + hits * 9 + (target.company.length % 7));

    const mapped = fields.map((field) => {
      if (field.id === "headline" || field.id === "summary") {
        return {
          ...field,
          value: `${field.value} Excited to apply for the ${target.role} role at ${target.company}.`,
          source: "generated" as const,
        };
      }
      return { ...field, source: "resume" as const };
    });

    mapped.push(
      {
        id: "targetRole",
        label: "Role applied for",
        value: target.role,
        source: "generated",
      },
      {
        id: "targetCompany",
        label: "Company",
        value: target.company,
        source: "generated",
      },
    );

    return { fields: mapped, matchScore };
  });
