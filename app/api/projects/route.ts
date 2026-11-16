import { createProject, listProjects } from "@/lib/store";
import { jsonOk, rejectCrossSite, toErrorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const projects = await listProjects();
    return jsonOk({ projects });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(req: Request) {
  const rejected = rejectCrossSite(req);
  if (rejected) return rejected;
  try {
    const body = await req.json();
    const project = await createProject(body);
    return jsonOk({ project }, 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}
