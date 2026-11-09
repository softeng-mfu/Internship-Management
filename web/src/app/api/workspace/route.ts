import "server-only";
import { z } from "zod";
import { getAuth, getApplicationDatabase } from "@/lib/auth";
import { workspaceStore, type Actor } from "@/lib/workspace";
import { ApiError, json, failure, readBody } from "@/lib/core";
import { getPlacement } from "@/lib/placements-service";
import { placementsDatabase } from "@/lib/placements-db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function actor(request: Request) {
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session)
    throw new ApiError(401, "UNAUTHORIZED", "Sign in to your workspace.");
  if (
    request.method !== "GET" &&
    request.headers.get("origin") !==
      new URL(process.env.BETTER_AUTH_URL!).origin
  )
    throw new ApiError(403, "INVALID_ORIGIN", "Request origin is not allowed.");
  return session.user as Actor;
}
export async function GET(request: Request) {
  try {
    return json({
      success: true,
      data: await workspaceStore(getApplicationDatabase()).read(
        await actor(request),
      ),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const user = await actor(request),
      body = await readBody(request),
      store = workspaceStore(getApplicationDatabase());
    if (!body || typeof body !== "object" || Array.isArray(body))
      throw new ApiError(
        400,
        "INVALID_INPUT",
        "Use a JSON object for workspace actions.",
      );
    if (body.action === "apply") {
      const input = z
        .object({
          action: z.literal("apply"),
          placementId: z.string().uuid(),
          statement: z.string().trim().min(20).max(5000),
        })
        .strict()
        .safeParse(body);
      if (!input.success)
        throw new ApiError(
          400,
          "INVALID_APPLICATION",
          "Select an opportunity and write at least 20 characters.",
        );
      const response = await getPlacement(
        new Request(
          new URL("/api/placements/" + input.data.placementId, request.url),
        ),
        input.data.placementId,
        placementsDatabase,
      );
      const result = await response.json();
      if (!response.ok)
        throw new ApiError(
          404,
          "PLACEMENT_UNAVAILABLE",
          "This opportunity is not available.",
        );
      await store.apply(user, result.data, input.data.statement);
    } else await store.mutate(user, body);
    return json({ success: true });
  } catch (e) {
    return failure(e);
  }
}
