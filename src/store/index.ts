import { configureStore } from "@reduxjs/toolkit";
import applicationsReducer from "./applicationsSlice";
import settingsReducer from "./settingsSlice";
import resumeReducer from "./resumeSlice";

export const store = configureStore({
  reducer: {
    applications: applicationsReducer,
    settings: settingsReducer,
    resume: resumeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
