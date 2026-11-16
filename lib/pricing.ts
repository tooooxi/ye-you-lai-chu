import "server-only";

import { promises as fs } from "fs";
import path from "path";
import type { AmountFrom, Pricing, PricingAddon, PricingTier } from "@/lib/types";
import { UserInputError } from "@/lib/validate";

const examplePath = path.join(process.cwd(), "config", "pricing.example.json");
const localPath = path.join(process.cwd(), "config", "pricing.local.json");

const TIER_ENV: Record<string, string> = {
  develop: "YYLC_PRICE_DEVELOP",
  short: "YYLC_PRICE_SHORT",
  series: "YYLC_PRICE_SERIES",
};

const ADDON_ENV: Record<string, string> = {
  "extra-review": "YYLC_PRICE_ADDON_EXTRA_REVIEW",
  "extra-cut": "YYLC_PRICE_ADDON_EXTRA_CUT",
};

interface CatalogItem {
  id: string;
  name: string;
  summary: string;
  unit?: string;
  amount: number | null;
}

interface Catalog {
  defaultValidDays: number;
  notes: string[];
  tiers: CatalogItem[];
  addons: CatalogItem[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function amountOf(value: unknown, where: string): number | null {
  if (value == null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new UserInputError(`${where}的金额必须是空值或非负数字。`);
  }
  return Math.round(value * 100) / 100;
}

function catalogItem(value: unknown, where: string, withUnit: boolean): CatalogItem {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string") {
    throw new UserInputError(`${where}有一条档位格式不对。`);
  }
  return {
    id: value.id,
    name: value.name,
    summary: typeof value.summary === "string" ? value.summary : "",
    unit: withUnit && typeof value.unit === "string" ? value.unit : undefined,
    amount: amountOf(value.amount, value.name || where),
  };
}

function parseCatalog(value: unknown): Catalog {
  if (!isRecord(value) || !Array.isArray(value.tiers)) {
    throw new UserInputError("报价配置读不出来。请对照 pricing.example.json 检查。");
  }
  const days = value.defaultValidDays;
  return {
    defaultValidDays:
      typeof days === "number" && Number.isInteger(days) && days >= 1 && days <= 365 ? days : 30,
    notes: Array.isArray(value.notes) ? value.notes.filter((note): note is string => typeof note === "string") : [],
    tiers: value.tiers.map((item) => catalogItem(item, "档位", true)),
    addons: Array.isArray(value.addons) ? value.addons.map((item) => catalogItem(item, "附加项", false)) : [],
  };
}

async function readJson(file: string): Promise<unknown> {
  const text = await fs.readFile(file, "utf8");
  try {
    return JSON.parse(text);
  } catch {
    throw new UserInputError("报价配置读不出来。请对照 pricing.example.json 检查。");
  }
}

function envAmount(name: string, warnings: string[]): number | undefined {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return undefined;
  if (!/^\d+(\.\d{1,2})?$/.test(raw.trim())) {
    warnings.push(`${name} 不是有效金额，已忽略。`);
    return undefined;
  }
  return Number(raw.trim());
}

function applyAmount(
  base: number | null,
  allowBase: boolean,
  envName: string | undefined,
  warnings: string[],
): { amount: number | null; amountFrom: AmountFrom } {
  let amount: number | null = allowBase ? base : null;
  let amountFrom: AmountFrom = allowBase && base != null ? "local" : "unset";
  if (envName) {
    const fromEnv = envAmount(envName, warnings);
    if (fromEnv !== undefined) {
      amount = fromEnv;
      amountFrom = "env";
    }
  }
  return { amount, amountFrom };
}

export async function loadPricing(): Promise<Pricing> {
  const example = parseCatalog(await readJson(examplePath));
  let local: Catalog | null = null;
  try {
    local = parseCatalog(await readJson(localPath));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const source = local ?? example;
  const allowBase = local !== null;
  const warnings: string[] = [];

  const tiers: PricingTier[] = source.tiers.map((tier) => {
    const priced = applyAmount(tier.amount, allowBase, TIER_ENV[tier.id], warnings);
    return {
      id: tier.id,
      name: tier.name,
      summary: tier.summary,
      unit: tier.unit || "项",
      amount: priced.amount,
      amountFrom: priced.amountFrom,
    };
  });

  const addons: PricingAddon[] = source.addons.map((addon) => {
    const priced = applyAmount(addon.amount, allowBase, ADDON_ENV[addon.id], warnings);
    return {
      id: addon.id,
      name: addon.name,
      summary: addon.summary,
      amount: priced.amount,
      amountFrom: priced.amountFrom,
    };
  });

  const contractNote = "本页不是合同，不含付款方式。";
  const notes = source.notes.includes(contractNote) ? source.notes : [...source.notes, contractNote];

  let defaultValidDays = source.defaultValidDays;
  const daysRaw = process.env.YYLC_PRICE_VALID_DAYS;
  if (daysRaw && daysRaw.trim()) {
    if (/^\d+$/.test(daysRaw.trim())) {
      const days = Number(daysRaw.trim());
      if (days >= 1 && days <= 365) defaultValidDays = days;
      else warnings.push("YYLC_PRICE_VALID_DAYS 超出 1 到 365，已忽略。");
    } else {
      warnings.push("YYLC_PRICE_VALID_DAYS 不是整数，已忽略。");
    }
  }

  return {
    currency: "CNY",
    defaultValidDays,
    notes,
    tiers,
    addons,
    warnings,
  };
}
