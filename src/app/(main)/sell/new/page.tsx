"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { TbX, TbArrowLeft } from "react-icons/tb";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { zodResolver } from "@/lib/zod-resolver";
import {
  createListingSchema,
  listingCategories,
  type CreateListingInput,
} from "@/lib/validations/listing";

type FormValues = Omit<CreateListingInput, "imageUrls">;

export default function NewListingPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createListingSchema.omit({ imageUrls: true })),
    defaultValues: { category: "Other" },
  });

  const category = useWatch({ control, name: "category" });

  const createListing = useMutation({
    mutationFn: async (values: FormValues) => {
      if (files.length === 0) {
        throw new Error("Add at least one photo");
      }

      const uploadForm = new FormData();
      files.forEach((file) => uploadForm.append("files", file));

      const { urls } = await apiFetch<{ urls: string[] }>("/api/uploads", {
        method: "POST",
        body: uploadForm,
      });

      return apiFetch("/api/listings", {
        method: "POST",
        body: JSON.stringify({ ...values, imageUrls: urls }),
      });
    },
    onSuccess: () => {
      toast.success("Listing published");
      router.push("/dashboard");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <TbArrowLeft className="size-4" />
        Back to Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          List something for sale
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Listing details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={handleSubmit((values) => createListing.mutate(values))}
          >
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="iPhone 13 Pro, 128GB" {...register("title")} />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="Condition, why you're selling, anything a buyer should know"
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="priceNaira">Price (NGN)</Label>
                <Input
                  id="priceNaira"
                  type="number"
                  min={0}
                  step="0.01"
                  {...register("priceNaira")}
                />
                {errors.priceNaira ? (
                  <p className="text-sm text-destructive">
                    {errors.priceNaira.message}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    A small platform fee is deducted from your payout at release.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={category}
                  onValueChange={(value) =>
                    setValue("category", value as FormValues["category"])
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {listingCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="photos">Photos (up to 6)</Label>
              <Input
                id="photos"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={(e) => {
                  const selected = Array.from(e.target.files ?? []);
                  if (selected.length > 6) {
                    toast.error("Only the first 6 photos were kept — that's the max per listing.");
                  }
                  setFiles(selected.slice(0, 6));
                }}
              />
              <p className="text-xs text-muted-foreground">
                Clear, well-lit photos build buyer trust.
              </p>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {files.map((file, i) => (
                    <div key={i} className="relative size-16 overflow-hidden rounded-md border">
                      <Image
                        src={URL.createObjectURL(file)}
                        alt=""
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                        className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background"
                        aria-label="Remove photo"
                      >
                        <TbX className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={createListing.isPending}>
              {createListing.isPending ? "Publishing…" : "Publish listing"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
