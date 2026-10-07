import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { COLORS, PRODUCT, isColor } from "@/lib/catalog";
import { formatEgp } from "@/lib/money";
import { MIN_FEE_PIASTERS } from "@/lib/shipping";
import { Gallery } from "@/components/Gallery";
import { ProductPurchase } from "@/components/ProductPurchase";
import { SizeTable } from "@/components/SizeTable";

type Params = { params: Promise<{ color: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return COLORS.map((color) => ({ color }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { color } = await params;
  if (!isColor(color)) return {};
  const c = PRODUCT.colors[color];
  return {
    title: `${PRODUCT.name} quarter-zip, ${c.name.toLowerCase()}`,
    description: PRODUCT.summary,
    openGraph: { images: [{ url: c.images[0]!.src }] },
    alternates: { canonical: `/quiet-confidence/${color}` },
  };
}

export default async function ProductPage({ params }: Params) {
  const { color } = await params;
  if (!isColor(color)) notFound();
  const c = PRODUCT.colors[color];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${PRODUCT.name} quarter-zip`,
    color: c.name,
    description: PRODUCT.summary,
    image: c.images.map((i) => i.src),
    brand: { "@type": "Brand", name: "Nuriya" },
    offers: {
      "@type": "Offer",
      priceCurrency: "EGP",
      price: PRODUCT.pricePiasters / 100,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <div className="wrap pdp">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Gallery images={c.images} label={`${PRODUCT.name}, ${c.name}`} />
      <div className="info">
        <div className="t-row">
          <h1>{PRODUCT.name}</h1>
          <span className="price">{formatEgp(PRODUCT.pricePiasters)}</span>
        </div>
        <ProductPurchase color={color} />
        <p className="small">Cash on delivery or card. Check your order with the courier before you accept.</p>
        <div className="acc">
          <details>
            <summary>Details</summary>
            <div className="acc-in">
              <p>{PRODUCT.summary}</p>
              {PRODUCT.details.map((d) => (
                <p key={d}>{d}</p>
              ))}
              <p>{c.detail}</p>
            </div>
          </details>
          <details>
            <summary>Size and fit</summary>
            <div className="acc-in">
              <SizeTable />
              <p>Oversized fit. Between sizes, size down.</p>
            </div>
          </details>
          <details>
            <summary>Delivery and returns</summary>
            <div className="acc-in">
              <p>Delivery across Egypt from {formatEgp(MIN_FEE_PIASTERS)}. The exact fee shows at checkout.</p>
              <p>Open your parcel and check it while the courier is with you. After the courier leaves, returns and exchanges are closed.</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
