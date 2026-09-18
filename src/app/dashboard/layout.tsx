import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/rbac";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopBar } from "@/components/dashboard/top-bar";
import { AuthSessionProvider } from "@/components/providers/session-provider";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · AuditFlow" },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <AuthSessionProvider>
      <div className="flex min-h-screen">
        <DashboardSidebar
          email={user.email ?? ""}
          name={user.name ?? null}
          plan={user.plan}
        />
        <div className="min-w-0 flex-1 bg-surface-subtle">
          <DashboardTopBar
            email={user.email ?? ""}
            name={user.name ?? null}
            plan={user.plan}
          />
          <main className="mx-auto max-w-5xl px-4 py-8 sm:px-8">{children}</main>
        </div>
      </div>
    </AuthSessionProvider>
  );
}
