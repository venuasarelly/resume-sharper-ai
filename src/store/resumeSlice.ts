import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { ResumeProfileRecord } from "@/lib/resume.functions";

export type ResumeStage = "idle" | "uploading" | "parsing" | "done" | "error";

interface ResumeState {
  stage: ResumeStage;
  progress: number;
  stepIndex: number;
  pendingName: string | null;
  error: string | null;
  profile: ResumeProfileRecord | null;
  allProfiles: ResumeProfileRecord[];
}

const initialState: ResumeState = {
  stage: "idle",
  progress: 0,
  stepIndex: 0,
  pendingName: null,
  error: null,
  profile: null,
  allProfiles: [],
};

const resumeSlice = createSlice({
  name: "resume",
  initialState,
  reducers: {
    uploadStarted(state, action: PayloadAction<string>) {
      state.stage = "uploading";
      state.pendingName = action.payload;
      state.progress = 10;
      state.stepIndex = 0;
      state.error = null;
    },
    parsingStarted(state) {
      state.stage = "parsing";
      state.progress = 30;
      state.stepIndex = 1;
    },
    /** Advances the fake progress ticker, capped at the last step index. */
    parseTick(state, action: PayloadAction<number>) {
      state.stepIndex = Math.min(state.stepIndex + 1, action.payload);
      state.progress = Math.min(state.progress + 15, 92);
    },
    setStepIndex(state, action: PayloadAction<number>) {
      state.stepIndex = action.payload;
    },
    uploadSucceeded(state, action: PayloadAction<ResumeProfileRecord>) {
      state.stage = "done";
      state.progress = 100;
      state.error = null;
      state.pendingName = null;
      state.profile = action.payload;
      state.allProfiles = [
        action.payload,
        ...state.allProfiles.filter((p) => p.id !== action.payload.id),
      ];
    },
    uploadFailed(state, action: PayloadAction<string>) {
      state.stage = "error";
      state.progress = 0;
      state.error = action.payload;
      state.pendingName = null;
    },
    selectProfile(state, action: PayloadAction<ResumeProfileRecord>) {
      state.profile = action.payload;
      state.stage = "done";
      state.progress = 100;
      state.error = null;
    },
    setAllProfiles(state, action: PayloadAction<ResumeProfileRecord[]>) {
      state.allProfiles = action.payload;
      if (!state.profile && action.payload[0]) {
        state.profile = action.payload[0];
        state.stage = "done";
        state.progress = 100;
      }
    },
  },
});

export const {
  uploadStarted,
  parsingStarted,
  parseTick,
  setStepIndex,
  uploadSucceeded,
  uploadFailed,
  selectProfile,
  setAllProfiles,
} = resumeSlice.actions;

export default resumeSlice.reducer;
