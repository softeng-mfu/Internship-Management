import { getPlacement, placementOptions } from "@/lib/placements-service";
import { placementsDatabase } from "@/lib/placements-db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return getPlacement(request, (await context.params).id, placementsDatabase);
}
export const OPTIONS = placementOptions;
