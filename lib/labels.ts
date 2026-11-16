import type {
  ChecklistGroup,
  FactStatus,
  NarrationKind,
  ProjectStatus,
} from "@/lib/types";

export const PROJECT_STATUSES: ProjectStatus[] = [
  "talk",
  "develop",
  "sample",
  "deliver",
];

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  talk: "接谈",
  develop: "开发",
  sample: "样片",
  deliver: "交付",
};

export const FACT_STATUSES: FactStatus[] = [
  "confirmed",
  "pending",
  "dramatized",
];

export const FACT_LABEL: Record<FactStatus, string> = {
  confirmed: "已确认",
  pending: "待核",
  dramatized: "演绎",
};

export const NARRATION_KINDS: NarrationKind[] = [
  "draft",
  "dramatized",
  "from-facts",
];

export const NARRATION_LABEL: Record<NarrationKind, string> = {
  draft: "草稿",
  dramatized: "演绎 · 非事实",
  "from-facts": "依据事实",
};

export const CHECKLIST_GROUPS: { id: ChecklistGroup; label: string }[] = [
  { id: "rights", label: "权利" },
  { id: "review", label: "审片" },
  { id: "delivery", label: "交付" },
];

export const TEAM = [
  { name: "李波", role: "选题 / 剧本 / 审美" },
  { name: "丁雷", role: "客户与回款" },
  { name: "熊健新", role: "播出渠道对接" },
] as const;

export const PRODUCTION_NOTE = "制作外包";

export const USE_SUGGESTIONS = [
  "内部讨论",
  "客户提案",
  "样片",
  "播出",
  "活动放映",
];
