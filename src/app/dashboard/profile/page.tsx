import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import { ProfileForms } from "./profile-forms";

export const metadata: Metadata = {
  title: "Profile & Security Settings | AI Vision Audit",
  description: "Manage your profile, password, 2-step verification, and account security.",
};

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const record = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      plan: true,
      role: true,
      createdAt: true,
      emailVerifiedAt: true,
      auditEmailsEnabled: true,
      marketingConsent: true,
      lastLoginAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-4xl py-2 sm:py-4">
      <ProfileForms
        name={record?.name ?? ""}
        email={record?.email ?? ""}
        plan={record?.plan ?? "FREE"}
        role={record?.role ?? "USER"}
        verified={record?.emailVerifiedAt !== null}
        joined={record?.createdAt?.toISOString() ?? null}
        lastLogin={record?.lastLoginAt?.toISOString() ?? null}
        auditEmails={record?.auditEmailsEnabled ?? true}
        marketingConsent={record?.marketingConsent ?? false}
      />
    </div>
  );
}
