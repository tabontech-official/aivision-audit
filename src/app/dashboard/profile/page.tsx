import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/rbac";
import { db } from "@/lib/db/client";
import { ProfileForms } from "./profile-forms";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const record = await db.user.findUnique({
    where: { id: user.id },
    select: { name: true, email: true, plan: true, createdAt: true, emailVerifiedAt: true },
  });

  return (
    <ProfileForms
      name={record?.name ?? ""}
      email={record?.email ?? ""}
      plan={record?.plan ?? "FREE"}
      verified={record?.emailVerifiedAt !== null}
      joined={record?.createdAt?.toISOString() ?? null}
    />
  );
}
