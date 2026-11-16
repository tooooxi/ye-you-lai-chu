import { displayTitle, formatClock, formatDate, formatMoney, totalDuration } from "@/lib/format";
import { FACT_LABEL, NARRATION_LABEL, PRODUCTION_NOTE, STATUS_LABEL, TEAM } from "@/lib/labels";
import { quoteLines } from "@/lib/quote";
import type { Fact, Pricing, Project, Shot } from "@/lib/types";

function block(text: string): string {
  const trimmed = text.trim();
  return trimmed ? trimmed : "（空）";
}

function factLine(fact: Fact): string {
  const source = fact.source.trim() ? ` · 来源：${fact.source.trim()}` : "";
  const label = fact.status === "dramatized" ? "演绎 · 非事实" : FACT_LABEL[fact.status];
  return `- ${label}：${block(fact.text)}${source}`;
}

export function scriptMarkdown(project: Project): string {
  const shots = project.shots;
  const lines: string[] = [];
  lines.push(`# ${displayTitle(project.workingTitle)} 分镜脚本`);
  lines.push("");
  lines.push("内部工作稿 · 业有来处");
  if (project.sampleInDevelopment) lines.push("样片开发中");
  lines.push("");
  lines.push(`- 阶段：${STATUS_LABEL[project.status]}`);
  lines.push(`- 对象：${project.subject.trim() || "未填"}`);
  lines.push(`- 公司或人物：${project.clientName.trim() || "未填"}`);
  lines.push(`- 用途：${project.intendedUse.trim() || "未填"}`);
  lines.push(`- 合计时长：${formatClock(totalDuration(shots))}`);
  lines.push(`- 导出日期：${formatDate(new Date())}`);
  lines.push("");
  lines.push("标注「演绎 · 非事实」的句子不是已确认事实。立项笔记也不是事实板。");
  lines.push("");

  if (project.known.trim()) {
    lines.push("## 立项笔记 · 已知");
    lines.push("");
    lines.push(project.known.trim());
    lines.push("");
  }
  if (project.toVerify.trim()) {
    lines.push("## 立项笔记 · 待核");
    lines.push("");
    lines.push(project.toVerify.trim());
    lines.push("");
  }
  if (project.materials.some((item) => item.text.trim())) {
    lines.push("## 手头材料");
    lines.push("");
    for (const item of project.materials) {
      if (item.text.trim()) lines.push(`- ${item.text.trim()}`);
    }
    lines.push("");
  }

  lines.push("## 分镜");
  lines.push("");
  if (shots.length === 0) {
    lines.push("还没有分镜。");
    lines.push("");
  }
  shots.forEach((shot, index) => {
    lines.push(...shotMarkdown(project, shot, index));
  });

  lines.push("## 事实附录");
  lines.push("");
  lines.push(...factAppendix(project));
  lines.push("");
  lines.push("---");
  lines.push("业有来处 · 非发行版本");
  lines.push(TEAM.map((person) => `${person.name} ${person.role}`).join(" · "));
  lines.push(PRODUCTION_NOTE);
  lines.push("");
  return lines.join("\n");
}

function shotMarkdown(project: Project, shot: Shot, index: number): string[] {
  const lines: string[] = [];
  const title = shot.title.trim() ? ` ${shot.title.trim()}` : "";
  lines.push(`### ${String(index + 1).padStart(2, "0")}${title} · ${formatClock(shot.durationSec)}`);
  lines.push("");
  lines.push("**画面**（手绘动态影像）");
  lines.push("");
  lines.push(block(shot.picture));
  lines.push("");
  lines.push(`**旁白**（${NARRATION_LABEL[shot.narrationKind]}）`);
  lines.push("");
  lines.push(block(shot.narration));
  if (shot.narrationKind === "from-facts") {
    lines.push("");
    lines.push("依据：");
    if (shot.factIds.length === 0) {
      lines.push("- 没有对上事实板。");
    }
    for (const id of shot.factIds) {
      const fact = project.facts.find((item) => item.id === id);
      lines.push(fact ? factLine(fact) : "- 所引事实已不在事实板上。");
    }
  }
  lines.push("");
  lines.push("**上屏**");
  lines.push("");
  lines.push(block(shot.onScreenText));
  lines.push("");
  return lines;
}

function factAppendix(project: Project): string[] {
  if (project.facts.length === 0) return ["事实板是空的。"];
  const lines: string[] = [];
  const groups: { status: Fact["status"]; title: string }[] = [
    { status: "confirmed", title: "已确认" },
    { status: "pending", title: "待核" },
    { status: "dramatized", title: "演绎 · 非事实" },
  ];
  for (const group of groups) {
    const facts = project.facts.filter((fact) => fact.status === group.status && fact.text.trim());
    lines.push(`### ${group.title}`);
    lines.push("");
    if (facts.length === 0) {
      lines.push("（无）");
    } else {
      lines.push(...facts.map(factLine));
    }
    lines.push("");
  }
  return lines;
}

export function quoteMarkdown(project: Project, pricing: Pricing): string {
  const built = quoteLines(pricing, project.quote);
  const prepared = project.quote.preparedFor.trim() || project.clientName.trim() || "未填写";
  const lines: string[] = [];
  lines.push(`# ${displayTitle(project.workingTitle)} 报价单`);
  lines.push("");
  lines.push("业有来处 · 内部试算");
  if (project.sampleInDevelopment) lines.push("样片开发中");
  lines.push("");
  lines.push(`- 试算日期：${formatDate(new Date())}`);
  lines.push(`- 对象：${prepared}`);
  lines.push(`- 阶段：${STATUS_LABEL[project.status]}`);
  lines.push(`- 建议有效期：${project.quote.validDays} 天（正式期限以书面文件为准）`);
  lines.push("");
  lines.push("| 项目 | 说明 | 数量 | 单价 | 金额 | 金额来源 |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const line of built.lines) {
    const source = line.amount == null ? "未写入本机" : line.amountFrom === "env" ? "环境变量" : "本机配置";
    lines.push(
      `| ${line.name} | ${line.summary.replace(/\|/g, " ")} | ${line.quantity} ${line.unit} | ${formatMoney(line.unitAmount)} | ${formatMoney(line.amount)} | ${source} |`,
    );
  }
  lines.push("");
  lines.push(`合计：${built.total == null ? "未完成配置" : formatMoney(built.total)}`);
  lines.push("");
  if (project.quote.note.trim()) {
    lines.push("## 备注");
    lines.push("");
    lines.push(project.quote.note.trim());
    lines.push("");
  }
  lines.push("## 说明");
  lines.push("");
  for (const note of pricing.notes) lines.push(`- ${note}`);
  if (built.total == null) lines.push("- 有金额未写入本机配置，合计无法算出。");
  lines.push("");
  lines.push(TEAM.map((person) => `${person.name}（${person.role}）`).join(" · "));
  lines.push(PRODUCTION_NOTE);
  lines.push("");
  return lines.join("\n");
}
