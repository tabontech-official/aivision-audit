import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/rbac";
import { logoutAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * Placeholder dashboard — replaced by the full user dashboard in Phase 7.
 * Exists now so protected routing, session claims, and logout are testable.
 */
export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-16">
      <h1 className="text-2xl font-bold tracking-tight text-ink">
        Welcome{user.name ? `, ${user.name}` : ""}
      </h1>
      {!user.isEmailVerified && (
        <Alert variant="warning">
          Your email is not verified yet. Check your inbox — audits are limited until you
          verify.
        </Alert>
      )}
      <div className="card space-y-2 p-6 text-sm">
        <p>
          <span className="font-medium">Email:</span> {user.email}
        </p>
        <p>
          <span className="font-medium">Plan:</span> {user.plan}
        </p>
        <p>
          <span className="font-medium">Role:</span> {user.role}
        </p>
      </div>
      <p className="text-sm text-ink-muted">
        The full dashboard (reports, websites, billing) arrives in Phase 7.
      </p>
      <form action={logoutAction}>
        <Button variant="secondary" type="submit">
          Log out
        </Button>
      </form>
    </main>
  );
}
