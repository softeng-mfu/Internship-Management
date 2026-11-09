import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import Portal from "../portal";
export const dynamic = "force-dynamic";
export default async function WorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; apply?: string }>;
}) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  const params = await searchParams;
  if (!session) {
    const query = new URLSearchParams();
    if (params.tab) query.set("tab", params.tab);
    if (params.apply) query.set("apply", params.apply);
    redirect(
      "/sign-in?next=" +
        encodeURIComponent("/workspace" + (query.size ? "?" + query : "")),
    );
  }
  if (session.user.role === "advisor" || session.user.role === "admin")
    redirect("/advisor");
  const tabs: Record<string, string> = {
    overview: "Overview",
    opportunities: "Opportunities",
    applications: "Applications",
    reports: "Progress reports",
    integrations: "Integrations",
  };
  return (
    <Portal
      initialRole={session.user.role}
      initialTab={tabs[params.tab || ""] || "Overview"}
      initialPlacement={params.apply}
    />
  );
}
