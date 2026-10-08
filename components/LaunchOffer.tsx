"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatEgp } from "@/lib/money";
import { percentOff } from "@/lib/catalog";
import { Dialog, CloseButton } from "./Dialog";
import { useStore } from "./StoreProvider";
import { useCountdown } from "./useCountdown";

const SEEN = "nuriya-sale-seen";

/**
 * Launch-day sale popup. Shown once per visit, a moment after the page has loaded (never delays the page
 * or blocks the first photo), never on checkout. Native dialog: focus moves inside, Escape and the
 * backdrop close it, the page behind is inert. Disappears by itself when the sale ends.
 */
export function LaunchOffer() {
  const { catalog } = useStore();
  const sale = catalog.sale;
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const left = useCountdown(sale?.endsAt, open);

  useEffect(() => {
    if (!sale || path.startsWith("/checkout")) return;
    try {
      if (sessionStorage.getItem(SEEN)) return;
    } catch {}
    const show = () => {
      try {
        sessionStorage.setItem(SEEN, "1");
      } catch {}
      setOpen(true);
    };
    const t = window.setTimeout(show, 1200);
    return () => window.clearTimeout(t);
  }, [sale, path]);

  // The sale ended while the popup was open.
  useEffect(() => {
    if (!sale) setOpen(false);
  }, [sale]);

  if (!sale) return null;
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
          <p className="lo-k">Launch day offer</p>
          <h2 id="lo-title" tabIndex={-1} autoFocus>
            {pct}% off everything
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
          <p className="lo-t" role="timer" aria-live="off">
            Ends in <b>{left ? left.text : " "}</b>
          </p>
          <p className="small">Both colours, every size. Cash on delivery across Egypt.</p>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setOpen(false);
              if (onProduct) return;
              if (path !== "/") return router.push("/#shop");
              // Home: the page can't scroll while the popup is open, so glide to the products once it has closed.
              const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
              window.setTimeout(() => document.getElementById("shop")?.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" }), 300);
            }}
          >
            {onProduct ? "Order now" : "Shop the offer"}
          </button>
          <button type="button" className="lo-later" onClick={() => setOpen(false)}>
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
