import type { Pricing, QuoteDraft } from "@/lib/types";

export interface QuoteLine {
  id: string;
  name: string;
  summary: string;
  quantity: number;
  unit: string;
  unitAmount: number | null;
  amount: number | null;
  amountFrom: "unset" | "local" | "env";
}

function money(value: number): number {
  return Math.round(value * 100) / 100;
}

export function quoteLines(pricing: Pricing, quote: QuoteDraft): { lines: QuoteLine[]; total: number | null } {
  const lines: QuoteLine[] = [];
  const tier = pricing.tiers.find((item) => item.id === quote.tierId);
  if (!tier) {
    lines.push({
      id: quote.tierId || "missing",
      name: "未匹配的档位",
      summary: "本机配置里没有这个档位。",
      quantity: quote.quantity,
      unit: "项",
      unitAmount: null,
      amount: null,
      amountFrom: "unset",
    });
  } else {
    lines.push({
      id: tier.id,
      name: tier.name,
      summary: tier.summary,
      quantity: quote.quantity,
      unit: tier.unit,
      unitAmount: tier.amount,
      amount: tier.amount == null ? null : money(tier.amount * quote.quantity),
      amountFrom: tier.amountFrom,
    });
  }

  for (const id of quote.addonIds) {
    const addon = pricing.addons.find((item) => item.id === id);
    if (!addon) continue;
    lines.push({
      id: addon.id,
      name: addon.name,
      summary: addon.summary,
      quantity: 1,
      unit: "项",
      unitAmount: addon.amount,
      amount: addon.amount,
      amountFrom: addon.amountFrom,
    });
  }

  if (lines.length === 0 || lines.some((line) => line.amount == null)) {
    return { lines, total: null };
  }
  return {
    lines,
    total: money(lines.reduce((sum, line) => sum + (line.amount ?? 0), 0)),
  };
}
