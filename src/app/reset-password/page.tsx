"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { TbLock } from "react-icons/tb";

import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch, ApiError } from "@/lib/api";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";
import { zodResolver } from "@/lib/zod-resolver";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  const password = useWatch({ control, name: "password" }) ?? "";

  const onSubmit = async (values: ResetPasswordInput) => {
    setSubmitting(true);
    try {
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify(values),
      });
      toast.success("Password updated — log in with your new password");
      router.push("/login");
    } catch (error) {
      toast.error(
        error instanceof ApiError ? error.message : "Could not reset your password.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid link</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This reset link is missing its token.{" "}
            <Link href="/forgot-password" className="underline underline-offset-4">
              Request a new one
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" {...register("token")} />
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <PasswordInput id="password" {...register("password")} />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
            <PasswordStrengthMeter password={password} />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Updating…" : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-16">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 self-start font-display text-lg font-extrabold tracking-tight text-brand-deep dark:text-brand-bright"
      >
        <span className="size-2 rounded-full bg-lime" aria-hidden />
        Trustee
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Reset password</h1>
      </div>

      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>

      <div className="mt-4 flex items-center gap-2 border border-border p-3 text-xs text-muted-foreground">
        <TbLock className="size-4 shrink-0 text-brand" />
        Every purchase is protected by escrow — sellers only get paid once you confirm receipt.
      </div>
    </div>
  );
}
