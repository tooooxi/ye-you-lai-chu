"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChecklistEditor } from "@/components/ChecklistEditor";
import { MaterialList } from "@/components/MaterialList";
import { SaveMeter } from "@/components/SaveMeter";
import { api } from "@/lib/api";
import { notifyProjectUpdated, notifyProjectsChanged } from "@/lib/events";
import { USE_SUGGESTIONS } from "@/lib/labels";
import type { ChecklistItem, Material, Project } from "@/lib/types";
import { useAutosave } from "@/lib/useAutosave";
import { useProject } from "@/lib/useProject";

interface IntakeDraft {
  workingTitle: string;
  clientName: string;
  subject: string;
  known: string;
  toVerify: string;
  intendedUse: string;
  materials: Material[];
  internalNote: string;
  sampleInDevelopment: boolean;
  checklist: ChecklistItem[];
}

function toDraft(project: Project): IntakeDraft {
  return {
    workingTitle: project.workingTitle,
    clientName: project.clientName,
    subject: project.subject,
    known: project.known,
    toVerify: project.toVerify,
    intendedUse: project.intendedUse,
    materials: project.materials,
    internalNote: project.internalNote,
    sampleInDevelopment: project.sampleInDevelopment,
    checklist: project.checklist,
  };
}

const EMPTY: IntakeDraft = {
  workingTitle: "",
  clientName: "",
  subject: "",
  known: "",
  toVerify: "",
  intendedUse: "",
  materials: [],
  internalNote: "",
  sampleInDevelopment: false,
  checklist: [],
};

export function IntakeForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { project, error: loadError, missing } = useProject(projectId);
  const [draft, setDraft] = useState<IntakeDraft | null>(null);

  useEffect(() => {
    if (project && !draft) setDraft(toDraft(project));
  }, [project, draft]);

  const save = useCallback(
    async (value: IntakeDraft) => {
      await api(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify(value),
      });
      notifyProjectUpdated();
    },
    [projectId],
  );

  const autosave = useAutosave(draft !== null, draft ?? EMPTY, save);

  function patch<K extends keyof IntakeDraft>(key: K, value: IntakeDraft[K]) {
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }

  async function remove() {
    if (!confirm("删除后不可恢复。确定删除这个项目？")) return;
    await api(`/api/projects/${projectId}`, { method: "DELETE" });
    notifyProjectsChanged();
    router.push("/");
  }

  if (missing) return null;
  if (loadError) return <p className="form-error">{loadError}</p>;
  if (!draft) return <p className="muted">读取中…</p>;

  return (
    <div className="work">
      <SaveMeter state={autosave.state} error={autosave.error} onSave={() => void autosave.saveNow()} />
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault();
          void autosave.saveNow();
        }}
      >
        <label className="field">
          <span className="field-label">工作标题</span>
          <input value={draft.workingTitle} onChange={(event) => patch("workingTitle", event.target.value)} />
        </label>
        <div className="split">
          <label className="field">
            <span className="field-label">公司或人物</span>
            <input value={draft.clientName} onChange={(event) => patch("clientName", event.target.value)} />
          </label>
          <label className="field">
            <span className="field-label">故事对象</span>
            <input value={draft.subject} onChange={(event) => patch("subject", event.target.value)} />
          </label>
        </div>
        <div className="split">
          <label className="field">
            <span className="field-label">已知</span>
            <textarea
              value={draft.known}
              onChange={(event) => patch("known", event.target.value)}
              placeholder="已经核对过的情况。对外使用的句子放到事实板。"
            />
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
        <label className="check-line">
          <input
            type="checkbox"
            checked={draft.sampleInDevelopment}
            onChange={(event) => patch("sampleInDevelopment", event.target.checked)}
          />
          <span>标为「样片开发中」</span>
        </label>
        <label className="field">
          <span className="field-label">内部备注</span>
          <textarea value={draft.internalNote} onChange={(event) => patch("internalNote", event.target.value)} placeholder="不出现在脚本稿和报价单上。" />
        </label>
        <section className="stack" id="checklist">
          <h2>清单</h2>
          <p className="hint">权利、审片和交付分开勾。金额不记在这里。</p>
          <ChecklistEditor items={draft.checklist} onChange={(checklist) => patch("checklist", checklist)} />
        </section>
        <div className="row-actions">
          <button type="button" className="btn btn-quiet" onClick={() => void remove()}>
            删除项目
          </button>
        </div>
      </form>
    </div>
  );
}
