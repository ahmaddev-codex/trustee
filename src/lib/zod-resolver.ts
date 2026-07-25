import type { FieldErrors, FieldValues, Resolver } from "react-hook-form";
import type { z } from "zod";

// Minimal stand-in for @hookform/resolvers' zodResolver — avoids a hard
// dependency on its bundled zod-version type tagging, which lags zod's own releases.
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
