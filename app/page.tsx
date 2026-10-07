import Image from "next/image";
import Link from "next/link";
import { COLORS, PRODUCT } from "@/lib/catalog";
import { formatEgp } from "@/lib/money";

const hover: Record<string, string> = { cream: "/images/cream-chest.jpg", burgundy: "/images/burgundy-hanger.jpg" };

export default function Home() {
  return (
    <>
      <section className="hero" aria-label="Quiet Confidence">
        <Image
          className="hero-img"
          src="/images/cream-on-model.jpg"
          alt="A girl wearing the cream Quiet Confidence quarter-zip with wide-leg jeans"
          fill
          priority
          sizes="100vw"
        />
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
        <div className="sec-h">
          <h2 id="shop-title">{PRODUCT.name}</h2>
          <span className="small">{COLORS.length} colors</span>
        </div>
        <div className="grid">
          {COLORS.map((c) => {
            const color = PRODUCT.colors[c];
            const first = color.images[0]!;
            return (
              <Link className="pc" href={`/quiet-confidence/${c}`} key={c}>
                <div className="pc-ph">
                  <Image src={first.src} alt={first.alt} fill sizes="(min-width: 900px) 600px, 50vw" />
                  <Image src={hover[c]!} alt="" fill sizes="(min-width: 900px) 600px, 50vw" />
                </div>
                <div className="pc-t">
                  <b>
                    {PRODUCT.type}, {color.name.toLowerCase()}
                  </b>
                  <span>{formatEgp(PRODUCT.pricePiasters)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="ed" aria-label="Craft">
        <Image src="/images/sleeve.jpg" alt="Embroidered sleeve: do what you love, love what you do" fill sizes="100vw" />
        <p>
          Every stitch,
          <br />
          every detail.
        </p>
      </section>
    </>
  );
}
