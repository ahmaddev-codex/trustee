"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { TbLock, TbMailCheck } from "react-icons/tb";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";
import { zodResolver } from "@/lib/zod-resolver";

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordInput) => {
    setSubmitting(true);
    try {
      await apiFetch("/api/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[var(--brand-deep)] px-4 py-16 text-white">
      <div className="mx-auto flex w-full max-w-sm flex-col">
        <Link href="/" className="mb-8 self-center">
          <Image
            src="/trustee-logo-full-dark.svg"
            alt="Trustee"
            width={147}
            height={30}
            priority
          />
        </Link>

        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">
            Forgot password
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{sent ? "Check your email" : "Reset your password"}</CardTitle>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <TbMailCheck className="size-8 text-brand" />
                <p className="text-sm text-muted-foreground">
                  If an account exists for that email, we&apos;ve sent a link to reset your
                  password. It expires in an hour.
                </p>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register("email")} />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Sending…" : "Send reset link"}
                </Button>
              </form>
            )}

            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link href="/login" className="underline underline-offset-4">
                Back to log in
              </Link>
            </p>
          </CardContent>
        </Card>

        <div className="mt-4 flex items-center gap-2 border border-white/15 p-3 text-xs text-white/70">
          <TbLock className="size-4 shrink-0 text-lime" />
          Every purchase is protected by escrow — sellers only get paid once you confirm receipt.
        </div>
      </div>
    </div>
  );
}
