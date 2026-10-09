"use client";

import { track } from "@/lib/track";
import Link from "next/link";
import { useEffect, useState } from "react";
import { productPath, sizeForWeight, type ColorId, type SizeId } from "@/lib/catalog";
import { useStore } from "./StoreProvider";
import { useBag } from "./BagProvider";
import { Dialog, CloseButton } from "./Dialog";

export function ProductPurchase({ color }: { color: ColorId }) {
  const bag = useBag();
  const { catalog } = useStore();
  const options = catalog.colors[color].sizes;
  const isAvailable = (s: SizeId) => options.some((o) => o.size === s && o.available);
  const allSoldOut = options.every((o) => !o.available);
  // No size is ever pre-selected: the customer always chooses one on purpose.
  const [size, setSize] = useState<SizeId | null>(null);

  const [needSize, setNeedSize] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [kg, setKg] = useState(58);
  const [added, setAdded] = useState(false);
  const fit = sizeForWeight(kg);

  // Which product people look at (counted once per colour per page view).
  useEffect(() => {
    track("2 · Viewed product", catalog.colors[color].name);
  }, [color, catalog]);

  function addToBag() {
    if (!size || !isAvailable(size)) {
      track("Problem · tapped Add without a size", catalog.colors[color].name);
      setNeedSize(true);
      const group = document.getElementById("size-group");
      group?.scrollIntoView({ behavior: "smooth", block: "center" });
      group?.querySelector("button")?.focus({ preventScroll: true });
      return;
    }
    bag.add(color, size);
    track("4 · Added to bag", `${catalog.colors[color].name} · ${size}`);
    // What the whole bag is worth right after adding (current bag + this piece).
    const unit = catalog.colors[color].sizes.find((x) => x.size === size)?.pricePiasters ?? catalog.pricePiasters;
    track("Bag · value after adding", `${bag.count + 1} pcs · ${((bag.subtotalPiasters + unit) / 100).toLocaleString("en-US")} EGP`);
    setAdded(true);
    window.setTimeout(() => {
      setAdded(false);
      bag.openBag();
    }, 450);
  }

  return (
    <>
      <div>
        <div className="o-h">
          <b>Color</b>
        </div>
        <div className="opts" role="group" aria-label="Color">
          {catalog.colorOrder.map((c) => (
            <Link
              key={c}
              className="opt"
              href={productPath(c)}
              replace
              scroll={false}
              onClick={() => {
                document.documentElement.dataset.keepScroll = "true";
              }}
              aria-current={c === color ? "true" : undefined}
            >
              <span className="dot" style={{ background: catalog.colors[c].swatch }} aria-hidden="true" />
              {catalog.colors[c].name}
            </Link>
          ))}
        </div>
      </div>

      <div className="sz-wrap" data-shake={needSize ? "true" : "false"}>
        <div className="o-h">
          <b id="size-label">Size</b>
          <button type="button" className="u small" onClick={() => setGuideOpen(true)} aria-haspopup="dialog">
            Find my size
          </button>
        </div>
        <div className="opts" role="group" aria-labelledby="size-label" id="size-group">
          {options.map(({ size: s, available }) => (
            <button
              key={s}
              className="opt"
              type="button"
              aria-pressed={size === s}
              disabled={!available}
              aria-label={available ? s : `${s}, sold out`}
              onClick={() => {
                track("3 · Chose size", `${catalog.colors[color].name} · ${s}`);
                setSize(s);
                setNeedSize(false);
              }}
            >
              {s}
              {!available && <span className="opt-note">Sold out</span>}
            </button>
          ))}
        </div>
        {needSize && (
          <p className="sz-err" role="alert">
            Choose a size first.
          </p>
        )}
      </div>

      <button type="button" className="btn" onClick={addToBag} disabled={allSoldOut} data-added={added ? "true" : "false"} aria-live="polite">
        {allSoldOut ? (
          "Sold out"
        ) : added ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
            Added to bag
          </>
        ) : (
          "Add to bag"
        )}
      </button>

      <Dialog open={guideOpen} onClose={() => setGuideOpen(false)} variant="sheet" labelledBy="fit-title">
        <div className="sheet-h">
          <h2 id="fit-title" tabIndex={-1} autoFocus>
            Find my size
          </h2>
          <CloseButton onClick={() => setGuideOpen(false)} />
        </div>
        <div className="kg">
          <label htmlFor="kg" className="small">
            Your weight
          </label>
          <b>
            <output htmlFor="kg">{kg}</output> kg
          </b>
        </div>
        <input id="kg" type="range" min={40} max={95} value={kg} onChange={(e) => setKg(Number(e.target.value))} />
        <p className="res" aria-live="polite">
          We recommend <b>{fit.size}</b>. {isAvailable(fit.size) ? fit.note : `${fit.size} is sold out in ${catalog.colors[color].name.toLowerCase()} right now.`}
        </p>
        <button
          type="button"
          className="btn"
          disabled={!isAvailable(fit.size)}
          onClick={() => {
            setSize(fit.size);
            track("Product · size helper used", `${Math.floor(kg / 5) * 5}–${Math.floor(kg / 5) * 5 + 4} kg → ${fit.size}`);
            setNeedSize(false);
            setGuideOpen(false);
            bag.toast(`Size ${fit.size} selected`);
          }}
        >
          Select {fit.size}
        </button>
      </Dialog>
    </>
  );
}
