import type { Metadata } from "next";
import Link from "next/link";
import { SizeTable } from "@/components/SizeTable";
import { getCatalog } from "@/lib/store";

export const metadata: Metadata = { title: "Size guide", description: "Nuriya sizes S/M and L/XL: shoulder, chest and length in centimeters." };

export default async function SizeGuidePage() {
  const catalog = await getCatalog();
  return (
    <div className="wrap page">
      <header className="page-h">
        <p className="label">Fit</p>
        <h1>Size guide</h1>
        <p>Every piece is cut oversized for a relaxed fit. Measurements in centimeters; chest is all the way around.</p>
      </header>

      <section className="page-sec" aria-labelledby="m-title">
        <h2 id="m-title">Measurements</h2>
        <SizeTable rows={catalog.sizeChart} />
        <p className="small">Between sizes? Size down. Not sure? Message us on Instagram.</p>
        <Link className="btn btn-line" href="/#shop">
          Shop now
        </Link>
      </section>
    </div>
  );
}
