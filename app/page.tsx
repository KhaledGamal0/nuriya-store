import Image from "next/image";
import Link from "next/link";
import { getCatalog } from "@/lib/store";
import { formatEgp } from "@/lib/money";
import { productPath } from "@/lib/catalog";
import { preview } from "@/lib/blur";

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
            quality={75}
            sizes="(min-width: 900px) 50vw, 100vw"
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
                  <Image src={first.src} alt={first.alt} fill sizes="(min-width: 900px) 600px, 50vw" />
                  <Image src={second.src} alt="" fill sizes="(min-width: 900px) 600px, 50vw" />
                </div>
                <div className="pc-t">
                  <b>
                    {catalog.type}, {color.name.toLowerCase()}
                  </b>
                  <span>{color.sizes.some((s) => s.available) ? formatEgp(catalog.pricePiasters) : "Sold out"}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="ed" aria-label="Craft" style={preview("/images/craft-sleeve-tall.jpg")}>
        <Image
          className="ed-tall"
          src="/images/craft-sleeve-tall.jpg"
          alt="White cuff embroidered in burgundy: do what you love, love what you do"
          fill
          sizes="(min-width: 900px) 1px, 100vw"
        />
        <Image className="ed-wide" src="/images/craft-sleeve-wide.jpg" alt="" fill sizes="(min-width: 900px) 100vw, 1px" />
        <p className="reveal">
          Every stitch,
          <br />
          every detail.
        </p>
      </section>
    </>
  );
}
