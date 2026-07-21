import { z } from "zod";

export const listingCategories = [
  "Electronics",
  "Fashion",
  "Home & Furniture",
  "Vehicles",
  "Phones & Tablets",
  "Other",
] as const;

export const createListingSchema = z.object({
  title: z.string().min(3, "Title is too short").max(120),
  description: z.string().min(10, "Add a bit more detail").max(2000),
  priceNaira: z.coerce.number().positive("Enter a price above 0"),
  category: z.enum(listingCategories),
  imageUrls: z.array(z.url()).min(1, "Add at least one photo").max(6),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
