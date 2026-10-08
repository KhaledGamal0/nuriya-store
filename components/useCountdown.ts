"use client";

import { useEffect, useState } from "react";

/** Time left until `endsAt`, updated every second while `active`. null before the first tick (server render). */
export function useCountdown(endsAt: string | undefined, active = true): { ms: number; text: string } | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!endsAt || !active) return;
    setNow(Date.now());
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [endsAt, active]);
  if (!endsAt || now === null) return null;
  const ms = Math.max(0, new Date(endsAt).getTime() - now);
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return { ms, text: `${h}h ${pad(m)}m ${pad(s % 60)}s` };
}
