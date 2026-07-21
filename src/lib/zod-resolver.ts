import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";
import type { z } from "zod";

// Minimal stand-in for @hookform/resolvers' zodResolver. Avoids a hard
// dependency on that package's bundled zod-version type tagging, which lags
// behind zod's own release cadence and breaks type-checking across minor
// zod versions.
export function zodResolver<T extends FieldValues>(
  schema: z.ZodType<T>,
): Resolver<T> {
  return async (values) => {
    const result = schema.safeParse(values);

    if (result.success) {
      return { values: result.data, errors: {} };
    }

    const errors: Record<string, { type: string; message: string }> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join(".");
      if (!errors[path]) {
        errors[path] = { type: issue.code, message: issue.message };
      }
    }

    return { values: {}, errors: errors as FieldErrors<T> };
  };
}
