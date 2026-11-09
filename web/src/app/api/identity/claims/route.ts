import "server-only";
import { identityClaims } from "@/lib/identity";
import { requireAccount } from "@/lib/admin-access";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function POST(request: Request) {
  return identityClaims(request, fetch, requireAccount);
}
