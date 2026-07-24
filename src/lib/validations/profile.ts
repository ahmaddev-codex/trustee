import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Enter your full name").max(80),
  image: z.string().url().nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
