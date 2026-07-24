"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { updateProfileAction } from "./actions";
import { changePasswordAction } from "@/app/(auth)/actions";

export function ProfileForms({
  name: initialName,
  email,
  plan,
  verified,
  joined,
}: {
  name: string;
  email: string;
  plan: string;
  verified: boolean;
  joined: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [flash, setFlash] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [name, setName] = useState(initialName);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });

  const run = (fn: () => Promise<{ ok: boolean; message?: string; error?: string }>) => {
    setFlash(null);
    startTransition(async () => {
      const r = await fn();
      if (r.ok) {
        setFlash({ kind: "success", text: r.message ?? "Saved." });
        router.refresh();
      } else setFlash({ kind: "error", text: r.error ?? "Something went wrong." });
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">Profile</h1>
        <p className="mt-1 text-sm text-ink-secondary">Manage your account.</p>
      </div>

      {flash && (
        <Alert variant={flash.kind === "success" ? "success" : "error"}>{flash.text}</Alert>
      )}

      {/* Account summary */}
      <div className="card space-y-3 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-ink">{email}</div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-muted">
              {verified ? <Badge variant="enabled">Verified</Badge> : <Badge variant="disabled">Unverified</Badge>}
              {joined && (
                <span>
                  Joined{" "}
                  {new Date(joined).toLocaleDateString("en-US", {
                    month: "long", year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>
          <Badge variant={plan === "PREMIUM" ? "premium" : "neutral"}>
            {plan === "PREMIUM" ? "Premium" : "Free"}
          </Badge>
        </div>
      </div>

      {/* Name */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(() => updateProfileAction({ name }));
        }}
        className="card space-y-4 p-6"
      >
        <h2 className="font-semibold text-ink">Display name</h2>
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button type="submit" loading={pending}>Save name</Button>
        </div>
      </form>

      {/* Password */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            const r = await changePasswordAction(pw);
            if (r.ok) setPw({ currentPassword: "", newPassword: "" });
            return r;
          });
        }}
        className="card space-y-4 p-6"
      >
        <h2 className="font-semibold text-ink">Change password</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            value={pw.currentPassword}
            onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))}
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            hint="At least 8 characters with a letter and a number"
            value={pw.newPassword}
            onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))}
          />
        </div>
        <div className="flex justify-end border-t border-slate-100 pt-4">
          <Button type="submit" variant="secondary" loading={pending}>Update password</Button>
        </div>
      </form>
    </div>
  );
}
