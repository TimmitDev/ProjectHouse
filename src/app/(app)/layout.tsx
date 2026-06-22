import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { getViewer } from "@/lib/data";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await getViewer();

  if (!viewer) redirect("/login");
  if (!viewer.household) redirect("/onboarding");

  return <AppShell viewer={viewer}>{children}</AppShell>;
}
