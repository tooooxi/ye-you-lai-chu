"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { StatusRail } from "@/components/StatusRail";
import { api } from "@/lib/api";
import { notifyProjectUpdated } from "@/lib/events";
import { displayTitle, formatStamp } from "@/lib/format";
import type { Project, ProjectStatus } from "@/lib/types";

export function ProjectFrame({ projectId, children }: { projectId: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [project, setProject] = useState<Project | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api<{ project: Project }>(`/api/projects/${projectId}`)
      .then((data) => {
        setProject(data.project);
        setMissing(false);
        setError("");
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "读取失败";
        if (message.includes("没有这个项目")) setMissing(true);
        else setError(message);
      });
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const refresh = () => load();
    window.addEventListener("yylc:project-updated", refresh);
    return () => window.removeEventListener("yylc:project-updated", refresh);
  }, [load]);

  async function changeStatus(status: ProjectStatus) {
    if (!project || project.status === status) return;
    const previous = project.status;
    setProject({ ...project, status });
    try {
      const data = await api<{ project: Project }>(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setProject(data.project);
      notifyProjectUpdated();
    } catch (err) {
      setProject((current) => (current ? { ...current, status: previous } : current));
      setError(err instanceof Error ? err.message : "阶段没有改成");
    }
  }

  if (missing) {
    return (
      <div className="work">
        <h1>没有这个项目</h1>
        <p>
          <Link href="/">回到项目列表</Link>
        </p>
      </div>
    );
  }

  const tabs = [
    { href: `/projects/${projectId}`, label: "立项" },
    { href: `/projects/${projectId}/facts`, label: "事实板" },
    { href: `/projects/${projectId}/storyboard`, label: "分镜" },
    { href: `/projects/${projectId}/quote`, label: "报价" },
    { href: `/projects/${projectId}/script`, label: "脚本稿" },
  ];

  const openRights =
    project?.checklist.filter((item) => item.group === "rights" && !item.done).length ?? 0;

  return (
    <div className="frame">
      <header className="frame-head no-print">
        {!project && !error ? <p className="muted">读取中…</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
        {project ? (
          <>
            <div className="frame-title-row">
              <div>
                <h1>{displayTitle(project.workingTitle)}</h1>
                <p className="meta">
                  {project.subject.trim() || "对象未填"}
                  {project.clientName.trim() ? ` · ${project.clientName.trim()}` : ""}
                  {project.intendedUse.trim() ? ` · ${project.intendedUse.trim()}` : ""}
                  {` · 更新于 ${formatStamp(project.updatedAt)}`}
                </p>
              </div>
              {project.sampleInDevelopment ? <span className="badge">样片开发中</span> : null}
            </div>
            {project.sampleInDevelopment ? (
              <p className="note">样片开发中。这里没有预填生平。没有来源的内容不要标成已确认。</p>
            ) : null}
            <StatusRail status={project.status} onChange={(status) => void changeStatus(status)} />
            <p className="hint">阶段只标记进度。权利和审片以清单为准。</p>
            {(project.status === "sample" || project.status === "deliver") && openRights > 0 ? (
              <p className="note">权利清单还有 {openRights} 项没勾。样片和交付前请核对。</p>
            ) : null}
          </>
        ) : null}
        <nav className="tabs" aria-label="项目分区">
          {tabs.map((tab) => {
            const active = tab.href === `/projects/${projectId}` ? pathname === tab.href : pathname.startsWith(tab.href);
            return (
              <Link key={tab.href} href={tab.href} className={active ? "is-active" : undefined} aria-current={active ? "page" : undefined}>
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="frame-body">{children}</div>
    </div>
  );
}
