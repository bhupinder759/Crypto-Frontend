"use client";

import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function NotificationsPopover() {
  // Notifications API arrives with the backend price-alert work (Phase 2.5).
  const notifications: { id: string; title: string; time: string }[] = [];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="size-4" />
          {notifications.length > 0 ? (
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-sm font-medium">Notifications</p>
          <Button variant="ghost" size="xs" disabled>
            Mark all read
          </Button>
        </div>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
            <BellOff className="size-5 text-muted-foreground" />
            <p className="text-sm font-medium">No notifications</p>
            <p className="text-xs text-muted-foreground">
              Order fills, deposits and price alerts show up here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((item) => (
              <li key={item.id} className="px-3 py-2 text-sm">
                <p>{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
