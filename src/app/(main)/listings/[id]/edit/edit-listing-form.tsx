"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { TbX } from "react-icons/tb";

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

const MAX_PHOTOS = 6;

export function EditListingForm({
  listing,
}: {
  listing: {
    id: string;
    title: string;
    description: string;
    priceNaira: number;
    category: string;
    imageUrls: string[];
  };
}) {
  const router = useRouter();
  const [existingUrls, setExistingUrls] = useState<string[]>(listing.imageUrls);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createListingSchema.omit({ imageUrls: true })),
    defaultValues: {
      title: listing.title,
      description: listing.description,
      priceNaira: listing.priceNaira,
      category: listing.category as FormValues["category"],
    },
  });

  const category = useWatch({ control, name: "category" });
  const totalPhotos = existingUrls.length + newFiles.length;

  const saveListing = useMutation({
    mutationFn: async (values: FormValues) => {
      if (totalPhotos === 0) {
        throw new Error("Add at least one photo");
      }

      let uploadedUrls: string[] = [];
      if (newFiles.length > 0) {
        const uploadForm = new FormData();
        newFiles.forEach((file) => uploadForm.append("files", file));
        const { urls } = await apiFetch<{ urls: string[] }>("/api/uploads", {
          method: "POST",
          body: uploadForm,
        });
        uploadedUrls = urls;
      }

      return apiFetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...values, imageUrls: [...existingUrls, ...uploadedUrls] }),
      });
    },
    onSuccess: () => {
      toast.success("Listing updated");
      router.push(`/listings/${listing.id}`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-xl">Listing details</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={handleSubmit((values) => saveListing.mutate(values))}
        >
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={4} {...register("description")} />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
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
                <p className="text-sm text-destructive">{errors.priceNaira.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(value) => setValue("category", value as FormValues["category"])}
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
            <Label htmlFor="photos">Photos (up to {MAX_PHOTOS})</Label>
            <Input
              id="photos"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              disabled={totalPhotos >= MAX_PHOTOS}
              onChange={(e) => {
                const selected = Array.from(e.target.files ?? []);
                const room = MAX_PHOTOS - totalPhotos;
                if (selected.length > room) {
                  toast.error(`Only ${room} more photo(s) can be added — ${MAX_PHOTOS} max per listing.`);
                }
                setNewFiles((prev) => [...prev, ...selected.slice(0, room)]);
                e.target.value = "";
              }}
            />
            <p className="text-xs text-muted-foreground">
              Remove a photo below, or add new ones.
            </p>
            {totalPhotos > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {existingUrls.map((url, i) => (
                  <div key={url} className="relative size-16 overflow-hidden rounded-md border">
                    <Image src={url} alt="" fill className="object-cover" unoptimized />
                    <button
                      type="button"
                      onClick={() => setExistingUrls((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background"
                      aria-label="Remove photo"
                    >
                      <TbX className="size-3" />
                    </button>
                  </div>
                ))}
                {newFiles.map((file, i) => (
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
                      onClick={() => setNewFiles((prev) => prev.filter((_, j) => j !== i))}
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

          <Button type="submit" className="w-full" disabled={saveListing.isPending}>
            {saveListing.isPending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
