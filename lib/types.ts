export type ProjectStatus = "talk" | "develop" | "sample" | "deliver";

export type FactStatus = "confirmed" | "pending" | "dramatized";

export type NarrationKind = "draft" | "dramatized" | "from-facts";

export type ChecklistGroup = "rights" | "review" | "delivery";

export type AmountFrom = "unset" | "local" | "env";

export interface ChecklistItem {
  id: string;
  group: ChecklistGroup;
  label: string;
  done: boolean;
}

export interface Material {
  id: string;
  text: string;
}

export interface Fact {
  id: string;
  text: string;
  status: FactStatus;
  source: string;
}

export interface Shot {
  id: string;
  title: string;
  durationSec: number;
  picture: string;
  narration: string;
  narrationKind: NarrationKind;
  factIds: string[];
  onScreenText: string;
}

export interface QuoteDraft {
  tierId: string;
  quantity: number;
  addonIds: string[];
  preparedFor: string;
  validDays: number;
  note: string;
}

export interface Project {
  id: string;
  workingTitle: string;
  clientName: string;
  subject: string;
  known: string;
  toVerify: string;
  intendedUse: string;
  materials: Material[];
  internalNote: string;
  status: ProjectStatus;
  sampleInDevelopment: boolean;
  checklist: ChecklistItem[];
  facts: Fact[];
  shots: Shot[];
  quote: QuoteDraft;
  createdAt: string;
  updatedAt: string;
}

export interface StoreFile {
  version: 1;
  projects: Project[];
}

export interface PricingTier {
  id: string;
  name: string;
  summary: string;
  unit: string;
  amount: number | null;
  amountFrom: AmountFrom;
}

export interface PricingAddon {
  id: string;
  name: string;
  summary: string;
  amount: number | null;
  amountFrom: AmountFrom;
}

export interface Pricing {
  currency: "CNY";
  defaultValidDays: number;
  notes: string[];
  tiers: PricingTier[];
  addons: PricingAddon[];
  warnings: string[];
}
