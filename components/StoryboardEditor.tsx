"use client";

import { useCallback, useEffect, useState } from "react";
import { SaveMeter } from "@/components/SaveMeter";
import { Segmented } from "@/components/Segmented";
import { api } from "@/lib/api";
import { sampleShots } from "@/lib/defaults";
import { notifyProjectUpdated } from "@/lib/events";
import { durationHint, formatClock, totalDuration } from "@/lib/format";
import { newId } from "@/lib/ids";
import { FACT_LABEL, NARRATION_KINDS, NARRATION_LABEL } from "@/lib/labels";
import { moveItem } from "@/lib/list";
import type { Fact, NarrationKind, Shot } from "@/lib/types";
import { useAutosave } from "@/lib/useAutosave";
import { useProject } from "@/lib/useProject";

export function StoryboardEditor({ projectId }: { projectId: string }) {
  const { project, error: loadError, missing } = useProject(projectId);
  const [shots, setShots] = useState<Shot[] | null>(null);
  const [facts, setFacts] = useState<Fact[]>([]);

  useEffect(() => {
    if (project && !shots) {
      setShots(project.shots);
      setFacts(project.facts);
    }
  }, [project, shots]);

  const save = useCallback(
    async (value: Shot[]) => {
      await api(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ shots: value }),
      });
      notifyProjectUpdated();
    },
    [projectId],
  );

  const autosave = useAutosave(shots !== null, shots ?? [], save);

  function update(id: string, patch: Partial<Shot>) {
    setShots((current) => current?.map((shot) => (shot.id === id ? { ...shot, ...patch } : shot)) ?? current);
  }

  if (missing) return null;
  if (loadError) return <p className="form-error">{loadError}</p>;
  if (!shots) return <p className="muted">读取中…</p>;

  const seconds = totalDuration(shots);

  return (
    <div className="work work-wide">
      <SaveMeter state={autosave.state} error={autosave.error} onSave={() => void autosave.saveNow()} />
      <p className="lede">画面按手绘动态影像来写：色块、笔触、局部或背影。不要写写实人脸。</p>
      <div className="duration-bar">
        <strong>{formatClock(seconds)}</strong>
        <span>{durationHint(seconds)}</span>
        <span>{shots.length} 镜</span>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            if (shots.length > 0 && !confirm("用样片结构替换当前分镜？现在的分镜会被盖掉。")) return;
            setShots(sampleShots());
          }}
        >
          放入 2–3 分钟样片结构
        </button>
        <button
          type="button"
          className="btn"
          onClick={() =>
            setShots([
              ...shots,
              {
                id: newId(),
                title: "",
                durationSec: 5,
                picture: "",
                narration: "",
                narrationKind: "draft",
                factIds: [],
                onScreenText: "",
              },
            ])
          }
        >
          加一镜
        </button>
      </div>
      {shots.length === 0 ? <p className="empty">还没有分镜。可以先放入一套约 2 分 30 秒的样片结构，旁白是空的。</p> : null}
      <div className="stack">
        {shots.map((shot, index) => (
          <article key={shot.id} className="shot">
            <div className="shot-head">
              <span className="shot-index">{String(index + 1).padStart(2, "0")}</span>
              <input
                className="shot-title"
                value={shot.title}
                aria-label="分镜标题"
                placeholder="这一镜在做什么"
                onChange={(event) => update(shot.id, { title: event.target.value })}
              />
              <label className="duration-field">
                <span>时长</span>
                <input
                  className="num"
                  type="number"
                  min={0}
                  max={600}
                  step={1}
                  value={shot.durationSec}
                  aria-label="时长（秒）"
                  onChange={(event) => {
                    const parsed = Number.parseInt(event.target.value, 10);
                    const durationSec = Number.isNaN(parsed) ? 0 : Math.min(600, Math.max(0, parsed));
                    update(shot.id, { durationSec });
                  }}
                />
                <span>秒</span>
              </label>
              <div className="row-actions">
                <button type="button" className="btn btn-quiet" disabled={index === 0} onClick={() => setShots(moveItem(shots, index, -1))}>
                  上移
                </button>
                <button
                  type="button"
                  className="btn btn-quiet"
                  disabled={index === shots.length - 1}
                  onClick={() => setShots(moveItem(shots, index, 1))}
                >
                  下移
                </button>
                <button type="button" className="btn btn-quiet" onClick={() => setShots(shots.filter((item) => item.id !== shot.id))}>
                  删除
                </button>
              </div>
            </div>
            <label className="field">
              <span className="field-label">画面 · 手绘动态影像</span>
              <textarea
                value={shot.picture}
                placeholder="色块、笔触、局部、背影。不要写写实人脸。"
                onChange={(event) => update(shot.id, { picture: event.target.value })}
              />
            </label>
            <div className="field">
              <span className="field-label">旁白</span>
              <Segmented
                label="旁白类型"
                value={shot.narrationKind}
                onChange={(narrationKind: NarrationKind) => update(shot.id, { narrationKind })}
                options={NARRATION_KINDS.map((kind) => ({
                  value: kind,
                  label: NARRATION_LABEL[kind],
                  tone: kind === "dramatized" ? "drama" : kind === "from-facts" ? "ink" : "pending",
                }))}
              />
              <textarea
                value={shot.narration}
                placeholder={
                  shot.narrationKind === "dramatized"
                    ? "创作句。脚本稿里会标成「演绎 · 非事实」。"
                    : shot.narrationKind === "from-facts"
                      ? "只复述下面勾选的事实，不要另加没有来源的句子。"
                      : "草稿。还没决定它是事实还是演绎。"
                }
                onChange={(event) => update(shot.id, { narration: event.target.value })}
              />
              {shot.narrationKind === "dramatized" ? <p className="drama-caption">这是演绎，不是已确认事实。</p> : null}
              {shot.narrationKind === "from-facts" ? (
                <div className="fact-pick">
                  {facts.length === 0 ? <p className="hint">事实板还是空的。</p> : null}
                  {facts.map((fact) => {
                    const checked = shot.factIds.includes(fact.id);
                    return (
                      <label key={fact.id} className={`check-item fact-pick-item fact-pick-${fact.status}`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            const factIds = event.target.checked
                              ? [...shot.factIds, fact.id]
                              : shot.factIds.filter((id) => id !== fact.id);
                            update(shot.id, { factIds });
                          }}
                        />
                        <span>
                          <em>{fact.status === "dramatized" ? "演绎 · 非事实" : FACT_LABEL[fact.status]}</em>
                          {fact.text.trim() || "（这条还没写）"}
                        </span>
                      </label>
                    );
                  })}
                  {shot.narration.trim() && shot.factIds.length === 0 ? (
                    <p className="form-error">标了「依据事实」，还没有勾选事实。</p>
                  ) : null}
                  {shot.factIds.some((id) => facts.find((fact) => fact.id === id)?.status === "dramatized") ? (
                    <p className="drama-caption">勾选里有演绎句。旁白不能因此变成已确认事实。</p>
                  ) : null}
                  {shot.factIds.some((id) => facts.find((fact) => fact.id === id)?.status === "pending") ? (
                    <p className="hint">勾选里有待核内容。成片前需要核对。</p>
                  ) : null}
                </div>
              ) : null}
            </div>
            <label className="field">
              <span className="field-label">上屏文字</span>
              <input
                value={shot.onScreenText}
                placeholder="待核的内容不要上屏"
                onChange={(event) => update(shot.id, { onScreenText: event.target.value })}
              />
            </label>
          </article>
        ))}
      </div>
    </div>
  );
}
