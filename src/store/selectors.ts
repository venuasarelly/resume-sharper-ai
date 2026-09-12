import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "./index";
import type { AutofillField } from "./applicationsSlice";

/** Rough years-of-experience estimate from the parsed experience entries. */
function estimateYears(periods: string[]): string {
  const years = periods
    .flatMap((period) => period.match(/\d{4}/g) ?? [])
    .map(Number)
    .filter((n) => n > 1950);
  if (years.length === 0) return "";
  const earliest = Math.min(...years);
  const current = new Date().getFullYear();
  return String(Math.max(1, current - earliest));
}

// Builds the base autofill field set from the parsed resume profile in state.
export const selectAutofillFromResume = createSelector(
  [(state: RootState) => state.resume.profile],
  (profile): AutofillField[] => {
    if (!profile) return [];
    const latestRole = profile.experience[0];
    return [
      { id: "fullName", label: "Full name", value: profile.fullName ?? "", source: "resume" },
      { id: "email", label: "Email", value: profile.email ?? "", source: "resume" },
      { id: "phone", label: "Phone", value: profile.phone ?? "", source: "resume" },
      { id: "location", label: "Location", value: profile.location ?? "", source: "resume" },
      { id: "headline", label: "Headline", value: profile.headline ?? "", source: "resume" },
      {
        id: "yearsExperience",
        label: "Years of experience",
        value: estimateYears(profile.experience.map((e) => e.period)),
        source: "resume",
      },
      {
        id: "currentRole",
        label: "Most recent role",
        value: latestRole ? `${latestRole.role} @ ${latestRole.company}` : "",
        source: "resume",
      },
      { id: "skills", label: "Key skills", value: profile.skills.join(", "), source: "resume" },
      {
        id: "education",
        label: "Education",
        value: profile.education.map((e) => `${e.degree}, ${e.school}`).join("; "),
        source: "resume",
      },
      {
        id: "linkedin",
        label: "LinkedIn URL",
        value: profile.linkedinUrl ?? "",
        source: "resume",
      },
      {
        id: "portfolio",
        label: "Portfolio URL",
        value: profile.portfolioUrl ?? "",
        source: "resume",
      },
      { id: "summary", label: "Professional summary", value: profile.summary ?? "", source: "resume" },
    ];
  },
);

export const selectFilteredApplications = createSelector(
  [(state: RootState) => state.applications.items, (state: RootState) => state.applications.search],
  (items, search) => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (application) =>
        application.company.toLowerCase().includes(query) ||
        application.role.toLowerCase().includes(query) ||
        application.status.includes(query),
    );
  },
);

export const selectResumeCompletion = createSelector(
  [(state: RootState) => state.resume.profile],
  (profile) => {
    if (!profile) return 0;
    const checks = [
      Boolean(profile.fullName),
      Boolean(profile.email),
      Boolean(profile.phone),
      Boolean(profile.location),
      Boolean(profile.headline),
      Boolean(profile.summary),
      profile.skills.length > 0,
      profile.experience.length > 0,
      profile.education.length > 0,
      Boolean(profile.linkedinUrl ?? profile.portfolioUrl ?? profile.githubUrl),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  },
);
