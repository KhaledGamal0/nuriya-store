import Image from "next/image";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COLORS, colorFromSlug, productPath, COLOR_SLUG } from "@/lib/catalog";
import { getAreas, getCatalog } from "@/lib/store";
import { formatEgp } from "@/lib/money";
import { minFee } from "@/lib/shipping";
import { Gallery } from "@/components/Gallery";
import { ProductPurchase } from "@/components/ProductPurchase";
import { SizeTable } from "@/components/SizeTable";
import { Price } from "@/components/Price";
import { preview } from "@/lib/blur";

type Params = { params: Promise<{ color: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return COLORS.map((c) => ({ color: COLOR_SLUG[c] }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const color = colorFromSlug((await params).color);
  if (!color) return {};
  const catalog = await getCatalog();
  const c = catalog.colors[color];
  return {
    title: `${catalog.name} quarter-zip, ${c.name.toLowerCase()}`,
    description: catalog.summary,
    openGraph: { images: [{ url: c.images[0]!.src }] },
    alternates: { canonical: productPath(color) },
  };
}

export default async function ProductPage({ params }: Params) {
  const color = colorFromSlug((await params).color);
  if (!color) notFound();
  const [catalog, areas] = await Promise.all([getCatalog(), getAreas()]);
  const c = catalog.colors[color];
  const inStock = c.sizes.some((s) => s.available);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${catalog.name} quarter-zip`,
    color: c.name,
    description: catalog.summary,
    image: c.images.map((i) => i.src),
    brand: { "@type": "Brand", name: "Nuriya" },
    offers: {
      "@type": "Offer",
      priceCurrency: "EGP",
      price: catalog.pricePiasters / 100,
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="wrap pdp">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Gallery images={c.images} label={`${catalog.name}, ${c.name}`} />
      <div className="info">
        <div>
          <div className="t-row">
            <h1>{catalog.name}</h1>
            <Price now={catalog.pricePiasters} was={catalog.compareAtPiasters} />
          </div>
          <p className="info-sub">Oversized quarter-zip · {c.name}</p>
        </div>
        <ProductPurchase color={color} />
        <p className="small">Cash on delivery. Check your order with the courier before you accept.</p>
        <div className="acc">
          <details>
            <summary>Details</summary>
            <div className="acc-in">
              <p>{catalog.summary}</p>
              {catalog.details.map((d) => (
                <p key={d}>{d}</p>
              ))}
              <p>{c.detail}</p>
            </div>
          </details>
          <details>
            <summary>Size and fit</summary>
            <div className="acc-in">
              <SizeTable rows={catalog.sizeChart} />
              <p>Oversized fit. Between sizes, size down.</p>
            </div>
          </details>
          <details>
            <summary>Delivery and returns</summary>
            <div className="acc-in">
              <p>Delivery across Egypt from {formatEgp(minFee(areas))}. The exact fee shows at checkout.</p>
              <p>Open your parcel and check it while the courier is with you. After the courier leaves, returns and exchanges are closed.</p>
            </div>
          </details>
        </div>
        {catalog.colorOrder.filter((x) => x !== color).map((x) => {
          const o = catalog.colors[x];
          return (
            <Link key={x} className="also" href={productPath(x)}>
              <span className="also-img" style={preview(o.images[0]!.src)}>
                <Image src={o.images[0]!.src} alt="" fill sizes="64px" loading="eager" fetchPriority="low" />
              </span>
              <span>
                <b>Also in {o.name.toLowerCase()}</b>
                <span>{o.detail}</span>
              </span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
