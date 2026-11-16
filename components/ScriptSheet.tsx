"use client";

import { Wordmark } from "@/components/Wordmark";
import { downloadText } from "@/lib/download";
import { scriptMarkdown } from "@/lib/document";
import { displayTitle, durationHint, formatClock, formatDate, safeFilename, totalDuration } from "@/lib/format";
import { FACT_LABEL, NARRATION_LABEL, PRODUCTION_NOTE, STATUS_LABEL, TEAM } from "@/lib/labels";
import type { Fact, Project, Shot } from "@/lib/types";
import { useProject } from "@/lib/useProject";

export function ScriptSheet({ projectId }: { projectId: string }) {
  const { project, error, missing } = useProject(projectId);
  if (missing) return null;
  if (error) return <p className="form-error">{error}</p>;
  if (!project) return <p className="muted">读取中…</p>;

  const seconds = totalDuration(project.shots);
  const dramatized =
    project.shots.some((shot) => shot.narrationKind === "dramatized") ||
    project.facts.some((fact) => fact.status === "dramatized");

  return (
    <div className="work work-wide">
      <div className="toolbar no-print">
        <button type="button" className="btn" onClick={() => window.print()}>
          打印
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => downloadText(`${safeFilename(project.workingTitle)}-分镜脚本.md`, scriptMarkdown(project))}
        >
          下载 Markdown
        </button>
      </div>
      <article className="sheet">
        <Wordmark />
        <p className="kicker sheet-kicker">内部工作稿 · 分镜脚本</p>
        <h1>{displayTitle(project.workingTitle)}</h1>
        {project.sampleInDevelopment ? <p className="badge">样片开发中</p> : null}
        <dl className="sheet-dl">
          <div>
            <dt>阶段</dt>
            <dd>{STATUS_LABEL[project.status]}</dd>
          </div>
          <div>
            <dt>对象</dt>
            <dd>{project.subject.trim() || "未填"}</dd>
          </div>
          <div>
            <dt>公司或人物</dt>
            <dd>{project.clientName.trim() || "未填"}</dd>
          </div>
          <div>
            <dt>用途</dt>
            <dd>{project.intendedUse.trim() || "未填"}</dd>
          </div>
          <div>
            <dt>合计</dt>
            <dd>
              {formatClock(seconds)} · {durationHint(seconds)}
            </dd>
          </div>
          <div>
            <dt>日期</dt>
            <dd>{formatDate(new Date())}</dd>
          </div>
        </dl>
        <p className={dramatized ? "drama-caption" : "hint"}>
          标注「演绎 · 非事实」的句子不是已确认事实。立项笔记也不是事实板。成片只采用事实板里已确认、且有来源的条目。
        </p>
        <Note title="立项笔记 · 已知" text={project.known} />
        <Note title="立项笔记 · 待核" text={project.toVerify} />
        {project.materials.some((item) => item.text.trim()) ? (
          <section className="sheet-block">
            <h2>手头材料</h2>
            <ul>
              {project.materials.filter((item) => item.text.trim()).map((item) => (
                <li key={item.id}>{item.text}</li>
              ))}
            </ul>
          </section>
        ) : null}
        <section className="sheet-block">
          <h2>分镜</h2>
          {project.shots.length === 0 ? <p className="hint">还没有分镜。</p> : null}
          {project.shots.map((shot, index) => (
            <ShotBlock key={shot.id} project={project} shot={shot} index={index} />
          ))}
        </section>
        <section className="sheet-block">
          <h2>事实附录</h2>
          <FactGroup title="已确认" facts={project.facts.filter((fact) => fact.status === "confirmed")} />
          <FactGroup title="待核" facts={project.facts.filter((fact) => fact.status === "pending")} />
          <FactGroup title="演绎 · 非事实" facts={project.facts.filter((fact) => fact.status === "dramatized")} dramatized />
        </section>
        <footer className="sheet-foot">
          <p>业有来处 · 非发行版本</p>
          <p>{TEAM.map((person) => `${person.name} ${person.role}`).join(" · ")}</p>
          <p>{PRODUCTION_NOTE}</p>
        </footer>
      </article>
    </div>
  );
}

function Note({ title, text }: { title: string; text: string }) {
  if (!text.trim()) return null;
  return (
    <section className="sheet-block">
      <h2>{title}</h2>
      <p className="pre">{text}</p>
    </section>
  );
}

function ShotBlock({ project, shot, index }: { project: Project; shot: Shot; index: number }) {
  const cited = shot.factIds.map((id) => project.facts.find((fact) => fact.id === id) ?? null);
  return (
    <section className="script-shot">
      <div className="shot-index">
        <strong>{String(index + 1).padStart(2, "0")}</strong>
        <span>{formatClock(shot.durationSec)}</span>
      </div>
      <div>
        {shot.title.trim() ? <h3>{shot.title}</h3> : null}
        <h4>画面 · 手绘动态影像</h4>
        <p className="pre">{shot.picture.trim() || "（空）"}</p>
        <h4>旁白 · {NARRATION_LABEL[shot.narrationKind]}</h4>
        <div className={shot.narrationKind === "dramatized" ? "line-drama" : shot.narrationKind === "draft" ? "line-draft" : "line-fact"}>
          <p className="pre">{shot.narration.trim() || "（空）"}</p>
        </div>
        {shot.narrationKind === "from-facts" ? (
          <div className="cited">
            {cited.length === 0 ? <p className="form-error">标了依据事实，但没有对上事实板。</p> : null}
            {cited.map((fact, factIndex) =>
              fact ? (
                <p key={fact.id} className={`fact-ref fact-ref-${fact.status}`}>
                  <strong>{fact.status === "dramatized" ? "演绎 · 非事实" : FACT_LABEL[fact.status]}</strong>
                  <span>{fact.text.trim() || "（空）"}</span>
                  {fact.source.trim() ? <small>来源：{fact.source}</small> : null}
                </p>
              ) : (
                <p key={`${shot.id}-missing-${factIndex}`} className="form-error">
                  所引事实已不在事实板上。
                </p>
              ),
            )}
          </div>
        ) : null}
        <h4>上屏</h4>
        <p className="pre">{shot.onScreenText.trim() || "（空）"}</p>
      </div>
    </section>
  );
}

function FactGroup({ title, facts, dramatized = false }: { title: string; facts: Fact[]; dramatized?: boolean }) {
  const filled = facts.filter((fact) => fact.text.trim());
  return (
    <div className={dramatized ? "appendix appendix-drama" : "appendix"}>
      <h3>{title}</h3>
      {filled.length === 0 ? <p className="hint">（无）</p> : null}
      {filled.map((fact) => (
        <p key={fact.id} className={dramatized ? "fact-ref fact-ref-dramatized" : `fact-ref fact-ref-${fact.status}`}>
          <span>{fact.text}</span>
          {fact.source.trim() ? <small>来源：{fact.source}</small> : <small>无来源</small>}
        </p>
      ))}
    </div>
  );
}
