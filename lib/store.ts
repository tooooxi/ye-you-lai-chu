import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { newId } from "@/lib/ids";
import type { Project, StoreFile } from "@/lib/types";
import {
  coerceProject,
  parseCreate,
  parsePatch,
  scrubShotFacts,
  UserInputError,
} from "@/lib/validate";

const dataDir = process.env.YYLC_DATA_DIR
  ? path.resolve(process.env.YYLC_DATA_DIR)
  : path.join(process.cwd(), "data");
const storeFile = path.join(dataDir, "store.json");

let chain: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readStore(): Promise<StoreFile> {
  try {
    const text = await fs.readFile(storeFile, "utf8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new UserInputError("数据文件无法读取，没有改动它。");
    }
    if (!isRecord(parsed) || !Array.isArray(parsed.projects)) {
      throw new UserInputError("数据文件无法读取，没有改动它。");
    }
    return {
      version: 1,
      projects: parsed.projects
        .map(coerceProject)
        .filter((project): project is Project => project !== null),
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return { version: 1, projects: [] };
    }
    throw error;
  }
}

async function writeStore(store: StoreFile) {
  await fs.mkdir(dataDir, { recursive: true });
  const tmp = `${storeFile}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tmp, storeFile);
}

function sortProjects(projects: Project[]): Project[] {
  return projects
    .slice()
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
}

export async function listProjects(): Promise<Project[]> {
  const store = await readStore();
  return sortProjects(store.projects);
}

export async function getProject(id: string): Promise<Project | null> {
  const store = await readStore();
  return store.projects.find((project) => project.id === id) ?? null;
}

export async function createProject(input: unknown): Promise<Project> {
  return withLock(async () => {
    const store = await readStore();
    const parsed = parseCreate(input);
    const now = new Date().toISOString();
    const project: Project = {
      id: newId(),
      ...parsed,
      createdAt: now,
      updatedAt: now,
    };
    scrubShotFacts(project);
    store.projects.push(project);
    await writeStore(store);
    return project;
  });
}

export async function updateProject(id: string, input: unknown): Promise<Project> {
  return withLock(async () => {
    const store = await readStore();
    const index = store.projects.findIndex((project) => project.id === id);
    if (index < 0) throw new UserInputError("没有这个项目");
    const patch = parsePatch(input);
    const project: Project = {
      ...store.projects[index],
      ...patch,
      id,
      createdAt: store.projects[index].createdAt,
      updatedAt: new Date().toISOString(),
    };
    scrubShotFacts(project);
    store.projects[index] = project;
    await writeStore(store);
    return project;
  });
}

export async function deleteProject(id: string): Promise<void> {
  return withLock(async () => {
    const store = await readStore();
    const next = store.projects.filter((project) => project.id !== id);
    if (next.length === store.projects.length) throw new UserInputError("没有这个项目");
    store.projects = next;
    await writeStore(store);
  });
}
