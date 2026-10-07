import type { Metadata } from "next";
import { OrderConfirmation } from "@/components/OrderConfirmation";
import { ORDER_NUMBER } from "@/lib/orders";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };

type Props = { searchParams: Promise<{ o?: string; p?: string }> };

export default async function DonePage({ searchParams }: Props) {
  const { o, p } = await searchParams;
  const number = typeof o === "string" && ORDER_NUMBER.test(o) ? o : null;
  return <OrderConfirmation number={number} payment={p === "card" ? "card" : "cod"} />;
}
