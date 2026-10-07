import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { getCatalog } from "@/lib/store";
import { productPath } from "@/lib/catalog";
import { preview } from "@/lib/blur";
import { Price } from "@/components/Price";
import { PHONE_FULL } from "@/lib/sizes";

const craftCommon = { alt: "", fill: true, quality: 65, sizes: PHONE_FULL, loading: "eager" as const, fetchPriority: "low" as const };
const { props: craftTall } = getImageProps({ ...craftCommon, src: "/images/craft-sleeve-tall.jpg" });
const { props: craftWide } = getImageProps({ ...craftCommon, src: "/images/craft-sleeve-wide.jpg" });

export default async function Home() {
  const catalog = await getCatalog();
  return (
    <>
      <section className="hero" aria-label="Quiet Confidence">
        <div className="hero-ph" style={preview("/images/hero-pair.jpg")}>
          <Image
            className="hero-img"
            src="/images/hero-pair.jpg"
            alt="Two girls in the Quiet Confidence quarter-zip, one in white with a burgundy collar and one in burgundy with a white collar"
            fill
            priority
            quality={65}
            sizes={`(min-width: 900px) 50vw, ${PHONE_FULL}`}
          />
        </div>
        <div className="wrap hero-c">
          <h1>
            Not loud.
            <br />
            Just unforgettable.
          </h1>
          <Link className="btn btn-light" href="#shop">
            Shop now
          </Link>
        </div>
      </section>

      <section className="wrap sec" id="shop" aria-labelledby="shop-title" style={{ scrollMarginTop: "var(--header)" }}>
        <div className="sec-h reveal">
          <h2 id="shop-title">{catalog.name}</h2>
          <span className="small">{catalog.colorOrder.length} colors</span>
        </div>
        <div className="grid">
          {catalog.colorOrder.map((c) => {
            const color = catalog.colors[c];
            const first = color.images[0]!;
            const second = color.images[1] ?? first;
            return (
              <Link className="pc" href={productPath(c)} key={c}>
                <div className="pc-ph" style={preview(first.src)}>
                  <Image src={first.src} alt={first.alt} fill quality={65} sizes="(min-width: 900px) 600px, 50vw" loading="eager" fetchPriority="low" decoding="sync" />
                  <Image src={second.src} alt="" fill quality={65} sizes="(min-width: 900px) 600px, 50vw" />
                </div>
                <div className="pc-t">
                  <b>
                    {catalog.type}, {color.name.toLowerCase()}
                  </b>
                  {color.sizes.some((s) => s.available) ? <Price className="" now={catalog.pricePiasters} was={catalog.compareAtPiasters} /> : <span>Sold out</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="ed" aria-label="Craft" style={preview("/images/craft-sleeve-tall.jpg")}>
        {/* One <picture>: phones download only the portrait crop, desktops only the wide one. Loads straight away
            at low priority, so it is ready before you scroll to it. */}
        <picture>
          <source media="(min-width: 900px)" srcSet={craftWide.srcSet} sizes="100vw" />
          {/* eslint-disable-next-line @next/next/no-img-element -- art-directed via next/image getImageProps */}
          <img {...craftTall} alt="White cuff embroidered in burgundy: do what you love, love what you do" />
        </picture>
        <p className="reveal">
          Every stitch,
          <br />
          every detail.
        </p>
      </section>
    </>
  );
}
