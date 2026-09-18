import type { Metadata } from "next";
import { requireMasterAdmin } from "@/lib/auth/rbac";
import { AdminSidebar } from "@/components/admin/sidebar";
import { DashboardTopBar } from "@/components/dashboard/top-bar";
import { isDevToolsEnabled } from "@/lib/dev/tools";

export const metadata: Metadata = {
  title: { default: "Master Admin", template: "%s · Admin · AuditFlow" },
};

export default async function MasterAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireMasterAdmin();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar adminEmail={admin.email ?? ""} showDevTools={isDevToolsEnabled()} />
      <div className="min-w-0 flex-1 bg-surface-subtle">
        <DashboardTopBar
          email={admin.email ?? ""}
          name={admin.name ?? null}
          roleLabel="Master Admin"
        />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
