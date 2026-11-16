"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { displayTitle, durationHint, formatClock, formatStamp, totalDuration } from "@/lib/format";
import { FACT_LABEL, STATUS_LABEL } from "@/lib/labels";
import type { FactStatus, Project } from "@/lib/types";

export function ProjectList() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<{ projects: Project[] }>("/api/projects")
      .then((data) => setProjects(data.projects))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "读取失败"));
  }, []);

  return (
    <div className="work">
      <header className="page-head">
        <p className="kicker">内部工作台</p>
        <h1>项目</h1>
        <p className="lede">
          先分开已知和待核，再把事实、分镜和报价留在这台电脑上。画面按手绘动态影像来写，不使用写实人脸。
        </p>
      </header>
      <div className="row-actions">
        <Link href="/projects/new" className="btn">
          新建项目
        </Link>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {projects === null && !error ? <p className="muted">读取中…</p> : null}
      {projects && projects.length === 0 ? (
        <p className="empty">还没有项目。从一个立项开始。</p>
      ) : null}
      <div className="project-list">
        {projects?.map((project) => {
          const counts = countFacts(project);
          const seconds = totalDuration(project.shots);
          return (
            <Link key={project.id} href={`/projects/${project.id}`} className="project-row">
              <span>
                <span className="project-row-title">
                  {displayTitle(project.workingTitle)}
                  {project.sampleInDevelopment ? <em className="badge">样片开发中</em> : null}
                </span>
                <span className="project-row-meta">
                  {project.subject.trim() || "对象未填"}
                  {project.clientName.trim() ? ` · ${project.clientName.trim()}` : ""}
                  {project.intendedUse.trim() ? ` · ${project.intendedUse.trim()}` : ""}
                </span>
                <span className="project-row-count">
                  {FACT_LABEL.confirmed} {counts.confirmed} · {FACT_LABEL.pending} {counts.pending} · {FACT_LABEL.dramatized}{" "}
                  {counts.dramatized} · {project.shots.length} 镜 · {formatClock(seconds)}
                  {seconds > 0 ? ` · ${durationHint(seconds)}` : ""}
                </span>
              </span>
              <span className="project-row-side">
                <span>{STATUS_LABEL[project.status]}</span>
                <small>{formatStamp(project.updatedAt)}</small>
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function countFacts(project: Project): Record<FactStatus, number> {
  return {
    confirmed: project.facts.filter((fact) => fact.status === "confirmed").length,
    pending: project.facts.filter((fact) => fact.status === "pending").length,
    dramatized: project.facts.filter((fact) => fact.status === "dramatized").length,
  };
}
