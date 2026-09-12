import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { JobAnalysisRecord } from "@/lib/job.functions";

export interface JobsState {
  analyses: JobAnalysisRecord[];
  selectedId: string | null;
  analyzing: boolean;
}

const initialState: JobsState = {
  analyses: [],
  selectedId: null,
  analyzing: false,
};

const jobsSlice = createSlice({
  name: "jobs",
  initialState,
  reducers: {
    setAnalyses(state, action: PayloadAction<JobAnalysisRecord[]>) {
      state.analyses = action.payload;
      if (!state.selectedId && action.payload[0]) state.selectedId = action.payload[0].id;
    },
    analysisStarted(state) {
      state.analyzing = true;
    },
    analysisFinished(state) {
      state.analyzing = false;
    },
    analysisAdded(state, action: PayloadAction<JobAnalysisRecord>) {
      state.analyses = [
        action.payload,
        ...state.analyses.filter((a) => a.id !== action.payload.id),
      ];
      state.selectedId = action.payload.id;
      state.analyzing = false;
    },
    selectAnalysis(state, action: PayloadAction<string>) {
      state.selectedId = action.payload;
    },
  },
});

export const { setAnalyses, analysisStarted, analysisFinished, analysisAdded, selectAnalysis } =
  jobsSlice.actions;

export default jobsSlice.reducer;
