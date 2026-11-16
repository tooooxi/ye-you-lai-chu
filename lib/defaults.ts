import { newId } from "@/lib/ids";
import type {
  ChecklistItem,
  FactStatus,
  ProjectStatus,
  QuoteDraft,
  Shot,
} from "@/lib/types";

export function emptyQuote(preparedFor = ""): QuoteDraft {
  return {
    tierId: "develop",
    quantity: 1,
    addonIds: [],
    preparedFor,
    validDays: 30,
    note: "",
  };
}

export function defaultChecklist(): ChecklistItem[] {
  const items: { group: ChecklistItem["group"]; label: string }[] = [
    { group: "rights", label: "出镜人物的肖像与姓名授权已有书面记录" },
    { group: "rights", label: "素材来源与使用权已登记" },
    { group: "rights", label: "演绎句已与已确认事实分开" },
    { group: "review", label: "事实板完成首轮核对" },
    { group: "review", label: "剧本与分镜第一轮审看" },
    { group: "review", label: "样片审看" },
    { group: "review", label: "成片终审" },
    { group: "delivery", label: "成片文件已交付" },
    { group: "delivery", label: "回款节点记在外部台账（金额不写入本工具）" },
  ];
  return items.map((item) => ({ id: newId(), ...item, done: false }));
}

const SAMPLE_SHOTS: { title: string; durationSec: number; picture: string; onScreenText: string }[] = [
  {
    title: "开场",
    durationSec: 8,
    picture: "全画幅是缓慢移动的色块，像颜料被轻轻推开。可以是场地的几何。不要出现可辨认的人脸。",
    onScreenText: "",
  },
  {
    title: "题目",
    durationSec: 6,
    picture: "工作标题写进画面，笔触停住。背景继续轻微移动。",
    onScreenText: "",
  },
  {
    title: "人物如何进入",
    durationSec: 14,
    picture: "只给手、背影或肩线。动作比真实世界慢一点。不要画成写实肖像。",
    onScreenText: "",
  },
  {
    title: "物件",
    durationSec: 12,
    picture: "一件会反复出现的物件。纹理是绘出来的，镜头几乎不动。",
    onScreenText: "",
  },
  {
    title: "一件具体的事",
    durationSec: 16,
    picture: "工作现场被画成几个平面。人以局部进入，做一件具体的事。",
    onScreenText: "",
  },
  {
    title: "过程",
    durationSec: 18,
    picture: "同一动作画两三幅，循环，节奏略微不齐。不要做成流畅的写实动画。",
    onScreenText: "",
  },
  {
    title: "停顿",
    durationSec: 10,
    picture: "动作停住。物件留在画面里，周围空出来。",
    onScreenText: "",
  },
  {
    title: "行业里的位置",
    durationSec: 16,
    picture: "用手绘的简单图形表示关系或规模。不要信息图模板，不要图标库风格。",
    onScreenText: "",
  },
  {
    title: "选择",
    durationSec: 18,
    picture: "一个决定被画成动作，而不是一句口号。仍然不要写实人脸。",
    onScreenText: "",
  },
  {
    title: "收束",
    durationSec: 14,
    picture: "回到开场的色块。光线只变一点。人如果还在，只留局部。",
    onScreenText: "",
  },
  {
    title: "落幅",
    durationSec: 8,
    picture: "画面渐慢，工作标题留下。",
    onScreenText: "",
  },
  {
    title: "片尾",
    durationSec: 10,
    picture: "留白或近黑。只有一行小字，静止。",
    onScreenText: "YE YOU LAI CHU",
  },
];

export function sampleShots(): Shot[] {
  return SAMPLE_SHOTS.map((shot) => ({
    id: newId(),
    title: shot.title,
    durationSec: shot.durationSec,
    picture: shot.picture,
    narration: "",
    narrationKind: "draft",
    factIds: [],
    onScreenText: shot.onScreenText,
  }));
}

export interface CreateDraft {
  workingTitle: string;
  clientName: string;
  subject: string;
  known: string;
  toVerify: string;
  intendedUse: string;
  materials: { id: string; text: string }[];
  internalNote: string;
  status: ProjectStatus;
  sampleInDevelopment: boolean;
}

export function blankDraft(): CreateDraft {
  return {
    workingTitle: "",
    clientName: "",
    subject: "",
    known: "",
    toVerify: "",
    intendedUse: "",
    materials: [],
    internalNote: "",
    status: "talk",
    sampleInDevelopment: false,
  };
}

export function zaibianDraft(): CreateDraft {
  return {
    workingTitle: "在边上",
    clientName: "",
    subject: "邹畔",
    known: "",
    toVerify: "样片开发中。人物经历尚未录入。不要在这里编写未经核实的生平。",
    intendedUse: "样片",
    materials: [],
    internalNote: "样片开发中的起点。除工作标题和对象姓名外，没有预填事实。",
    status: "sample",
    sampleInDevelopment: true,
  };
}

export const FACT_TONE: Record<FactStatus, "ink" | "pending" | "drama"> = {
  confirmed: "ink",
  pending: "pending",
  dramatized: "drama",
};
