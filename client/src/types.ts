export interface PRDFormData {
  appName: string;
  tagline: string;
  problem: string;
  audience: string[];
  audienceOther: string;
  platform: string;
  features: string[];
  featuresOther: string;
  mustHave: string;
  niceToHave: string;
  userRoles: string;
  rolesDescription: string;
  notes: string;
}

export interface SubmissionSummary {
  id: number;
  createdAt: string;
  appName: string;
  tagline: string;
  platform: string;
  processed: boolean;
}

export interface SubmissionDetail extends PRDFormData {
  id: number;
  createdAt: string;
}

export interface ProcessData {
  role: string;
  roleOther: string;
  goalScope: string;
  goalDetails: string;
  contextFlags: string[];
  contextOther: string;
  expectationFlags: string[];
  expectationOther: string;
}

export const initialProcessData: ProcessData = {
  role: "",
  roleOther: "",
  goalScope: "",
  goalDetails: "",
  contextFlags: [],
  contextOther: "",
  expectationFlags: [],
  expectationOther: "",
};

export const initialFormData: PRDFormData = {
  appName: "",
  tagline: "",
  problem: "",
  audience: [],
  audienceOther: "",
  platform: "",
  features: [],
  featuresOther: "",
  mustHave: "",
  niceToHave: "",
  userRoles: "",
  rolesDescription: "",
  notes: "",
};
