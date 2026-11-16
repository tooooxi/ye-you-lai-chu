export function formatClock(totalSec: number): string {
  const seconds = Math.max(0, Math.round(totalSec));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

export function totalDuration(shots: { durationSec: number }[]): number {
  return shots.reduce((sum, shot) => {
    return sum + (Number.isFinite(shot.durationSec) ? shot.durationSec : 0);
  }, 0);
}

export function durationHint(seconds: number): string {
  if (seconds === 0) return "还没有时长";
  if (seconds < 120) return "短于 2 分钟";
  if (seconds > 180) return "长于 3 分钟";
  return "在 2–3 分钟之间";
}

export function formatDate(input: Date | string): string {
  const date = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatStamp(iso: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatMoney(amount: number | null): string {
  if (amount == null) return "未配置";
  const cents = Math.round(amount * 100) % 100;
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: cents === 0 ? 0 : 2,
    maximumFractionDigits: cents === 0 ? 0 : 2,
  }).format(amount);
}

export function displayTitle(title: string): string {
  const trimmed = title.trim() || "未命名";
  if (trimmed.startsWith("《") && trimmed.endsWith("》")) return trimmed;
  return `《${trimmed}》`;
}

export function safeFilename(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim();
  return cleaned || "未命名";
}

export function priceSourceLabel(from: "unset" | "local" | "env"): string {
  if (from === "env") return "环境变量";
  if (from === "local") return "本机配置";
  return "未写入本机";
}
