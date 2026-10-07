"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "./StoreProvider";
import { ClearBag } from "./ClearBag";
import { formatEgp } from "@/lib/money";
import { prettyPhone, readReceipt, type Receipt } from "@/lib/receipt";
import { preview } from "@/lib/blur";

const INSTAGRAM = "https://instagram.com/nuriya.eg";

export function OrderConfirmation({ number, payment }: { number: string | null; payment: "cod" | "card" }) {
  const { catalog } = useStore();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (number) setReceipt(readReceipt(number));
  }, [number]);

  const first = receipt?.name.split(" ")[0];
  const cod = (receipt?.payment ?? payment) === "cod";

  async function copy() {
    if (!number) return;
    try {
      await navigator.clipboard.writeText(number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the number is on screen to copy by hand */
    }
  }

  return (
    <div className="wrap ok">
      <ClearBag />
      <header className="ok-head">
        <div className="ok-status">
          <span className="ok-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
              <path d="M5 12.5l4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" pathLength="1" />
            </svg>
          </span>
          <p>Order placed successfully</p>
        </div>
        <h1>{first ? `Thank you, ${first}.` : "Thank you."}</h1>
        {number && (
          <div className="ok-no">
            <div>
              <span>Order number</span>
              <strong>{number}</strong>
            </div>
            <button type="button" className="ok-copy" onClick={copy} aria-live="polite" aria-label={copied ? "Order number copied" : `Copy order number ${number}`}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
        <p className="ok-lead">
          {receipt ? (
            <>
              We&apos;ll message you on WhatsApp at <b>{prettyPhone(receipt.phone)}</b> to confirm it before it ships.
            </>
          ) : (
            <>We&apos;ll message you on WhatsApp to confirm it before it ships.</>
          )}
        </p>
      </header>

      <div className="ok-grid">
        <section className="ok-next" aria-labelledby="ok-next-h">
          <h2 id="ok-next-h">What happens next</h2>
          <ol>
            <li>
              <b>We confirm on WhatsApp</b>
              <span>A quick message to check your order and address.</span>
            </li>
            <li>
              <b>We pack it and hand it to the courier</b>
              <span>Packed by hand in Cairo and sent with Direction.</span>
            </li>
            <li>
              <b>Check it at the door</b>
              <span>
                {cod
                  ? receipt
                    ? `Open it with the courier, then pay ${formatEgp(receipt.totalPiasters)} in cash. `
                    : "Open it with the courier, then pay in cash. "
                  : "Open it with the courier before you accept. "}
                After the courier leaves, returns and exchanges are closed.
              </span>
            </li>
          </ol>
          <div className="ok-actions">
            <Link className="btn" href="/">
              Continue shopping
            </Link>
          </div>
          <p className="small">
            Questions? Message us on{" "}
            <a className="line-link" href={INSTAGRAM} target="_blank" rel="noopener noreferrer">
              Instagram @nuriya.eg
            </a>
            .
          </p>
        </section>

        {receipt && (
          <aside className="sum ok-sum" aria-label="Your order">
            <h2>Your order</h2>
            <div>
              {receipt.lines.map((l) => {
                const color = catalog.colors[l.color];
                const image = color?.images[0];
                return (
                  <div className="ln" key={`${l.color}-${l.size}`}>
                    <div className="ln-img" style={image ? preview(image.src) : undefined}>{image && <Image src={image.src} alt="" fill sizes="72px" loading="eager" />}</div>
                    <div className="ln-m">
                      <b>{catalog.name}</b>
                      <span>
                        {color?.name ?? l.color} · {l.size}
                      </span>
                      <span>Qty {l.qty}</span>
                    </div>
                    <div className="ln-r">
                      <span className="price">{formatEgp(l.linePiasters)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>{formatEgp(receipt.subtotalPiasters)}</dd>
              </div>
              <div>
                <dt>Delivery</dt>
                <dd>{formatEgp(receipt.shippingPiasters)}</dd>
              </div>
              <div className="big">
                <dt>Total</dt>
                <dd>{formatEgp(receipt.totalPiasters)}</dd>
              </div>
            </dl>
            <div className="ok-to">
              <h3>Delivering to</h3>
              <p>
                {receipt.name}
                <br />
                {prettyPhone(receipt.phone)}
                <br />
                {receipt.area} · {receipt.address}
              </p>
              <h3>Payment</h3>
              <p>{cod ? "Cash on delivery" : "Card"}</p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
