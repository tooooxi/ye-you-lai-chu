"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Wordmark } from "@/components/Wordmark";
import { api } from "@/lib/api";
import { displayTitle } from "@/lib/format";
import { PRODUCTION_NOTE, STATUS_LABEL, TEAM } from "@/lib/labels";
import type { Project } from "@/lib/types";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [projects, setProjects] = useState<Project[]>([]);

  const load = useCallback(() => {
    api<{ projects: Project[] }>("/api/projects")
      .then((data) => setProjects(data.projects))
      .catch(() => setProjects([]));
  }, []);

  useEffect(() => {
    load();
  }, [load, pathname]);

  useEffect(() => {
    const refresh = () => load();
    window.addEventListener("yylc:project-updated", refresh);
    window.addEventListener("yylc:projects-changed", refresh);
    return () => {
      window.removeEventListener("yylc:project-updated", refresh);
      window.removeEventListener("yylc:projects-changed", refresh);
    };
  }, [load]);

  const activeId = pathname.match(/^\/projects\/([^/]+)/)?.[1];

  return (
    <div className="shell">
      <aside className="sidebar no-print">
        <div className="brand">
          <Link href="/" className="brand-link" aria-label="回到项目列表">
            <Wordmark />
          </Link>
          <p className="brand-en">YE YOU LAI CHU</p>
        </div>
        <div className="side-head">
          <span>项目</span>
          <Link href="/projects/new" className="btn btn-ghost btn-small">
            新建
          </Link>
        </div>
        <nav className="side-projects" aria-label="项目">
          {projects.length === 0 ? <p className="side-empty">还没有项目</p> : null}
          {projects.map((project) => {
            const href = `/projects/${project.id}`;
            const active = activeId === project.id;
            return (
              <Link key={project.id} href={href} className={active ? "side-link is-active" : "side-link"} aria-current={active ? "page" : undefined}>
                <span className="side-title">{displayTitle(project.workingTitle)}</span>
                <small>
                  {STATUS_LABEL[project.status]}
                  {project.sampleInDevelopment ? " · 样片开发中" : ""}
                </small>
              </Link>
            );
          })}
        </nav>
        <footer className="side-foot">
          {TEAM.map((person) => (
            <p key={person.name}>
              <strong>{person.name}</strong>
              <span>{person.role}</span>
            </p>
          ))}
          <p className="side-note">{PRODUCTION_NOTE}</p>
        </footer>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
