"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { passwordSchema } from "@/lib/validation/auth";
import { resetPasswordAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

const formSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormInput = z.infer<typeof formSchema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput>({ resolver: zodResolver(formSchema) });

  const onSubmit = (data: FormInput) => {
    setError(null);
    startTransition(async () => {
      const result = await resetPasswordAction({ token, password: data.password });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(result.message ?? "Password updated.");
      setTimeout(() => router.push(result.redirectTo ?? "/login"), 1500);
    });
  };

  if (success) {
    return <Alert variant="success">{success} Redirecting to log in…</Alert>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {error && <Alert variant="error">{error}</Alert>}
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        hint="Use at least 8 characters with a letter and a number."
        error={errors.password?.message}
        {...register("password")}
      />
      <Input
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        placeholder="Repeat your new password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <Button type="submit" className="w-full" size="lg" loading={pending}>
        Update password
      </Button>
    </form>
  );
}
