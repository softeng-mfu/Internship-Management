import { listPlacements, placementOptions } from "@/lib/placements-service";
import { placementsDatabase } from "@/lib/placements-db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET(request: Request) {
  return listPlacements(request, placementsDatabase);
}
export const OPTIONS = placementOptions;
