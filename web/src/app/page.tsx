import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import PublicCatalogue from "./public-catalogue";
export const dynamic = "force-dynamic";
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (session) {
    const { view } = await searchParams;
    const legacy: Record<string, string> = {
      Opportunities: "opportunities",
      "Saved opportunities": "opportunities",
      "My applications": "applications",
      "Progress reports": "reports",
      "Integration activity": "integrations",
      "Student identity": "integrations",
    };
    const target =
      session.user.role === "advisor" || session.user.role === "admin"
        ? "/advisor"
        : "/workspace";
    redirect(target + (view && legacy[view] ? `?tab=${legacy[view]}` : ""));
  }
  return <PublicCatalogue />;
}
