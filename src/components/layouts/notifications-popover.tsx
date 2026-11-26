"use client";

import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  BellOff,
  BellRing,
  CheckCheck,
  CircleCheck,
  CircleX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsQuery,
  type NotificationDto,
} from "@/modules/notifications/notifications";

const ICONS: Record<string, typeof Bell> = {
  PRICE_ALERT: BellRing,
  ORDER_FILLED: CircleCheck,
  DEPOSIT_CREDITED: ArrowDownToLine,
  WITHDRAWAL_COMPLETED: ArrowUpFromLine,
  WITHDRAWAL_FAILED: CircleX,
};

const relative = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
function timeAgo(iso: string, now: number) {
  const seconds = Math.round((new Date(iso).getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return relative.format(seconds, "second");
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return relative.format(Math.round(seconds / 3600), "hour");
  return relative.format(Math.round(seconds / 86400), "day");
}

function Item({
  item,
  now,
  onRead,
}: {
  item: NotificationDto;
  now: number;
  onRead: (id: string) => void;
}) {
  const Icon = ICONS[item.type] ?? Bell;
  return (
    <li>
      <button
        type="button"
        onClick={() => !item.read && onRead(item.id)}
        className={cn(
          "flex w-full gap-2.5 px-3 py-2 text-left hover:bg-accent/50",
          !item.read && "bg-primary/5",
        )}
      >
        <Icon
          className={cn(
            "mt-0.5 size-4 shrink-0",
            item.type === "WITHDRAWAL_FAILED" ? "text-sell" : "text-primary",
          )}
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-xs font-medium">{item.title}</span>
            {!item.read ? (
              <span
                className="size-1.5 shrink-0 rounded-full bg-primary"
                aria-label="Unread"
              />
            ) : null}
          </span>
          <span className="line-clamp-2 text-[11px] text-muted-foreground">
            {item.body}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {timeAgo(item.createdAt, now)}
          </span>
        </span>
      </button>
    </li>
  );
}

export function NotificationsPopover() {
  const query = useNotificationsQuery();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const [now, setNow] = useState(() => Date.now());
  const items = query.data?.items ?? [];
  const unread = query.data?.unreadCount ?? 0;

  return (
    <Popover onOpenChange={(open) => open && setNow(Date.now())}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            unread ? `Notifications (${unread} unread)` : "Notifications"
          }
          className="relative"
        >
          <Bell className="size-4" />
          {unread > 0 ? (
            <span className="absolute top-1 right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-primary-foreground tabular">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-sm font-medium">Notifications</p>
          <Button
            variant="ghost"
            size="xs"
            disabled={unread === 0 || markAll.isPending}
            onClick={() => markAll.mutate()}
          >
            <CheckCheck /> Mark all read
          </Button>
        </div>
        {query.isError ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">
            Couldn&apos;t load notifications.
          </p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <BellOff className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium">No notifications</p>
            <p className="text-xs text-muted-foreground">
              Order fills, deposits and price alerts show up here.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <ul className="divide-y divide-border/60">
              {items.map((item) => (
                <Item
                  key={item.id}
                  item={item}
                  now={now}
                  onRead={(id) => markRead.mutate(id)}
                />
              ))}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
