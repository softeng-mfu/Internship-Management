import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@/lib/auth";
import Portal from "../portal";
export const dynamic = "force-dynamic";
export default async function AdvisorPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  if (!["advisor", "admin"].includes(session.user.role)) redirect("/workspace");
  const params = await searchParams;
  const tabs: Record<string, string> = {
    overview: "Overview",
    students: "Students",
    opportunities: "Opportunities",
    applications: "Applications",
    reports: "Progress reports",
    integrations: "Integrations",
  };
  return (
    <Portal
      initialRole={session.user.role}
      initialTab={tabs[params.tab || ""] || "Overview"}
    />
  );
}
