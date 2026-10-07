import type { Metadata } from "next";
import Link from "next/link";
import { ClearBag } from "@/components/ClearBag";

export const metadata: Metadata = { title: "Thank you", robots: { index: false } };

type Props = { searchParams: Promise<{ o?: string; p?: string }> };

export default async function DonePage({ searchParams }: Props) {
  const { o, p } = await searchParams;
  const orderNo = typeof o === "string" && /^NUR-[2-9A-HJ-NP-Z]{6}$/.test(o) ? o : null;

  return (
    <div className="wrap done">
      <ClearBag />
      {orderNo && <p className="small">Order {orderNo}</p>}
      <h1>Thank you. Something beautiful is on its way.</h1>
      <p style={{ color: "var(--ink-2)" }}>
        {p === "card"
          ? "We'll message you on WhatsApp once your payment is confirmed."
          : "We'll message you on WhatsApp to confirm your order."}{" "}
        Please check your order with the courier before you accept.
      </p>
      {orderNo && (
        <p className="small">
          Keep your order number. You can check its status any time on{" "}
          <Link className="line-link" href={`/track?o=${orderNo}`}>
            Track your order
          </Link>
          .
        </p>
      )}
      <Link className="btn btn-line" href="/">
        Continue shopping
      </Link>
    </div>
  );
}
