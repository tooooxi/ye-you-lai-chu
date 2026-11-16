"use client";

import { useCallback, useEffect, useState } from "react";
import { SaveMeter } from "@/components/SaveMeter";
import { Segmented } from "@/components/Segmented";
import { api } from "@/lib/api";
import { FACT_TONE } from "@/lib/defaults";
import { notifyProjectUpdated } from "@/lib/events";
import { newId } from "@/lib/ids";
import { FACT_LABEL, FACT_STATUSES } from "@/lib/labels";
import { moveItem } from "@/lib/list";
import type { Fact, FactStatus } from "@/lib/types";
import { useAutosave } from "@/lib/useAutosave";
import { useProject } from "@/lib/useProject";

export function FactBoard({ projectId }: { projectId: string }) {
  const { project, error: loadError, missing } = useProject(projectId);
  const [facts, setFacts] = useState<Fact[] | null>(null);
  const [filter, setFilter] = useState<FactStatus | "all">("all");

  useEffect(() => {
    if (project && !facts) setFacts(project.facts);
  }, [project, facts]);

  const save = useCallback(
    async (value: Fact[]) => {
      await api(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ facts: value }),
      });
      notifyProjectUpdated();
    },
    [projectId],
  );

  const autosave = useAutosave(facts !== null, facts ?? [], save);
  const visible = (facts ?? []).filter((fact) => filter === "all" || fact.status === filter);

  function update(id: string, patch: Partial<Fact>) {
    setFacts((current) => current?.map((fact) => (fact.id === id ? { ...fact, ...patch } : fact)) ?? current);
  }

  if (missing) return null;
  if (loadError) return <p className="form-error">{loadError}</p>;
  if (!facts) return <p className="muted">读取中…</p>;

  const counts = {
    confirmed: facts.filter((fact) => fact.status === "confirmed").length,
    pending: facts.filter((fact) => fact.status === "pending").length,
    dramatized: facts.filter((fact) => fact.status === "dramatized").length,
  };

  return (
    <div className="work">
      <SaveMeter state={autosave.state} error={autosave.error} onSave={() => void autosave.saveNow()} />
      <p className="lede">
        一条一条写。已确认必须带来源。待核还不能当事实。演绎是创作句，会一直标着「非事实」。
      </p>
      <p className="meta">
        {FACT_LABEL.confirmed} {counts.confirmed} · {FACT_LABEL.pending} {counts.pending} · {FACT_LABEL.dramatized} {counts.dramatized}
      </p>
      <div className="row-actions">
        <div className="chips" role="tablist" aria-label="筛选事实">
          <button type="button" className={filter === "all" ? "chip is-selected" : "chip"} onClick={() => setFilter("all")}>
            全部
          </button>
          {FACT_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              className={filter === status ? "chip is-selected" : "chip"}
              onClick={() => setFilter(status)}
            >
              {status === "dramatized" ? "演绎" : FACT_LABEL[status]}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setFilter("all");
            setFacts([...facts, { id: newId(), text: "", status: "pending", source: "" }]);
          }}
        >
          添加一条
        </button>
      </div>
      {facts.length === 0 ? <p className="empty">还没有事实。已确认、待核、演绎要分开写。</p> : null}
      {facts.length > 0 && visible.length === 0 ? <p className="empty">这一类下面是空的。</p> : null}
      <div className="stack">
        {visible.map((fact) => {
          const index = facts.findIndex((item) => item.id === fact.id);
          return (
            <article key={fact.id} className="fact" data-status={fact.status}>
              <div className="fact-head">
                <Segmented
                  label="事实状态"
                  value={fact.status}
                  onChange={(status) => update(fact.id, { status })}
                  options={FACT_STATUSES.map((status) => ({
                    value: status,
                    label: status === "dramatized" ? "演绎" : FACT_LABEL[status],
                    tone: FACT_TONE[status],
                  }))}
                />
                <div className="row-actions">
                  <button type="button" className="btn btn-quiet" onClick={() => setFacts(moveItem(facts, index, -1))} disabled={index === 0}>
                    上移
                  </button>
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => setFacts(moveItem(facts, index, 1))}
                    disabled={index === facts.length - 1}
                  >
                    下移
                  </button>
                  <button type="button" className="btn btn-quiet" onClick={() => setFacts(facts.filter((item) => item.id !== fact.id))}>
                    删除
                  </button>
                </div>
              </div>
              <textarea
                value={fact.text}
                aria-label="事实或句子"
                placeholder={placeholderFor(fact.status)}
                onChange={(event) => update(fact.id, { text: event.target.value })}
              />
              <label className="field">
                <span className="field-label">来源</span>
                <input
                  value={fact.source}
                  placeholder="文件、录音、链接，或口述人与日期"
                  onChange={(event) => update(fact.id, { source: event.target.value })}
                />
              </label>
              {fact.status === "confirmed" && fact.source.trim() === "" ? (
                <p className="form-error">已确认需要来源。没有来源时改成待核。</p>
              ) : null}
              {fact.status === "pending" ? <p className="hint">核完之前，不要把这句话当成事实放进成片。</p> : null}
              {fact.status === "dramatized" ? <p className="drama-caption">这是演绎，不是已确认事实。</p> : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function placeholderFor(status: FactStatus): string {
  if (status === "confirmed") return "一句可以核对的事实";
  if (status === "dramatized") return "创作句。写完后它会一直标着「非事实」。";
  return "还不能当事实使用的内容";
}
