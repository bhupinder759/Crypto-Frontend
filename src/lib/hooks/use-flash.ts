"use client";

import { useEffect, useRef } from "react";

/**
 * Adds `data-flash="up" | "down"` to the element for a moment when `value`
 * changes, without re-rendering (DOM attribute + CSS animation).
 */
export function useFlash<T extends HTMLElement>(value: number | null | undefined) {
  const ref = useRef<T | null>(null);
  const previous = useRef<number | null | undefined>(value);

  useEffect(() => {
    const el = ref.current;
    const prev = previous.current;
    previous.current = value;
    if (!el || prev == null || value == null || prev === value) return;

    el.removeAttribute("data-flash");
    // Force reflow so the animation restarts on consecutive changes.
    void el.offsetWidth;
    el.setAttribute("data-flash", value > prev ? "up" : "down");
    const timer = window.setTimeout(() => el.removeAttribute("data-flash"), 600);
    return () => window.clearTimeout(timer);
  }, [value]);

  return ref;
}
