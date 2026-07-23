"use client";

import { useState, useTransition } from "react";
import { resendVerificationAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

export function ResendVerification() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await resendVerificationAction();
      if (result.ok) setMessage(result.message ?? "Verification email sent.");
      else setError(result.error);
    });
  };

  return (
    <div className="space-y-3">
      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="warning">{error}</Alert>}
      <Button variant="secondary" onClick={onClick} loading={pending}>
        Resend verification email
      </Button>
    </div>
  );
}
