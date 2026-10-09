"use client";

import { track } from "@/lib/track";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { Dialog, CloseButton } from "./Dialog";
import { useBag } from "./BagProvider";
import { BagLineItem } from "./BagLineItem";
import { formatEgp } from "@/lib/money";
import { useStore } from "./StoreProvider";

const INSTAGRAM = "https://www.instagram.com/nuriya.eg";

export function Header() {
  const bag = useBag();
  const { minFeePiasters } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const pathname = usePathname();
  const current = (href: string) => (pathname === href ? "page" : undefined);

  // Hide the header while scrolling down, bring it back on any scroll up.
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      if (Math.abs(y - lastY.current) < 6) return;
      setHidden(y > lastY.current && y > 120);
      lastY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // Every new page opens at the very top with the header showing.
  // The colour options on the product page keep your place (they set data-keep-scroll).
  const prevPath = useRef(pathname);
  useEffect(() => {
    const was = prevPath.current;
    prevPath.current = pathname;
    setHidden(false);
    if (was === pathname) return;
    const keep = document.documentElement.dataset.keepScroll === "true";
    delete document.documentElement.dataset.keepScroll;
    if (!keep && !window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <>
      <header className="hdr" data-hidden={hidden && !menuOpen && !bag.bagOpen ? "true" : "false"} data-scrolled={scrolled ? "true" : "false"}>
        <div className="wrap hdr-in">
          <div className="hdr-side">
            <button type="button" className="ib hdr-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-haspopup="dialog">
              <svg width="20" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M0 1h20M0 11h20" />
              </svg>
            </button>
            <Link className="hdr-link line-link" href="/quiet-confidence/white" aria-current={current("/quiet-confidence/white")}>White</Link>
            <Link className="hdr-link line-link" href="/quiet-confidence/burgundy" aria-current={current("/quiet-confidence/burgundy")}>Burgundy</Link>
            <Link className="hdr-link line-link" href="/size-guide" aria-current={current("/size-guide")}>Size guide</Link>
          </div>
          <Link href="/" className="logo-link" aria-label="Nuriya, home">
            <Logo className="logo" />
          </Link>
          <div className="hdr-side hdr-side-r">
          <a className="hdr-link line-link" href={INSTAGRAM} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
          <button
            type="button"
            className="ib ib-r"
            onClick={() => {
              bag.openBag();
              track("Bag opened", `${bag.count} pieces`);
            }}
            aria-haspopup="dialog"
            aria-label={bag.count ? `Open bag, ${bag.count} ${bag.count === 1 ? "item" : "items"}` : "Open bag, empty"}
          >
            <svg width="19" height="21" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M2 7h15l-1.1 13H3.1z" />
              <path d="M6 9V5a3.5 3.5 0 0 1 7 0v4" />
            </svg>
            {bag.count > 0 && (
              <span className="bag-n" key={bag.count} aria-hidden="true">
                {bag.count}
              </span>
            )}
          </button>
          </div>
        </div>
      </header>

      <Dialog open={menuOpen} onClose={closeMenu} variant="left" labelledBy="menu-title">
        <div className="dlg-h">
          <h2 id="menu-title" tabIndex={-1} autoFocus>
            Menu
          </h2>
          <CloseButton onClick={closeMenu} label="Close menu" />
        </div>
        <nav className="dlg-b nav" aria-label="Main">
          <p className="nav-label">Shop</p>
          <Link href="/quiet-confidence/white" onClick={closeMenu} aria-current={current("/quiet-confidence/white")}>Quiet Confidence, white</Link>
          <Link href="/quiet-confidence/burgundy" onClick={closeMenu} aria-current={current("/quiet-confidence/burgundy")}>Quiet Confidence, burgundy</Link>
          <p className="nav-label">Help</p>
          <Link href="/size-guide" onClick={closeMenu} aria-current={current("/size-guide")}>Size guide</Link>
          <Link href="/returns" onClick={closeMenu} aria-current={current("/returns")}>Delivery and returns</Link>
        </nav>
        <div className="dlg-f">
          <a className="small" href={INSTAGRAM} target="_blank" rel="noopener noreferrer">
            Instagram @nuriya.eg
          </a>
        </div>
      </Dialog>

      <Dialog open={bag.bagOpen} onClose={bag.closeBag} variant="right" labelledBy="bag-title">
        <div className="dlg-h">
          <h2 id="bag-title" tabIndex={-1} autoFocus>
            Bag{bag.count > 0 ? ` (${bag.count})` : ""}
          </h2>
          <CloseButton onClick={bag.closeBag} label="Close bag" />
        </div>
        <div className="dlg-b">
          {bag.lines.length === 0 ? (
            <div className="empty">
              <p>Your bag is empty</p>
              <Link className="btn btn-line" href="/#shop" onClick={bag.closeBag}>
                Shop now
              </Link>
            </div>
          ) : (
            bag.lines.map((line, i) => (
              <BagLineItem
                key={`${line.color}-${line.size}`}
                line={line}
                onQty={(q) => bag.setQty(i, q)}
                onRemove={() => bag.remove(i)}
              />
            ))
          )}
        </div>
        {bag.lines.length > 0 && (
          <div className="dlg-f">
            <div className="tot">
              <span>Subtotal</span>
              <span>{formatEgp(bag.subtotalPiasters)}</span>
            </div>
            <p className="small">Delivery from {formatEgp(minFeePiasters)}, added at checkout.</p>
            <Link className="btn" href="/checkout" onClick={bag.closeBag}>
              Checkout
            </Link>
          </div>
        )}
      </Dialog>
    </>
  );
}
