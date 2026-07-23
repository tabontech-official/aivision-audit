import type { Metadata } from "next";
import { requireMasterAdmin } from "@/lib/auth/rbac";
import { AdminSidebar } from "@/components/admin/sidebar";

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
      <AdminSidebar adminEmail={admin.email ?? ""} />
      <div className="min-w-0 flex-1 bg-surface-subtle">
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
