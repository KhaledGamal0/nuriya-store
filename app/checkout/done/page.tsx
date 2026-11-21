import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OrderConfirmation } from "@/components/OrderConfirmation";
import { getSql, hasDatabase } from "@/lib/db";
import { ORDER_NUMBER, orderExists } from "@/lib/orders";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };

type Props = { searchParams: Promise<{ o?: string; p?: string }> };

/**
 * Shown only after a real order (Khaled, Nov 22 2026). No order number, a malformed one, or one that is not
 * in the database → home page. If the database can't be reached right now, the page still opens: a buyer only
 * gets here after the order was saved, and the screen shows details only from this browser's own receipt.
 */
export default async function DonePage({ searchParams }: Props) {
  const { o, p } = await searchParams;
  const number = typeof o === "string" ? o.trim().toUpperCase() : "";
  if (!ORDER_NUMBER.test(number)) redirect("/");
  if (hasDatabase()) {
    let exists = true;
    try {
      exists = await orderExists(getSql(), number);
    } catch (err) {
      console.error("checkout.done_check_failed", err instanceof Error ? err.message : err);
    }
    if (!exists) redirect("/");
  }
  return <OrderConfirmation number={number} payment={p === "card" ? "card" : "cod"} />;
}
