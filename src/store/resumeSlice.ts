import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface ResumeExperience {
  title: string;
  company: string;
  period: string;
}

export interface ResumeProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  summary: string;
  yearsOfExperience: number;
  skills: string[];
  experience: ResumeExperience[];
  education: string;
  links: {
    linkedin: string;
    portfolio: string;
    github: string;
  };
}

interface ResumeState {
  profile: ResumeProfile;
}

// Sample resume data so autofill works out of the box — replace with the real profile.
const initialState: ResumeState = {
  profile: {
    fullName: "Asha Verma",
    email: "asha.verma@example.com",
    phone: "+91 90000 12345",
    location: "Kolkata, India",
    headline: "Frontend engineer focused on React and design systems",
    summary:
      "Frontend engineer with 6 years of experience shipping React and TypeScript products, building accessible design systems, and improving web performance.",
    yearsOfExperience: 6,
    skills: ["React", "TypeScript", "JavaScript", "CSS", "Node.js", "GraphQL", "Testing", "Accessibility"],
    experience: [
      { title: "Senior Frontend Engineer", company: "Techspire", period: "2023 — Present" },
      { title: "Frontend Engineer", company: "Craftbase", period: "2020 — 2023" },
    ],
    education: "B.Tech, Computer Science — 2020",
    links: {
      linkedin: "https://linkedin.com/in/ashaverma",
      portfolio: "https://ashaverma.dev",
      github: "https://github.com/ashaverma",
    },
  },
};

const resumeSlice = createSlice({
  name: "resume",
  initialState,
  reducers: {
    updateProfile(state, action: PayloadAction<Partial<ResumeProfile>>) {
      Object.assign(state.profile, action.payload);
    },
  },
});

export const { updateProfile } = resumeSlice.actions;

export default resumeSlice.reducer;
