/**
 * Mock data layer for ApplyAI.
 *
 * Everything here is intentionally isolated so real APIs (Lovable Cloud
 * database, resume parsing service, Workday autofill service) can replace
 * these functions later without touching UI components.
 */

export type ApplicationStatus = "submitted" | "in_review" | "interview" | "rejected" | "draft";

export interface Application {
  id: string;
  company: string;
  role: string;
  location: string;
  appliedAt: string;
  matchScore: number;
  status: ApplicationStatus;
  source: string;
}

export interface AnalyzedJob {
  id: string;
  company: string;
  role: string;
  url: string;
  matchScore: number;
  analyzedAt: string;
  matchedSkills: string[];
  missingSkills: string[];
  summary: string;
}

export interface ResumeExperience {
  company: string;
  role: string;
  period: string;
  highlights: string[];
}

export interface ResumeProfile {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  headline: string;
  summary: string;
  skills: string[];
  experience: ResumeExperience[];
  education: { school: string; degree: string; period: string }[];
  completion: number;
  fileName: string;
  updatedAt: string;
}

export interface DashboardStats {
  resumeCompletion: number;
  applications: number;
  jobsAnalyzed: number;
  averageMatchScore: number;
}

export interface AutofillField {
  id: string;
  label: string;
  value: string;
  confidence: number;
  section: string;
}

export const resumeProfile: ResumeProfile = {
  fullName: "Aarav Mehta",
  email: "aarav.mehta@example.com",
  phone: "+1 (415) 555-0134",
  location: "San Francisco, CA",
  headline: "Senior Frontend Engineer",
  summary:
    "Frontend engineer with 7 years of experience building accessible, high-performance product interfaces for B2B SaaS. Led design system work used by 40+ engineers.",
  skills: [
    "React",
    "TypeScript",
    "Next.js",
    "Tailwind CSS",
    "Node.js",
    "GraphQL",
    "Testing Library",
    "Design Systems",
    "Accessibility",
  ],
  experience: [
    {
      company: "Northwind Labs",
      role: "Senior Frontend Engineer",
      period: "2022 — Present",
      highlights: [
        "Rebuilt the analytics workspace, cutting time-to-interactive by 46%.",
        "Owned the component library adopted across five product teams.",
      ],
    },
    {
      company: "Brightpath",
      role: "Frontend Engineer",
      period: "2019 — 2022",
      highlights: [
        "Shipped the customer onboarding flow used by 120k accounts.",
        "Introduced end-to-end test coverage for critical checkout paths.",
      ],
    },
  ],
  education: [
    { school: "University of Illinois", degree: "B.S. Computer Science", period: "2015 — 2019" },
  ],
  completion: 86,
  fileName: "aarav-mehta-resume.pdf",
  updatedAt: "2 days ago",
};

export const dashboardStats: DashboardStats = {
  resumeCompletion: resumeProfile.completion,
  applications: 24,
  jobsAnalyzed: 41,
  averageMatchScore: 78,
};

export const applications: Application[] = [
  {
    id: "app_1",
    company: "Stripe",
    role: "Senior Frontend Engineer",
    location: "Remote — US",
    appliedAt: "Today",
    matchScore: 91,
    status: "submitted",
    source: "Workday",
  },
  {
    id: "app_2",
    company: "Atlassian",
    role: "Product Engineer, Growth",
    location: "Austin, TX",
    appliedAt: "Yesterday",
    matchScore: 84,
    status: "in_review",
    source: "Workday",
  },
  {
    id: "app_3",
    company: "Salesforce",
    role: "Lead UI Engineer",
    location: "San Francisco, CA",
    appliedAt: "3 days ago",
    matchScore: 76,
    status: "interview",
    source: "Workday",
  },
  {
    id: "app_4",
    company: "Workday",
    role: "Senior Software Engineer",
    location: "Pleasanton, CA",
    appliedAt: "6 days ago",
    matchScore: 69,
    status: "rejected",
    source: "Workday",
  },
  {
    id: "app_5",
    company: "Figma",
    role: "Frontend Engineer, Editor",
    location: "New York, NY",
    appliedAt: "Draft",
    matchScore: 88,
    status: "draft",
    source: "Workday",
  },
];

export const analyzedJobs: AnalyzedJob[] = [
  {
    id: "job_1",
    company: "Stripe",
    role: "Senior Frontend Engineer",
    url: "https://stripe.wd1.myworkdayjobs.com/careers/job/senior-frontend",
    matchScore: 91,
    analyzedAt: "Today",
    matchedSkills: ["React", "TypeScript", "Design Systems", "Accessibility"],
    missingSkills: ["Ruby"],
    summary:
      "Strong alignment with your design system and performance work. Emphasise the analytics workspace rebuild in your cover note.",
  },
  {
    id: "job_2",
    company: "Atlassian",
    role: "Product Engineer, Growth",
    url: "https://atlassian.wd1.myworkdayjobs.com/careers/job/product-engineer",
    matchScore: 84,
    analyzedAt: "Yesterday",
    matchedSkills: ["React", "GraphQL", "Node.js"],
    missingSkills: ["Experimentation platforms", "Kotlin"],
    summary:
      "Growth-focused role. Highlight onboarding funnel work and any A/B testing exposure.",
  },
  {
    id: "job_3",
    company: "Figma",
    role: "Frontend Engineer, Editor",
    url: "https://figma.wd5.myworkdayjobs.com/careers/job/frontend-editor",
    matchScore: 88,
    analyzedAt: "4 days ago",
    matchedSkills: ["TypeScript", "React", "Performance"],
    missingSkills: ["WebGL"],
    summary: "Editor team values rendering performance. Lead with the 46% TTI improvement.",
  },
];

export const autofillFields: AutofillField[] = [
  { id: "f1", label: "First name", value: "Aarav", confidence: 99, section: "Personal" },
  { id: "f2", label: "Last name", value: "Mehta", confidence: 99, section: "Personal" },
  { id: "f3", label: "Email", value: "aarav.mehta@example.com", confidence: 98, section: "Personal" },
  { id: "f4", label: "Phone", value: "+1 (415) 555-0134", confidence: 96, section: "Personal" },
  { id: "f5", label: "Current company", value: "Northwind Labs", confidence: 94, section: "Experience" },
  { id: "f6", label: "Current title", value: "Senior Frontend Engineer", confidence: 95, section: "Experience" },
  { id: "f7", label: "Years of experience", value: "7", confidence: 88, section: "Experience" },
  { id: "f8", label: "Degree", value: "B.S. Computer Science", confidence: 92, section: "Education" },
  { id: "f9", label: "School", value: "University of Illinois", confidence: 93, section: "Education" },
  { id: "f10", label: "Work authorisation", value: "Authorised to work in the US", confidence: 80, section: "Eligibility" },
  { id: "f11", label: "Requires sponsorship", value: "No", confidence: 85, section: "Eligibility" },
];

export const statusLabels: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  in_review: "In review",
  interview: "Interview",
  rejected: "Rejected",
  draft: "Draft",
};
