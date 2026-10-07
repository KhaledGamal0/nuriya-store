import type { Metadata } from "next";
import { TrackForm } from "@/components/TrackForm";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the status of your Nuriya order with your order number and phone.",
  robots: { index: false },
};

export default function TrackPage() {
  return (
    <div className="wrap track">
      <h1>Track your order</h1>
      <p className="small">Use the order number from your confirmation and the phone you ordered with.</p>
      <TrackForm />
    </div>
  );
}
