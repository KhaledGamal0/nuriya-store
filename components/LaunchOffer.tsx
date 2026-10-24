"use client";

import { track } from "@/lib/track";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatEgp } from "@/lib/money";
import { percentOff } from "@/lib/catalog";
import { Dialog, CloseButton } from "./Dialog";
import { useStore } from "./StoreProvider";
import { useCountdown } from "./useCountdown";

const SEEN = "nuriya-sale-seen";

/**
 * Offer popup, two kinds (same look):
 *  - timed sale: "25% off everything" with a countdown;
 *  - limited-pieces launch offer (Khaled, Oct 24 2026): "17% off", 1,200 → 1,000, "Only N pieces left at this
 *    price" (the real count from the database, no countdown). Hides by itself when the last offer piece sells.
 * Launch-day sale popup. Shown once per visit, a moment after the page has loaded (never delays the page
 * or blocks the first photo), never on checkout. Native dialog: focus moves inside, Escape and the
 * backdrop close it, the page behind is inert. Disappears by itself when the sale ends.
 */
export function LaunchOffer() {
  const { catalog } = useStore();
  const sale = catalog.sale;
  const piecesLeft = !sale && catalog.compareAtPiasters && (catalog.offerPiecesLeft ?? 0) > 0 ? catalog.offerPiecesLeft! : 0;
  const active = Boolean(sale) || piecesLeft > 0;
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const left = useCountdown(sale?.endsAt, open);

  useEffect(() => {
    if (!active || path.startsWith("/checkout")) return;
    try {
      if (sessionStorage.getItem(SEEN)) return;
    } catch {}
    const show = () => {
      try {
        sessionStorage.setItem(SEEN, "1");
      } catch {}
      setOpen(true);
      track("Offer popup", "Shown");
    };
    const t = window.setTimeout(show, 1200);
    return () => window.clearTimeout(t);
  }, [active, path]);

  // The sale (or the last offer piece) ended while the popup was open.
  useEffect(() => {
    if (!active) setOpen(false);
  }, [active]);

  if (!active) return null;
  const was = catalog.compareAtPiasters;
  const pct = percentOff(catalog.pricePiasters, was);
  const onProduct = path.startsWith("/quiet-confidence");

  return (
    <Dialog open={open} onClose={() => setOpen(false)} variant="sheet" labelledBy="lo-title">
      <div className="lo">
        <div className="lo-x">
          <CloseButton onClick={() => setOpen(false)} label="Close offer" />
        </div>
        <div className="lo-b">
          <p className="lo-k">{sale ? "Launch day offer" : "Limited launch offer"}</p>
          <h2 id="lo-title" tabIndex={-1} autoFocus>
            {sale ? `${pct}% off everything` : `${pct}% off`}
          </h2>
          <p className="lo-p">
            {was && (
              <>
                <span className="sr-only">Was </span>
                <s>{formatEgp(was)}</s>
                <span className="sr-only">, now </span>{" "}
              </>
            )}
            <b>{formatEgp(catalog.pricePiasters)}</b>
          </p>
          {sale ? (
            <p className="lo-t" role="timer" aria-live="off">
              Ends in <b>{left ? left.text : " "}</b>
            </p>
          ) : (
            <p className="lo-t">
              Only <b className="lo-n">{piecesLeft}</b> {piecesLeft === 1 ? "piece" : "pieces"} left at this price
            </p>
          )}
          <p className="small">Both colours, every size. Cash on delivery across Egypt.</p>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setOpen(false);
              track("Offer popup", "Tapped Shop the offer");
              if (onProduct) return;
              if (path !== "/") return router.push("/#shop");
              // Home: the page can't scroll while the popup is open, so glide to the products once it has closed.
              const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              window.setTimeout(() => document.getElementById("shop")?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" }), 300);
            }}
          >
            {onProduct ? "Order now" : "Shop the offer"}
          </button>
          <button
            type="button"
            className="lo-later"
            onClick={() => {
              setOpen(false);
              track("Offer popup", "Tapped Maybe later");
            }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </Dialog>
  );
}

/** One quiet line under the product price while a sale runs: what it is and how long is left. */
export function SaleNote() {
  const { catalog } = useStore();
  const left = useCountdown(catalog.sale?.endsAt, Boolean(catalog.sale));
  if (!catalog.sale) return null;
  return (
    <p className="sale-note">
      Launch day · {percentOff(catalog.pricePiasters, catalog.compareAtPiasters)}% off · ends in{" "}
      <span className="sale-t">{left ? left.text : " "}</span>
    </p>
  );
}
