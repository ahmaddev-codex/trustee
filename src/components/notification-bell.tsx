"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  TbBell,
  TbReceiptFilled,
  TbTruckFilled,
  TbClockFilled,
  TbAlertTriangleFilled,
  TbScaleFilled,
  TbTrashFilled,
  TbCircleCheckFilled,
} from "react-icons/tb";
import type { IconType } from "react-icons";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiFetch } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
};

// Maps each Notification.type to an icon + color that reads as the same
// "at a glance" signal as the equivalent toast (success/warning/pending/etc.)
const NOTIFICATION_ICONS: Record<string, { icon: IconType; className: string }> = {
  ORDER_FUNDED: { icon: TbReceiptFilled, className: "text-green-600 dark:text-green-400" },
  ORDER_SHIPPED: { icon: TbTruckFilled, className: "text-cyan-600 dark:text-cyan" },
  PAYOUT_RELEASED: { icon: TbReceiptFilled, className: "text-green-600 dark:text-green-400" },
  PAYOUT_PENDING: { icon: TbClockFilled, className: "text-amber-500" },
  PAYOUT_NEEDS_AUTH: { icon: TbAlertTriangleFilled, className: "text-amber-500" },
  REFUND_ISSUED: { icon: TbReceiptFilled, className: "text-green-600 dark:text-green-400" },
  REFUND_PENDING: { icon: TbClockFilled, className: "text-amber-500" },
  REFUND_NEEDS_AUTH: { icon: TbAlertTriangleFilled, className: "text-amber-500" },
  DISPUTE_RAISED: { icon: TbScaleFilled, className: "text-destructive" },
  DISPUTE_RESOLVED: { icon: TbCircleCheckFilled, className: "text-green-600 dark:text-green-400" },
  DISPUTE_RESOLUTION_PENDING: { icon: TbClockFilled, className: "text-amber-500" },
  DISPUTE_RESOLUTION_NEEDS_AUTH: { icon: TbAlertTriangleFilled, className: "text-amber-500" },
  LISTING_FLAGGED: { icon: TbAlertTriangleFilled, className: "text-amber-500" },
  LISTING_REMOVED: { icon: TbTrashFilled, className: "text-destructive" },
  LISTING_CLEARED: { icon: TbCircleCheckFilled, className: "text-green-600 dark:text-green-400" },
};

// Notification.body uses a lightweight **bold** convention (see
// src/lib/notifications.ts callers) instead of quoting item names - this
// renders those segments as real <strong> text.
function renderBody(body: string) {
  return body.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export function NotificationBell() {
  const router = useRouter();
  const { status } = useSession();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: queryKeys.notifications.all(),
    queryFn: () =>
      apiFetch<{ notifications: Notification[]; unreadCount: number }>("/api/notifications"),
    enabled: status === "authenticated",
    refetchInterval: 30_000,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update notification"),
  });

  const markAllRead = useMutation({
    mutationFn: () => apiFetch("/api/notifications/read-all", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all() }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not mark notifications as read"),
  });

  if (status !== "authenticated") return null;

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" className="relative" />}>
        <TbBell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-1.5 py-1">
          <p className="text-xs font-medium text-muted-foreground">Notifications</p>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <p className="px-1.5 py-4 text-center text-sm text-muted-foreground">
            No notifications yet.
          </p>
        ) : (
          notifications.map((n) => {
            const iconConfig = NOTIFICATION_ICONS[n.type];
            const Icon = iconConfig?.icon;
            return (
              <DropdownMenuItem
                key={n.id}
                className="items-start gap-2 whitespace-normal"
                onClick={() => {
                  if (!n.read) markRead.mutate(n.id);
                  if (n.link) router.push(n.link);
                }}
              >
                {Icon && <Icon className={`size-4 shrink-0 translate-y-0.5 ${iconConfig.className}`} />}
                <div className="flex flex-col gap-0.5">
                  <span
                    className={`text-sm ${n.read ? "font-normal text-muted-foreground" : "font-medium"}`}
                  >
                    {n.title}
                  </span>
                  <span className="text-xs text-muted-foreground">{renderBody(n.body)}</span>
                </div>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
