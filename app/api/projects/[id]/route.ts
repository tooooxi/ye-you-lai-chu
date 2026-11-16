import { deleteProject, getProject, updateProject } from "@/lib/store";
import { jsonError, jsonOk, rejectCrossSite, toErrorResponse } from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_req: Request, context: Context) {
  try {
    const { id } = await context.params;
    const project = await getProject(id);
    if (!project) return jsonError("没有这个项目", 404);
    return jsonOk({ project });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(req: Request, context: Context) {
  const rejected = rejectCrossSite(req);
  if (rejected) return rejected;
  try {
    const { id } = await context.params;
    const body = await req.json();
    const project = await updateProject(id, body);
    return jsonOk({ project });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(req: Request, context: Context) {
  const rejected = rejectCrossSite(req);
  if (rejected) return rejected;
  try {
    const { id } = await context.params;
    await deleteProject(id);
    return jsonOk({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
