"use client";

import { getPasswordStrength } from "@/lib/password-strength";
import { cn } from "@/lib/utils";

const barColor = ["bg-destructive", "bg-destructive", "bg-sand", "bg-cyan", "bg-lime"];
const labelColor = ["text-destructive", "text-destructive", "text-muted-foreground", "text-muted-foreground", "text-brand"];

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;

  const { score, label } = getPasswordStrength(password);

  return (
    <div className="space-y-1.5 pt-0.5">
      <div className="flex gap-1" role="meter" aria-valuenow={score} aria-valuemin={0} aria-valuemax={4} aria-label="Password strength">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn("h-1 flex-1 rounded-full bg-muted transition-colors", i < score && barColor[score])}
          />
        ))}
      </div>
      <p className={cn("text-xs", labelColor[score])}>{label}</p>
    </div>
  );
}
