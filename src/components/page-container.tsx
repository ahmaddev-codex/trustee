import type { ElementType, ReactNode, HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

// Centralizes the app's standard page width/horizontal padding in one place.
// Vertical rhythm (py-*) stays per-page via className since it legitimately varies.
export function PageContainer({
  children,
  className,
  as: Component = "div",
  ...props
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
} & HTMLAttributes<HTMLElement>) {
  return (
    <Component className={cn("mx-auto max-w-6xl px-4", className)} {...props}>
      {children}
    </Component>
  );
}
