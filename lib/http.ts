import { NextResponse } from "next/server";
import { UserInputError } from "@/lib/validate";

export function jsonOk(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function jsonError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export function rejectCrossSite(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return null;
  const host = req.headers.get("host");
  try {
    if (!host || new URL(origin).host !== host) return jsonError("请求被拒绝", 403);
  } catch {
    return jsonError("请求被拒绝", 403);
  }
  return null;
}

export function toErrorResponse(error: unknown) {
  if (error instanceof UserInputError) return jsonError(error.message, error.message === "没有这个项目" ? 404 : 400);
  console.error(error);
  return jsonError("没有完成", 500);
}
