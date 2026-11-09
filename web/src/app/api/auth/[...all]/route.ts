import "server-only";
import { getAuth } from "@/lib/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(request: Request) {
  try {
    const response = await getAuth().handler(request);
    response.headers.set("Cache-Control", "no-store, private");
    return response;
  }
  catch (error) {
    console.error("Authentication initialization failed:", error instanceof Error ? error.name : "Unknown error");
    return Response.json({ error: { message: "Authentication is temporarily unavailable." } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
export const GET = handle;
export const POST = handle;
