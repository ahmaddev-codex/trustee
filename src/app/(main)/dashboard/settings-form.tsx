"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { TbCamera, TbSparkles, TbChevronDown, TbUser } from "react-icons/tb";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AvatarPicker } from "@/components/avatar-picker";
import { apiFetch } from "@/lib/api";
import { zodResolver } from "@/lib/zod-resolver";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/profile";

export function SettingsForm({
  name,
  email,
  image,
}: {
  name: string;
  email: string;
  image: string | null;
}) {
  const router = useRouter();
  const { update } = useSession();
  const fileRef = useRef<HTMLInputElement>(null);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name },
  });

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setSelectedAvatarUrl(null);
    setPendingFile(file);
    setPendingPreview(URL.createObjectURL(file));
    if (fileRef.current) fileRef.current.value = "";
  }

  function selectAvatar(url: string) {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
    setSelectedAvatarUrl(url);
  }

  function cancelPhotoChange() {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingFile(null);
    setPendingPreview(null);
    setSelectedAvatarUrl(null);
  }

  const saveProfile = useMutation({
    mutationFn: async (values: UpdateProfileInput) => {
      let newImage: string | undefined;
      if (pendingFile) {
        const formData = new FormData();
        formData.append("files", pendingFile);
        const { urls } = await apiFetch<{ urls: string[] }>("/api/uploads", {
          method: "POST",
          body: formData,
        });
        newImage = urls[0];
      } else if (selectedAvatarUrl) {
        newImage = selectedAvatarUrl;
      }

      return apiFetch<{ name: string; image: string | null }>("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ ...values, ...(newImage ? { image: newImage } : {}) }),
      });
    },
    onSuccess: async (data) => {
      await update({ name: data.name, image: data.image });
      setPendingFile(null);
      setPendingPreview(null);
      setSelectedAvatarUrl(null);
      setShowAvatarPicker(false);
      toast.success("Profile updated");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Could not update your profile");
    },
  });

  const displayedImage = pendingPreview ?? selectedAvatarUrl ?? image;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">Account settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={handleSubmit((values) => saveProfile.mutate(values))}
        >
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="group relative shrink-0 rounded-full"
              aria-label="Upload a profile photo"
            >
              <Avatar size="lg" className="size-16">
                {displayedImage && <AvatarImage src={displayedImage} alt={name} />}
                <AvatarFallback>
                  <TbUser className="size-1/2" />
                </AvatarFallback>
              </Avatar>
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors duration-200 group-hover:bg-black/40">
                <TbCamera className="size-5 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
              </span>
              <span
                className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full border-2 border-background bg-brand text-white"
                aria-hidden
              >
                <TbCamera className="size-3" />
              </span>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </button>

            <AnimatePresence mode="wait" initial={false}>
              {pendingPreview || selectedAvatarUrl ? (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-wrap items-center gap-2"
                >
                  <span className="text-xs font-medium text-brand">
                    {pendingPreview ? "New photo selected" : "New avatar selected"} — click Save
                    to apply
                  </span>
                  <button
                    type="button"
                    onClick={cancelPhotoChange}
                    className="text-xs text-muted-foreground underline hover:text-destructive"
                  >
                    Cancel
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="actions"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="flex flex-wrap items-center gap-2"
                >
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={saveProfile.isPending}
                  >
                    <TbCamera className="size-3.5" />
                    Upload photo
                  </Button>
                  <Button
                    type="button"
                    variant={showAvatarPicker ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowAvatarPicker((v) => !v)}
                    disabled={saveProfile.isPending}
                  >
                    <TbSparkles className="size-3.5" />
                    {showAvatarPicker ? "Hide avatars" : "Choose an avatar"}
                    <motion.span
                      animate={{ rotate: showAvatarPicker ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex"
                    >
                      <TbChevronDown className="size-3.5" />
                    </motion.span>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {showAvatarPicker && !pendingPreview && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                style={{ overflow: "hidden" }}
              >
                <AvatarPicker selectedUrl={selectedAvatarUrl} onSelect={selectAvatar} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="border-t" />

          <div className="space-y-1.5">
            <Label htmlFor="settings-name">Full name</Label>
            <Input id="settings-name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settings-email">Email</Label>
            <Input id="settings-email" value={email} disabled />
            <p className="text-xs text-muted-foreground">
              Contact support if you need your email updated.
            </p>
          </div>

          <Button type="submit" disabled={saveProfile.isPending}>
            {saveProfile.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
