import { configureStore } from "@reduxjs/toolkit";

import applicationsReducer from "./applicationsSlice";
import jobsReducer from "./jobsSlice";
import resumeReducer from "./resumeSlice";
import settingsReducer from "./settingsSlice";

export const makeStore = () =>
  configureStore({
    reducer: {
      applications: applicationsReducer,
      jobs: jobsReducer,
      resume: resumeReducer,
      settings: settingsReducer,
    },
  });

/** Shared store instance (used outside React, e.g. tests or utilities). */
export const store = makeStore();

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
