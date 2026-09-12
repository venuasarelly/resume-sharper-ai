import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type ApplicationStatus = "applied" | "interviewing" | "offer" | "rejected";

export interface Application {
  id: string;
  company: string;
  role: string;
  appliedAt: string; // ISO date string
  status: ApplicationStatus;
  matchScore: number; // 0–100
}

export interface AutofillField {
  id: string;
  label: string;
  value: string;
  source: "resume" | "generated" | "manual";
}

export interface ApplicationTarget {
  company: string;
  role: string;
  jobUrl: string;
}

export type AutofillStatus = "idle" | "running" | "done";

interface ApplicationsState {
  items: Application[];
  search: string;
  target: ApplicationTarget;
  autofill: {
    status: AutofillStatus;
    fields: AutofillField[];
  };
  lastMatchScore: number | null;
}

const initialState: ApplicationsState = {
  items: [
    {
      id: "app-1",
      company: "Northwind Labs",
      role: "Frontend Engineer",
      appliedAt: "2026-09-02",
      status: "interviewing",
      matchScore: 88,
    },
    {
      id: "app-2",
      company: "Bluepeak Systems",
      role: "React Developer",
      appliedAt: "2026-08-27",
      status: "applied",
      matchScore: 81,
    },
    {
      id: "app-3",
      company: "Ferrostack",
      role: "Full-Stack Engineer",
      appliedAt: "2026-08-19",
      status: "offer",
      matchScore: 93,
    },
    {
      id: "app-4",
      company: "Lumen Analytics",
      role: "UI Engineer",
      appliedAt: "2026-08-11",
      status: "rejected",
      matchScore: 64,
    },
  ],
  search: "",
  target: { company: "", role: "", jobUrl: "" },
  autofill: { status: "idle", fields: [] },
  lastMatchScore: null,
};

const applicationsSlice = createSlice({
  name: "applications",
  initialState,
  reducers: {
    setTarget(state, action: PayloadAction<ApplicationTarget>) {
      state.target = action.payload;
    },
    setSearch(state, action: PayloadAction<string>) {
      state.search = action.payload;
    },
    autofillStarted(state) {
      state.autofill.status = "running";
      state.autofill.fields = [];
      state.lastMatchScore = null;
    },
    autofillCompleted(
      state,
      action: PayloadAction<{ fields: AutofillField[]; matchScore: number }>,
    ) {
      state.autofill.status = "done";
      state.autofill.fields = action.payload.fields;
      state.lastMatchScore = action.payload.matchScore;
    },
    updateField(state, action: PayloadAction<{ id: string; value: string }>) {
      const field = state.autofill.fields.find((f) => f.id === action.payload.id);
      if (field) {
        field.value = action.payload.value;
        field.source = "manual";
      }
    },
    addApplication(state, action: PayloadAction<Application>) {
      state.items.unshift(action.payload);
    },
  },
});

export const {
  setTarget,
  setSearch,
  autofillStarted,
  autofillCompleted,
  updateField,
  addApplication,
} = applicationsSlice.actions;

export default applicationsSlice.reducer;
