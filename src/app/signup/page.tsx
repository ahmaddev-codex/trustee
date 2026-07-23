"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

import { TbLock, TbRosetteDiscountCheck } from "react-icons/tb";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrengthMeter } from "@/components/ui/password-strength-meter";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { zodResolver } from "@/lib/zod-resolver";

function celebrate() {
  confetti({
    particleCount: 120,
    spread: 75,
    origin: { y: 0.6 },
    colors: ["#4334d3", "#7147f6", "#e1ef9a", "#90eaf2"],
  });
}

export default function SignupPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SignupInput>({ resolver: zodResolver(signupSchema) });

  const password = useWatch({ control, name: "password" }) ?? "";

  const onSubmit = async (values: SignupInput) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(body?.error ?? "Could not create account");
        return;
      }

      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Account created — please log in");
        router.push("/login");
        return;
      }

      router.refresh();
      setWelcomeOpen(true);
      celebrate();
    } catch (error) {
      console.error("Signup failed:", error);
      toast.error("Could not create account. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const goTo = (path: string) => {
    setWelcomeOpen(false);
    router.push(path);
  };

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
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Create your account</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sign up</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" {...register("password")} />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
              <PasswordStrengthMeter password={password} />
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Creating account…" : "Sign up"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="underline underline-offset-4">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center gap-2 border border-border p-3 text-xs text-muted-foreground">
        <TbLock className="size-4 shrink-0 text-brand" />
        Every purchase is protected by escrow — sellers only get paid once you confirm receipt.
      </div>

      <Dialog open={welcomeOpen} onOpenChange={(open) => !open && goTo("/dashboard")}>
        <DialogContent>
          <DialogHeader>
            <TbRosetteDiscountCheck className="mb-1 size-8 text-brand" />
            <DialogTitle className="font-display text-xl">
              You&apos;re successfully registered!
            </DialogTitle>
            <DialogDescription>
              Your account is ready to go. What would you like to do first?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={() => goTo("/sell/new")}>Start listing products</Button>
            <Button variant="outline" onClick={() => goTo("/dashboard?tab=payout")}>
              Connect payout details
            </Button>
            <Button variant="ghost" onClick={() => goTo("/dashboard")}>
              I&apos;ll do this later — take me to my dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
