"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ButtonVariant = React.ComponentProps<typeof Button>["variant"];
type ButtonSize = React.ComponentProps<typeof Button>["size"];

export function ConfirmActionDialog({
  trigger,
  triggerVariant = "default",
  triggerSize,
  triggerClassName,
  triggerDisabled,
  title,
  description,
  content,
  confirmLabel,
  confirmVariant = "default",
  isPending,
  onConfirm,
}: {
  trigger: ReactNode;
  triggerVariant?: ButtonVariant;
  triggerSize?: ButtonSize;
  triggerClassName?: string;
  triggerDisabled?: boolean;
  title: string;
  description: string;
  content?: ReactNode;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  isPending?: boolean;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={triggerVariant}
            size={triggerSize}
            className={triggerClassName}
            disabled={triggerDisabled}
          />
        }
      >
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {content}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button
            variant={confirmVariant}
            disabled={isPending}
            onClick={() => {
              onConfirm();
              setOpen(false);
            }}
          >
            {isPending ? "Working…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
