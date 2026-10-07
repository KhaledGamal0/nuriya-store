"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "./Logo";
import { Dialog, CloseButton } from "./Dialog";
import { useBag } from "./BagProvider";
import { BagLineItem } from "./BagLineItem";
import { formatEgp } from "@/lib/money";
import { MIN_FEE_PIASTERS } from "@/lib/shipping";

const INSTAGRAM = "https://www.instagram.com/nuriya.eg";

export function Header() {
  const bag = useBag();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className="hdr">
        <div className="wrap hdr-in">
          <button type="button" className="ib" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-haspopup="dialog">
            <svg width="20" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M0 1h20M0 11h20" />
            </svg>
          </button>
          <Link href="/" className="logo-link" aria-label="Nuriya, home">
            <Logo className="logo" />
          </Link>
          <button
            type="button"
            className="ib ib-r"
            onClick={bag.openBag}
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
          <Link href="/quiet-confidence/cream" onClick={closeMenu}>Quiet Confidence, cream</Link>
          <Link href="/quiet-confidence/burgundy" onClick={closeMenu}>Quiet Confidence, burgundy</Link>
          <p className="nav-label">Help</p>
          <Link href="/size-guide" onClick={closeMenu}>Size guide</Link>
          <Link href="/returns" onClick={closeMenu}>Delivery and returns</Link>
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
            <p className="small">Delivery from {formatEgp(MIN_FEE_PIASTERS)}, added at checkout.</p>
            <Link className="btn" href="/checkout" onClick={bag.closeBag}>
              Checkout
            </Link>
          </div>
        )}
      </Dialog>
    </>
  );
}
