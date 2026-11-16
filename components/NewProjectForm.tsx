"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MaterialList } from "@/components/MaterialList";
import { api } from "@/lib/api";
import { blankDraft, zaibianDraft, type CreateDraft } from "@/lib/defaults";
import { notifyProjectsChanged } from "@/lib/events";
import { PROJECT_STATUSES, STATUS_LABEL, USE_SUGGESTIONS } from "@/lib/labels";
import type { Project, ProjectStatus } from "@/lib/types";

export function NewProjectForm() {
  const router = useRouter();
  const [draft, setDraft] = useState<CreateDraft>(blankDraft());
  const [template, setTemplate] = useState<"blank" | "zaibian">("blank");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function applyTemplate(next: "blank" | "zaibian") {
    const dirty = JSON.stringify(draft) !== JSON.stringify(template === "blank" ? blankDraft() : zaibianDraft());
    if (dirty && !confirm("换一种起点会盖掉当前填写的内容。")) return;
    setTemplate(next);
    setDraft(next === "zaibian" ? zaibianDraft() : blankDraft());
  }

  function patch<K extends keyof CreateDraft>(key: K, value: CreateDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const data = await api<{ project: Project }>("/api/projects", {
        method: "POST",
        body: JSON.stringify(draft),
      });
      notifyProjectsChanged();
      router.push(`/projects/${data.project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "没有创建");
      setPending(false);
    }
  }

  return (
    <div className="work">
      <header className="page-head">
        <p className="kicker">立项</p>
        <h1>新建项目</h1>
        <p className="lede">先记下已知和待核。事实板上的句子以后再逐条标状态。</p>
      </header>
      <div className="template-cards">
        <button type="button" className={template === "blank" ? "template-card is-selected" : "template-card"} onClick={() => applyTemplate("blank")}>
          <strong>空白</strong>
          <span>从零开始。</span>
        </button>
        <button type="button" className={template === "zaibian" ? "template-card is-selected" : "template-card"} onClick={() => applyTemplate("zaibian")}>
          <strong>《在边上》</strong>
          <span>样片开发中。只放入工作标题和对象姓名，不填生平。</span>
        </button>
      </div>
      <form className="stack" onSubmit={onSubmit}>
        <label className="field">
          <span className="field-label">工作标题</span>
          <input
            value={draft.workingTitle}
            onChange={(event) => {
              event.target.setCustomValidity("");
              patch("workingTitle", event.target.value);
            }}
            onInvalid={(event) => event.currentTarget.setCustomValidity("请填写工作标题")}
            required
            placeholder="在边上"
          />
        </label>
        <div className="split">
          <label className="field">
            <span className="field-label">公司或人物</span>
            <input value={draft.clientName} onChange={(event) => patch("clientName", event.target.value)} placeholder="可以先空着" />
          </label>
          <label className="field">
            <span className="field-label">故事对象</span>
            <input value={draft.subject} onChange={(event) => patch("subject", event.target.value)} />
          </label>
        </div>
        <div className="split">
          <label className="field">
            <span className="field-label">已知</span>
            <textarea value={draft.known} onChange={(event) => patch("known", event.target.value)} placeholder="已经核对过的情况。粗记即可，对外使用的句子放到事实板。" />
          </label>
          <label className="field">
            <span className="field-label">待核</span>
            <textarea value={draft.toVerify} onChange={(event) => patch("toVerify", event.target.value)} placeholder="还不能当成事实的内容。" />
          </label>
        </div>
        <div className="field">
          <span className="field-label">成片打算用在哪里</span>
          <div className="chips">
            {USE_SUGGESTIONS.map((item) => (
              <button type="button" key={item} className="chip" onClick={() => patch("intendedUse", item)}>
                {item}
              </button>
            ))}
          </div>
          <input value={draft.intendedUse} onChange={(event) => patch("intendedUse", event.target.value)} />
        </div>
        <div className="field">
          <span className="field-label">手头材料</span>
          <MaterialList materials={draft.materials} onChange={(materials) => patch("materials", materials)} />
        </div>
        <div className="split">
          <label className="field">
            <span className="field-label">起始阶段</span>
            <select value={draft.status} onChange={(event) => patch("status", event.target.value as ProjectStatus)}>
              {PROJECT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          </label>
          <div className="field">
            <span className="field-label">标记</span>
            <label className="check-line">
              <input
                type="checkbox"
                checked={draft.sampleInDevelopment}
                onChange={(event) => patch("sampleInDevelopment", event.target.checked)}
              />
              <span>标为「样片开发中」</span>
            </label>
          </div>
        </div>
        <label className="field">
          <span className="field-label">内部备注</span>
          <textarea value={draft.internalNote} onChange={(event) => patch("internalNote", event.target.value)} placeholder="不出现在脚本稿和报价单上。" />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="row-actions">
          <button className="btn" type="submit" disabled={pending}>
            {pending ? "正在创建…" : "创建项目"}
          </button>
        </div>
      </form>
    </div>
  );
}
