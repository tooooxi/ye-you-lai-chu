"use client";

import { useCallback, useEffect, useState } from "react";
import { SaveMeter } from "@/components/SaveMeter";
import { Wordmark } from "@/components/Wordmark";
import { api } from "@/lib/api";
import { downloadText } from "@/lib/download";
import { quoteMarkdown } from "@/lib/document";
import { notifyProjectUpdated } from "@/lib/events";
import { displayTitle, formatDate, formatMoney, priceSourceLabel, safeFilename } from "@/lib/format";
import { PRODUCTION_NOTE, STATUS_LABEL, TEAM } from "@/lib/labels";
import { quoteLines } from "@/lib/quote";
import type { Pricing, Project, QuoteDraft } from "@/lib/types";
import { useAutosave } from "@/lib/useAutosave";
import { useProject } from "@/lib/useProject";

const EMPTY_QUOTE: QuoteDraft = {
  tierId: "develop",
  quantity: 1,
  addonIds: [],
  preparedFor: "",
  validDays: 30,
  note: "",
};

export function QuoteEditor({ projectId }: { projectId: string }) {
  const { project, error: loadError, missing } = useProject(projectId);
  const [draft, setDraft] = useState<QuoteDraft | null>(null);
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [pricingError, setPricingError] = useState("");

  useEffect(() => {
    if (project && !draft) setDraft(project.quote);
  }, [project, draft]);

  useEffect(() => {
    api<Pricing>("/api/pricing")
      .then(setPricing)
      .catch((err: unknown) => setPricingError(err instanceof Error ? err.message : "报价配置没有读出来"));
  }, []);

  const save = useCallback(
    async (value: QuoteDraft) => {
      await api(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ quote: value }),
      });
      notifyProjectUpdated();
    },
    [projectId],
  );

  const autosave = useAutosave(draft !== null, draft ?? EMPTY_QUOTE, save);

  if (missing) return null;
  if (loadError) return <p className="form-error">{loadError}</p>;
  if (!project || !draft) return <p className="muted">读取中…</p>;

  const built = pricing ? quoteLines(pricing, draft) : null;
  const prepared = draft.preparedFor.trim() || project.clientName.trim() || "未填写";
  const view: Project = { ...project, quote: draft };

  function patch<K extends keyof QuoteDraft>(key: K, value: QuoteDraft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  return (
    <div className="work work-wide">
      <div className="no-print stack">
        <SaveMeter state={autosave.state} error={autosave.error} onSave={() => void autosave.saveNow()} />
        <p className="lede">选择档位后生成试算。金额只从这台电脑的配置读取，仓库里没有价格。</p>
        {pricingError ? <p className="form-error">{pricingError}</p> : null}
        {pricing?.warnings.map((warning) => (
          <p key={warning} className="form-error">
            {warning}
          </p>
        ))}
        {pricing ? (
          <div className="tier-list">
            {pricing.tiers.map((tier) => (
              <label key={tier.id} className={draft.tierId === tier.id ? "tier is-selected" : "tier"}>
                <input
                  type="radio"
                  name="tier"
                  value={tier.id}
                  checked={draft.tierId === tier.id}
                  onChange={() => patch("tierId", tier.id)}
                />
                <span className="tier-name">{tier.name}</span>
                <span className="tier-summary">{tier.summary}</span>
                <span className="tier-amount">{formatMoney(tier.amount)}</span>
                <span className="hint">{priceSourceLabel(tier.amountFrom)}</span>
              </label>
            ))}
          </div>
        ) : null}
        <div className="split">
          <label className="field">
            <span className="field-label">数量</span>
            <input
              className="num"
              type="number"
              min={1}
              max={99}
              step={1}
              value={draft.quantity}
              onChange={(event) => patch("quantity", clampInt(event.target.value, 1, 99))}
            />
          </label>
          <label className="field">
            <span className="field-label">建议有效天数</span>
            <input
              className="num"
              type="number"
              min={1}
              max={365}
              step={1}
              value={draft.validDays}
              onChange={(event) => patch("validDays", clampInt(event.target.value, 1, 365))}
            />
          </label>
        </div>
        <label className="field">
          <span className="field-label">报价对象</span>
          <input
            value={draft.preparedFor}
            placeholder={project.clientName || "公司或人物"}
            onChange={(event) => patch("preparedFor", event.target.value)}
          />
        </label>
        {pricing && pricing.addons.length > 0 ? (
          <fieldset className="field">
            <legend className="field-label">附加项</legend>
            {pricing.addons.map((addon) => {
              const checked = draft.addonIds.includes(addon.id);
              return (
                <label key={addon.id} className="check-item">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(event) => {
                      const addonIds = event.target.checked
                        ? [...draft.addonIds, addon.id]
                        : draft.addonIds.filter((id) => id !== addon.id);
                      patch("addonIds", addonIds);
                    }}
                  />
                  <span>
                    {addon.name}
                    <small>
                      {addon.summary} · {formatMoney(addon.amount)} · {priceSourceLabel(addon.amountFrom)}
                    </small>
                  </span>
                </label>
              );
            })}
          </fieldset>
        ) : null}
        <label className="field">
          <span className="field-label">备注</span>
          <textarea value={draft.note} onChange={(event) => patch("note", event.target.value)} placeholder="范围、时长、不包含的内容。不要在这里写付款账户。" />
        </label>
        <div className="toolbar">
          <button type="button" className="btn" onClick={() => window.print()}>
            打印报价单
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={!pricing}
            onClick={() => {
              if (!pricing) return;
              downloadText(`${safeFilename(project.workingTitle)}-报价单.md`, quoteMarkdown(view, pricing));
            }}
          >
            下载 Markdown
          </button>
        </div>
      </div>
      {pricing && built ? (
        <article className="sheet">
          <Wordmark />
          <p className="kicker sheet-kicker">内部试算 · 报价单</p>
          <h1>{displayTitle(project.workingTitle)}</h1>
          {project.sampleInDevelopment ? <p className="badge">样片开发中</p> : null}
          <dl className="sheet-dl">
            <div>
              <dt>对象</dt>
              <dd>{prepared}</dd>
            </div>
            <div>
              <dt>阶段</dt>
              <dd>{STATUS_LABEL[project.status]}</dd>
            </div>
            <div>
              <dt>试算日期</dt>
              <dd>{formatDate(new Date())}</dd>
            </div>
            <div>
              <dt>建议有效期</dt>
              <dd>{draft.validDays} 天</dd>
            </div>
          </dl>
          <table className="quote-table">
            <thead>
              <tr>
                <th>项目</th>
                <th>数量</th>
                <th>单价</th>
                <th>金额</th>
              </tr>
            </thead>
            <tbody>
              {built.lines.map((line) => (
                <tr key={line.id}>
                  <td>
                    <strong>{line.name}</strong>
                    <span>{line.summary}</span>
                    <span className="hint">{line.amount == null ? "未写入本机" : priceSourceLabel(line.amountFrom)}</span>
                  </td>
                  <td>
                    {line.quantity} {line.unit}
                  </td>
                  <td>{formatMoney(line.unitAmount)}</td>
                  <td>{formatMoney(line.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan={3}>合计</th>
                <td>{built.total == null ? "未完成配置" : formatMoney(built.total)}</td>
              </tr>
            </tfoot>
          </table>
          {built.total == null ? <p className="note">有金额未写入本机配置，合计无法算出。不会用 0 代替。</p> : null}
          {draft.note.trim() ? (
            <section className="sheet-block">
              <h2>备注</h2>
              <p className="pre">{draft.note}</p>
            </section>
          ) : null}
          <section className="sheet-block">
            <h2>说明</h2>
            <ul>
              {pricing.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
          <footer className="sheet-foot">
            <p>{TEAM.map((person) => `${person.name}（${person.role}）`).join(" · ")}</p>
            <p>{PRODUCTION_NOTE}</p>
          </footer>
        </article>
      ) : null}
    </div>
  );
}

function clampInt(value: string, min: number, max: number): number {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}
