"use client";

import Link from "next/link";
import { useState } from "react";
import { COLORS, PRODUCT, SIZES, sizeForWeight, type ColorId, type SizeId } from "@/lib/catalog";
import { useBag } from "./BagProvider";
import { Dialog, CloseButton } from "./Dialog";

export function ProductPurchase({ color }: { color: ColorId }) {
  const bag = useBag();
  const [size, setSize] = useState<SizeId | null>(null);
  const [needSize, setNeedSize] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [kg, setKg] = useState(58);
  const fit = sizeForWeight(kg);

  function addToBag() {
    if (!size) {
      setNeedSize(true);
      document.getElementById("size-group")?.querySelector("button")?.focus();
      return;
    }
    bag.add(color, size);
    bag.openBag();
  }

  return (
    <>
      <div>
        <div className="o-h">
          <b>Color</b>
        </div>
        <div className="opts" role="group" aria-label="Color">
          {COLORS.map((c) => (
            <Link
              key={c}
              className="opt"
              href={`/quiet-confidence/${c}`}
              replace
              scroll={false}
              aria-current={c === color ? "true" : undefined}
            >
              <span className="dot" style={{ background: PRODUCT.colors[c].swatch }} aria-hidden="true" />
              {PRODUCT.colors[c].name}
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
          {SIZES.map((s) => (
            <button
              key={s}
              className="opt"
              type="button"
              aria-pressed={size === s}
              onClick={() => {
                setSize(s);
                setNeedSize(false);
              }}
            >
              {s}
            </button>
          ))}
        </div>
        {needSize && (
          <p className="sz-err" role="alert">
            Choose a size first.
          </p>
        )}
      </div>

      <button type="button" className="btn" onClick={addToBag}>
        Add to bag
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
          We recommend <b>{fit.size}</b>. {fit.note}
        </p>
        <button
          type="button"
          className="btn"
          onClick={() => {
            setSize(fit.size);
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
