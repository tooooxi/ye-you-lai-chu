"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";

export function useProject(id: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancel = false;
    setProject(null);
    setMissing(false);
    setError("");
    api<{ project: Project }>(`/api/projects/${id}`)
      .then((data) => {
        if (!cancel) setProject(data.project);
      })
      .catch((err: unknown) => {
        if (cancel) return;
        const message = err instanceof Error ? err.message : "读取失败";
        if (message.includes("没有这个项目")) setMissing(true);
        else setError(message);
      });
    return () => {
      cancel = true;
    };
  }, [id]);

  return { project, error, missing };
}
