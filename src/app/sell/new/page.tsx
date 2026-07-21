"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createListingSchema.omit({ imageUrls: true })),
    defaultValues: { category: "Other" },
  });

  const category = watch("category");

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
    <div className="mx-auto max-w-xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">
            List something for sale
          </CardTitle>
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
                {errors.priceNaira && (
                  <p className="text-sm text-destructive">
                    {errors.priceNaira.message}
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
                onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 6))}
              />
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {files.map((file, i) => (
                    <img
                      key={i}
                      src={URL.createObjectURL(file)}
                      alt=""
                      className="size-16 rounded-md border object-cover"
                    />
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
