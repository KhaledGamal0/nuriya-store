import type { Metadata } from "next";
import Link from "next/link";
import { SizeTable } from "@/components/SizeTable";
import { PRODUCT } from "@/lib/catalog";

export const metadata: Metadata = { title: "Size guide", description: "Nuriya sizes S/M and L/XL, measured flat in centimeters." };

export default function SizeGuidePage() {
  return (
    <div className="wrap done">
      <h1>Size guide</h1>
      <p style={{ color: "var(--ink-2)" }}>
        Every piece is cut oversized for a relaxed fit. Measured flat, in centimeters. Between sizes? Size down.
      </p>
      <SizeTable />
      <ul className="small" style={{ margin: 0, paddingLeft: "1.1em" }}>
        {PRODUCT.sizeChart.map((r) => (
          <li key={r.size}>
            {r.size} usually fits {r.weightKg[0]}–{r.weightKg[1]} kg.
          </li>
        ))}
      </ul>
      <Link className="btn btn-line" href="/#shop">
        Shop now
      </Link>
    </div>
  );
}
