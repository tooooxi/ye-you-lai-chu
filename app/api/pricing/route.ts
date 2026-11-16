import { jsonOk, toErrorResponse } from "@/lib/http";
import { loadPricing } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    return jsonOk(await loadPricing());
  } catch (error) {
    return toErrorResponse(error);
  }
}
