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
