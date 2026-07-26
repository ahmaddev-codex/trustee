"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

import { TbLock } from "react-icons/tb";
import { FcGoogle } from "react-icons/fc";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { BrandLoader } from "@/components/brand-loader";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { zodResolver } from "@/lib/zod-resolver";

function LoginForm({ onRedirecting }: { onRedirecting: () => void }) {
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const linkEmail = searchParams.get("linkEmail");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: linkEmail ? { email: linkEmail } : undefined,
  });

  const onGoogleClick = () => {
    setGoogleLoading(true);
    onRedirecting();
    signIn("google", { callbackUrl: searchParams.get("callbackUrl") ?? "/dashboard" });
  };

  const onSubmit = async (values: LoginInput) => {
    setSubmitting(true);
    try {
      const result = await signIn("credentials", {
        ...values,
        confirmGoogleLink: linkEmail === values.email ? "true" : undefined,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password");
        return;
      }

      if (linkEmail === values.email) {
        toast.success("Google sign-in is now linked to this account.");
      }

      onRedirecting();
      // Hard navigation - router.push() can serve a stale pre-auth RSC
      // cache for the destination, leaving users stuck until a manual refresh.
      window.location.href = searchParams.get("callbackUrl") ?? "/dashboard";
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-4">
        {linkEmail && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            Enter the password for <span className="font-medium">{linkEmail}</span> to
            finish setting up Google sign-in for this account.
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={googleLoading}
          onClick={onGoogleClick}
        >
          <FcGoogle className="size-4" />
          {googleLoading ? "Redirecting…" : "Continue with Google"}
        </Button>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          or
          <div className="h-px flex-1 bg-border" />
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {linkEmail ? (
            <input type="hidden" {...register("email")} />
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
              >
                Forgot password?
              </Link>
            </div>
            <PasswordInput id="password" {...register("password")} />
            {errors.password && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Logging in…" : "Log in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  const [redirecting, setRedirecting] = useState(false);

  // Google sign-in navigates away, so a browser-back can restore this page
  // from bfcache with redirecting still frozen true - reset it on restore.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setRedirecting(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  if (redirecting) {
    return <BrandLoader message="Logging you in…" />;
  }

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
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">Welcome back</h1>
        </div>

        <Suspense fallback={null}>
          <LoginForm onRedirecting={() => setRedirecting(true)} />
        </Suspense>

        <div className="mt-4 flex items-center gap-2 border border-white/15 p-3 text-xs text-white/70">
          <TbLock className="size-4 shrink-0 text-lime" />
          Every purchase is protected by escrow - sellers only get paid once you confirm receipt.
        </div>
      </div>
    </div>
  );
}
