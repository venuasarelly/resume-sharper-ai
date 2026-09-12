import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface SettingsState {
  autoAutofill: boolean;
  saveDraftApplications: boolean;
  emailNotifications: boolean;
  weeklyDigest: boolean;
  includePortfolio: boolean;
  defaultTone: "professional" | "friendly" | "concise";
  theme: "system" | "light" | "dark";
  defaultResume: string;
}

export type BooleanSettingKey = {
  [K in keyof SettingsState]: SettingsState[K] extends boolean ? K : never;
}[keyof SettingsState];

const initialState: SettingsState = {
  autoAutofill: true,
  saveDraftApplications: true,
  emailNotifications: false,
  weeklyDigest: true,
  includePortfolio: true,
  defaultTone: "professional",
  theme: "system",
  defaultResume: "master-resume",
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    toggleSetting(state, action: PayloadAction<BooleanSettingKey>) {
      const key = action.payload;
      state[key] = !state[key];
    },
    setPreference(state, action: PayloadAction<Partial<SettingsState>>) {
      Object.assign(state, action.payload);
    },
    resetSettings() {
      return initialState;
    },
  },
});

export const { toggleSetting, setPreference, resetSettings } = settingsSlice.actions;

export default settingsSlice.reducer;
