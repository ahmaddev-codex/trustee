"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { zodResolver } from "@/lib/zod-resolver";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/profile";

export function SettingsForm({ name, email }: { name: string; email: string }) {
  const router = useRouter();
  const { update } = useSession();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name },
  });

  const saveName = useMutation({
    mutationFn: (values: UpdateProfileInput) =>
      apiFetch<{ name: string }>("/api/profile", {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: async (data) => {
      await update({ name: data.name });
      toast.success("Name updated");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not update your name");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">Account settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={handleSubmit((values) => saveName.mutate(values))}
        >
          <div className="space-y-1.5">
            <Label htmlFor="settings-name">Full name</Label>
            <Input id="settings-name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settings-email">Email</Label>
            <Input id="settings-email" value={email} disabled />
            <p className="text-xs text-muted-foreground">
              Email can&apos;t be changed here — contact support if you need it updated.
            </p>
          </div>

          <Button type="submit" disabled={saveName.isPending}>
            {saveName.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
