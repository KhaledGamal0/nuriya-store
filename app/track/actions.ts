"use server";

import { headers } from "next/headers";
import { getSql, hasDatabase } from "@/lib/db";
import { allow, findOrder, hashIp, LIMITS, type TrackedOrder } from "@/lib/orders";

export type TrackState = { order?: TrackedOrder; notice?: string } | null;

const NOT_FOUND = "We couldn't find an order with that number and phone. Check both and try again.";

export async function trackOrder(_prev: TrackState, form: FormData): Promise<TrackState> {
  if (!hasDatabase()) return { notice: "Order lookup isn't available right now. Please message us on Instagram @nuriya.eg." };
  try {
    const sql = getSql();
    const h = await headers();
    const ipHash = hashIp(h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim());
    if (ipHash) {
      const { max, windowSec } = LIMITS.trackPerDevice;
      if (!(await allow(sql, `track:${ipHash}`, max, windowSec))) return { notice: "Too many lookups from this device. Please wait a few minutes." };
    }
    const order = await findOrder(sql, form.get("number"), form.get("phone"));
    return order ? { order } : { notice: NOT_FOUND };
  } catch (err) {
    console.error("track.failed", err instanceof Error ? err.message : err);
    return { notice: "We couldn't check your order just now. Please try again in a minute." };
  }
}
