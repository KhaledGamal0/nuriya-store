import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";
import { cardPaymentsEnabled } from "@/lib/orders";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="wrap">
      <CheckoutForm cardEnabled={cardPaymentsEnabled()} />
    </div>
  );
}
