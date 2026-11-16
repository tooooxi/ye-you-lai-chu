import { defaultChecklist, emptyQuote } from "@/lib/defaults";
import {
  CHECKLIST_GROUPS,
  FACT_STATUSES,
  NARRATION_KINDS,
  PROJECT_STATUSES,
} from "@/lib/labels";
import type {
  ChecklistGroup,
  ChecklistItem,
  Fact,
  FactStatus,
  Material,
  NarrationKind,
  Project,
  ProjectStatus,
  QuoteDraft,
  Shot,
} from "@/lib/types";

export class UserInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserInputError";
  }
}

const ID_RE = /^[A-Za-z0-9_-]{1,80}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, label: string, max: number, allowEmpty = true): string {
  if (typeof value !== "string") throw new UserInputError(`${label}需要是文字。`);
  if (value.length > max) throw new UserInputError(`${label}太长了。`);
  if (!allowEmpty && value.trim() === "") throw new UserInputError(`${label}不能为空。`);
  return value;
}

function idOf(value: unknown, label: string): string {
  if (typeof value !== "string" || !ID_RE.test(value)) {
    throw new UserInputError(`${label}的编号无效。`);
  }
  return value;
}

function unique(ids: string[], label: string) {
  if (new Set(ids).size !== ids.length) throw new UserInputError(`${label}有重复编号。`);
}

function intIn(value: unknown, label: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    throw new UserInputError(`${label}需要是 ${min} 到 ${max} 的整数。`);
  }
  return value;
}

export function parseStatus(value: unknown): ProjectStatus {
  if (typeof value !== "string" || !PROJECT_STATUSES.includes(value as ProjectStatus)) {
    throw new UserInputError("阶段只能是接谈、开发、样片或交付。");
  }
  return value as ProjectStatus;
}

export function parseMaterials(value: unknown): Material[] {
  if (!Array.isArray(value)) throw new UserInputError("手头材料格式不对。");
  if (value.length > 50) throw new UserInputError("材料条数太多了。");
  const materials = value.map((item) => {
    if (!isRecord(item)) throw new UserInputError("有一条材料格式不对。");
    return {
      id: idOf(item.id, "材料"),
      text: text(item.text, "材料", 200),
    };
  });
  unique(materials.map((item) => item.id), "材料");
  return materials;
}

export function parseChecklist(value: unknown): ChecklistItem[] {
  if (!Array.isArray(value)) throw new UserInputError("清单格式不对。");
  if (value.length > 40) throw new UserInputError("清单太长了。");
  const groups = new Set(CHECKLIST_GROUPS.map((group) => group.id));
  const items = value.map((item) => {
    if (!isRecord(item)) throw new UserInputError("有一条清单格式不对。");
    if (typeof item.group !== "string" || !groups.has(item.group as ChecklistGroup)) {
      throw new UserInputError("清单分组只能是权利、审片或交付。");
    }
    if (typeof item.done !== "boolean") throw new UserInputError("清单勾选格式不对。");
    return {
      id: idOf(item.id, "清单"),
      group: item.group as ChecklistGroup,
      label: text(item.label, "清单条目", 120, false),
      done: item.done,
    };
  });
  unique(items.map((item) => item.id), "清单");
  return items;
}

export function parseFact(value: unknown): Fact {
  if (!isRecord(value)) throw new UserInputError("有一条事实格式不对。");
  if (typeof value.status !== "string" || !FACT_STATUSES.includes(value.status as FactStatus)) {
    throw new UserInputError("事实状态只能是已确认、待核或演绎。");
  }
  const fact: Fact = {
    id: idOf(value.id, "事实"),
    text: text(value.text, "事实", 2000),
    status: value.status as FactStatus,
    source: text(value.source ?? "", "来源", 300),
  };
  if (fact.status === "confirmed" && fact.source.trim() === "") {
    throw new UserInputError("已确认的事实需要来源。没有来源时请改成待核。");
  }
  return fact;
}

export function parseFacts(value: unknown): Fact[] {
  if (!Array.isArray(value)) throw new UserInputError("事实板格式不对。");
  if (value.length > 200) throw new UserInputError("事实太多了。");
  const facts = value.map(parseFact);
  unique(facts.map((fact) => fact.id), "事实");
  return facts;
}

export function parseShot(value: unknown): Shot {
  if (!isRecord(value)) throw new UserInputError("有一条分镜格式不对。");
  if (
    typeof value.narrationKind !== "string" ||
    !NARRATION_KINDS.includes(value.narrationKind as NarrationKind)
  ) {
    throw new UserInputError("旁白类型无效。");
  }
  if (!Array.isArray(value.factIds)) throw new UserInputError("引用的事实格式不对。");
  if (value.factIds.length > 30) throw new UserInputError("单镜引用的事实太多了。");
  const factIds = value.factIds.map((id) => {
    if (typeof id !== "string" || !ID_RE.test(id)) throw new UserInputError("引用的事实编号无效。");
    return id;
  });
  unique(factIds, "引用的事实");
  const narration = text(value.narration, "旁白", 2000);
  const kind = value.narrationKind as NarrationKind;
  if (kind === "from-facts" && narration.trim() !== "" && factIds.length === 0) {
    throw new UserInputError("标成「依据事实」的旁白，需要至少勾选一条事实。");
  }
  return {
    id: idOf(value.id, "分镜"),
    title: text(value.title ?? "", "分镜标题", 40),
    durationSec: intIn(value.durationSec, "单镜时长（秒）", 0, 600),
    picture: text(value.picture, "画面", 2000),
    narration,
    narrationKind: kind,
    factIds,
    onScreenText: text(value.onScreenText ?? "", "上屏文字", 200),
  };
}

export function parseShots(value: unknown): Shot[] {
  if (!Array.isArray(value)) throw new UserInputError("分镜格式不对。");
  if (value.length > 80) throw new UserInputError("分镜太多了。");
  const shots = value.map(parseShot);
  unique(shots.map((shot) => shot.id), "分镜");
  return shots;
}

export function parseQuote(value: unknown): QuoteDraft {
  if (!isRecord(value)) throw new UserInputError("报价格式不对。");
  const tierId = text(value.tierId, "档位", 40, false);
  if (!ID_RE.test(tierId)) throw new UserInputError("档位编号无效。");
  if (!Array.isArray(value.addonIds)) throw new UserInputError("附加项格式不对。");
  if (value.addonIds.length > 20) throw new UserInputError("附加项太多了。");
  const addonIds = value.addonIds.map((id) => {
    if (typeof id !== "string" || !ID_RE.test(id)) throw new UserInputError("附加项编号无效。");
    return id;
  });
  unique(addonIds, "附加项");
  return {
    tierId,
    quantity: intIn(value.quantity, "数量", 1, 99),
    addonIds,
    preparedFor: text(value.preparedFor ?? "", "报价对象", 80),
    validDays: intIn(value.validDays, "有效天数", 1, 365),
    note: text(value.note ?? "", "报价备注", 2000),
  };
}

export interface CreateInput {
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
}

export function parseCreate(input: unknown): CreateInput {
  if (!isRecord(input)) throw new UserInputError("立项内容格式不对。");
  const clientName = text(input.clientName ?? "", "公司或人物", 80);
  return {
    workingTitle: text(input.workingTitle, "工作标题", 80, false),
    clientName,
    subject: text(input.subject ?? "", "故事对象", 80),
    known: text(input.known ?? "", "已知", 8000),
    toVerify: text(input.toVerify ?? "", "待核", 8000),
    intendedUse: text(input.intendedUse ?? "", "成片用途", 120),
    materials: input.materials === undefined ? [] : parseMaterials(input.materials),
    internalNote: text(input.internalNote ?? "", "内部备注", 8000),
    status: input.status === undefined ? "talk" : parseStatus(input.status),
    sampleInDevelopment: input.sampleInDevelopment === undefined ? false : bool(input.sampleInDevelopment),
    checklist: input.checklist === undefined ? defaultChecklist() : parseChecklist(input.checklist),
    facts: input.facts === undefined ? [] : parseFacts(input.facts),
    shots: input.shots === undefined ? [] : parseShots(input.shots),
    quote: input.quote === undefined ? emptyQuote(clientName) : parseQuote(input.quote),
  };
}

function bool(value: unknown): boolean {
  if (typeof value !== "boolean") throw new UserInputError("样片标记格式不对。");
  return value;
}

export function parsePatch(input: unknown): Partial<CreateInput> {
  if (!isRecord(input)) throw new UserInputError("保存内容格式不对。");
  const patch: Partial<CreateInput> = {};
  if ("workingTitle" in input) patch.workingTitle = text(input.workingTitle, "工作标题", 80, false);
  if ("clientName" in input) patch.clientName = text(input.clientName, "公司或人物", 80);
  if ("subject" in input) patch.subject = text(input.subject, "故事对象", 80);
  if ("known" in input) patch.known = text(input.known, "已知", 8000);
  if ("toVerify" in input) patch.toVerify = text(input.toVerify, "待核", 8000);
  if ("intendedUse" in input) patch.intendedUse = text(input.intendedUse, "成片用途", 120);
  if ("materials" in input) patch.materials = parseMaterials(input.materials);
  if ("internalNote" in input) patch.internalNote = text(input.internalNote, "内部备注", 8000);
  if ("status" in input) patch.status = parseStatus(input.status);
  if ("sampleInDevelopment" in input) patch.sampleInDevelopment = bool(input.sampleInDevelopment);
  if ("checklist" in input) patch.checklist = parseChecklist(input.checklist);
  if ("facts" in input) patch.facts = parseFacts(input.facts);
  if ("shots" in input) patch.shots = parseShots(input.shots);
  if ("quote" in input) patch.quote = parseQuote(input.quote);
  if (Object.keys(patch).length === 0) throw new UserInputError("没有可保存的内容。");
  return patch;
}

function clip(value: unknown, max: number, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  return value.slice(0, max);
}

function keepId(value: unknown): string | null {
  if (typeof value !== "string" || !ID_RE.test(value)) return null;
  return value;
}

/**
 * Read path. Unknown fact status becomes 待核, never 已确认.
 * A confirmed fact with no source is downgraded to 待核.
 */
export function coerceProject(raw: unknown): Project | null {
  if (!isRecord(raw)) return null;
  const id = keepId(raw.id);
  if (!id) return null;
  const status = PROJECT_STATUSES.includes(raw.status as ProjectStatus)
    ? (raw.status as ProjectStatus)
    : "talk";
  const facts = Array.isArray(raw.facts) ? raw.facts.map(coerceFact).filter((fact): fact is Fact => fact !== null) : [];
  const factIds = new Set(facts.map((fact) => fact.id));
  const shots = Array.isArray(raw.shots)
    ? raw.shots
        .map((shot) => coerceShot(shot, factIds))
        .filter((shot): shot is Shot => shot !== null)
    : [];
  const clientName = clip(raw.clientName, 80);
  const now = new Date().toISOString();
  return {
    id,
    workingTitle: clip(raw.workingTitle, 80, "未命名") || "未命名",
    clientName,
    subject: clip(raw.subject, 80),
    known: clip(raw.known, 8000),
    toVerify: clip(raw.toVerify, 8000),
    intendedUse: clip(raw.intendedUse, 120),
    materials: Array.isArray(raw.materials)
      ? raw.materials.map(coerceMaterial).filter((item): item is Material => item !== null).slice(0, 50)
      : [],
    internalNote: clip(raw.internalNote, 8000),
    status,
    sampleInDevelopment: raw.sampleInDevelopment === true,
    checklist: Array.isArray(raw.checklist)
      ? raw.checklist.map(coerceCheck).filter((item): item is ChecklistItem => item !== null).slice(0, 40)
      : defaultChecklist(),
    facts,
    shots,
    quote: coerceQuote(raw.quote, clientName),
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : now,
  };
}

function coerceMaterial(raw: unknown): Material | null {
  if (!isRecord(raw)) return null;
  const id = keepId(raw.id);
  if (!id) return null;
  return { id, text: clip(raw.text, 200) };
}

function coerceCheck(raw: unknown): ChecklistItem | null {
  if (!isRecord(raw)) return null;
  const id = keepId(raw.id);
  if (!id) return null;
  const group = CHECKLIST_GROUPS.some((item) => item.id === raw.group)
    ? (raw.group as ChecklistGroup)
    : "review";
  const label = clip(raw.label, 120);
  if (!label.trim()) return null;
  return { id, group, label, done: raw.done === true };
}

function coerceFact(raw: unknown): Fact | null {
  if (!isRecord(raw)) return null;
  const id = keepId(raw.id);
  if (!id) return null;
  let status: FactStatus = FACT_STATUSES.includes(raw.status as FactStatus)
    ? (raw.status as FactStatus)
    : "pending";
  const source = clip(raw.source, 300);
  if (status === "confirmed" && source.trim() === "") status = "pending";
  return {
    id,
    text: clip(raw.text, 2000),
    status,
    source,
  };
}

function coerceShot(raw: unknown, factIds: Set<string>): Shot | null {
  if (!isRecord(raw)) return null;
  const id = keepId(raw.id);
  if (!id) return null;
  const kind = NARRATION_KINDS.includes(raw.narrationKind as NarrationKind)
    ? (raw.narrationKind as NarrationKind)
    : "draft";
  const duration = raw.durationSec;
  const durationSec =
    typeof duration === "number" && Number.isInteger(duration) && duration >= 0 && duration <= 600
      ? duration
      : 0;
  const linked = Array.isArray(raw.factIds)
    ? raw.factIds.filter((factId): factId is string => typeof factId === "string" && factIds.has(factId))
    : [];
  return {
    id,
    title: clip(raw.title, 40),
    durationSec,
    picture: clip(raw.picture, 2000),
    narration: clip(raw.narration, 2000),
    narrationKind: kind,
    factIds: linked,
    onScreenText: clip(raw.onScreenText, 200),
  };
}

function coerceQuote(raw: unknown, clientName: string): QuoteDraft {
  const fallback = emptyQuote(clientName);
  if (!isRecord(raw)) return fallback;
  const tierId = keepId(raw.tierId) ?? fallback.tierId;
  const quantity =
    typeof raw.quantity === "number" && Number.isInteger(raw.quantity) && raw.quantity >= 1 && raw.quantity <= 99
      ? raw.quantity
      : 1;
  const validDays =
    typeof raw.validDays === "number" && Number.isInteger(raw.validDays) && raw.validDays >= 1 && raw.validDays <= 365
      ? raw.validDays
      : 30;
  const addonIds = Array.isArray(raw.addonIds)
    ? raw.addonIds.filter((id): id is string => typeof id === "string" && ID_RE.test(id)).slice(0, 20)
    : [];
  return {
    tierId,
    quantity,
    addonIds,
    preparedFor: clip(raw.preparedFor, 80, clientName),
    validDays,
    note: clip(raw.note, 2000),
  };
}

export function scrubShotFacts(project: Project) {
  const ids = new Set(project.facts.map((fact) => fact.id));
  project.shots = project.shots.map((shot) => ({
    ...shot,
    factIds: shot.factIds.filter((id) => ids.has(id)),
  }));
}
