import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "./index";
import type { AutofillField } from "./applicationsSlice";

// Builds the base autofill field set from the resume profile in state.
export const selectAutofillFromResume = createSelector(
  [(state: RootState) => state.resume.profile],
  (profile): AutofillField[] => {
    const latestRole = profile.experience[0];
    return [
      { id: "fullName", label: "Full name", value: profile.fullName, source: "resume" },
      { id: "email", label: "Email", value: profile.email, source: "resume" },
      { id: "phone", label: "Phone", value: profile.phone, source: "resume" },
      { id: "location", label: "Location", value: profile.location, source: "resume" },
      { id: "headline", label: "Headline", value: profile.headline, source: "resume" },
      {
        id: "yearsExperience",
        label: "Years of experience",
        value: String(profile.yearsOfExperience),
        source: "resume",
      },
      {
        id: "currentRole",
        label: "Most recent role",
        value: latestRole ? `${latestRole.title} @ ${latestRole.company}` : "",
        source: "resume",
      },
      { id: "skills", label: "Key skills", value: profile.skills.join(", "), source: "resume" },
      { id: "education", label: "Education", value: profile.education, source: "resume" },
      { id: "linkedin", label: "LinkedIn URL", value: profile.links.linkedin, source: "resume" },
      { id: "portfolio", label: "Portfolio URL", value: profile.links.portfolio, source: "resume" },
      { id: "summary", label: "Professional summary", value: profile.summary, source: "resume" },
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
