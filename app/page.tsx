import Image from "next/image";
import Link from "next/link";
import { getCatalog } from "@/lib/store";
import { formatEgp } from "@/lib/money";

const hover: Record<string, string> = { cream: "/images/cream-model.jpg", burgundy: "/images/burgundy-model.jpg" };

export default async function Home() {
  const catalog = await getCatalog();
  return (
    <>
      <section className="hero" aria-label="Quiet Confidence">
        <div className="hero-ph">
          <Image
            className="hero-img"
            src="/images/hero-pair.jpg"
            alt="Two girls in the Quiet Confidence quarter-zip, one in cream with a burgundy collar and one in burgundy with a cream collar"
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
            const first = color.images.find((i) => i.src.includes("styled")) ?? color.images[0]!;
            return (
              <Link className="pc reveal" href={`/quiet-confidence/${c}`} key={c}>
                <div className="pc-ph">
                  <Image src={first.src} alt={first.alt} fill sizes="(min-width: 900px) 600px, 50vw" />
                  <Image src={hover[c]!} alt="" fill sizes="(min-width: 900px) 600px, 50vw" />
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

      <section className="ed" aria-label="Craft">
        <Image src="/images/cream-sleeve.jpg" alt="Embroidered sleeve: do what you love, love what you do" fill sizes="100vw" />
        <p className="reveal">
          Every stitch,
          <br />
          every detail.
        </p>
      </section>
    </>
  );
}
