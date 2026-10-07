"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatEgp } from "@/lib/money";
import { COLORS, PRODUCT, SIZES, isSize, sizeForWeight, type ColorId, type SizeId } from "@/lib/catalog";
import { useBag } from "./BagProvider";
import { Dialog, CloseButton } from "./Dialog";

export function ProductPurchase({ color }: { color: ColorId }) {
  const bag = useBag();
  const [size, setSizeState] = useState<SizeId | null>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const [showBar, setShowBar] = useState(false);

  // Keep the chosen size when switching between colours.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("nuriya-size");
      if (isSize(saved)) setSizeState(saved);
    } catch {}
  }, []);
  const setSize = (s: SizeId) => {
    setSizeState(s);
    try {
      sessionStorage.setItem("nuriya-size", s);
    } catch {}
  };

  // Phones: once the main button scrolls out of view, show a slim buy bar.
  useEffect(() => {
    const btn = addRef.current;
    if (!btn) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e!.isIntersecting && e!.boundingClientRect.top < 0));
    io.observe(btn);
    return () => io.disconnect();
  }, []);
  const [needSize, setNeedSize] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [kg, setKg] = useState(58);
  const [added, setAdded] = useState(false);
  const fit = sizeForWeight(kg);

  function addToBag() {
    if (!size) {
      setNeedSize(true);
      const group = document.getElementById("size-group");
      group?.scrollIntoView({ behavior: "smooth", block: "center" });
      group?.querySelector("button")?.focus({ preventScroll: true });
      return;
    }
    bag.add(color, size);
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
          {COLORS.map((c) => (
            <Link
              key={c}
              className="opt"
              href={`/quiet-confidence/${c}`}
              replace
              scroll={false}
              onClick={() => {
                document.documentElement.dataset.keepScroll = "true";
              }}
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

      <button ref={addRef} type="button" className="btn" onClick={addToBag} data-added={added ? "true" : "false"} aria-live="polite">
        {added ? (
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

      <div className="buybar" data-on={showBar ? "true" : "false"} aria-hidden={!showBar} inert={!showBar}>
        <div className="buybar-t">
          <b>{formatEgp(PRODUCT.pricePiasters)}</b>
          <span>
            {PRODUCT.colors[color].name}
            {size ? ` · ${size}` : " · choose size"}
          </span>
        </div>
        <button type="button" className="btn" onClick={addToBag}>
          Add to bag
        </button>
      </div>

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
