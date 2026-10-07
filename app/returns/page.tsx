import type { Metadata } from "next";
import { ReturnsPolicy } from "@/components/ReturnsPolicy";
import { areasByFee, MIN_FEE_PIASTERS } from "@/lib/shipping";
import { formatEgp } from "@/lib/money";

export const metadata: Metadata = {
  title: "Delivery and returns",
  description: "Delivery fees across Egypt, payment options, and how returns work at Nuriya.",
};

export default function ReturnsPage() {
  return (
    <div className="wrap page">
      <header className="page-h">
        <p className="label">Customer care</p>
        <h1>Delivery and returns</h1>
        <p>We deliver across Egypt by courier. You can open your order and check it before you pay or accept.</p>
      </header>

      <ReturnsPolicy />

      <section className="page-sec" aria-labelledby="fees-title">
        <h2 id="fees-title">Delivery fees</h2>
        <ul className="fees">
          {areasByFee().map((g) => (
            <li key={g.feePiasters}>
              <div>
                <b>{g.label}</b>
                {!(g.areas.length === 1 && g.areas[0]!.nameEn === g.label) && <small>{g.areas.map((a) => a.nameEn).join(" · ")}</small>}
              </div>
              <span className="fee">{formatEgp(g.feePiasters)}</span>
            </li>
          ))}
        </ul>
        <p className="small">The exact fee for your area shows at checkout, from {formatEgp(MIN_FEE_PIASTERS)}.</p>
      </section>

      <section className="page-sec" aria-labelledby="pay-title">
        <h2 id="pay-title">Payment</h2>
        <ul className="fees">
          <li>
            <div>
              <b>Cash on delivery</b>
              <small>Pay the courier when your order arrives.</small>
            </div>
          </li>
          <li>
            <div>
              <b>Card</b>
              <small>Visa or Mastercard on a secure Paymob page. Your card details never reach our website.</small>
            </div>
          </li>
        </ul>
      </section>

      <section className="page-sec" aria-labelledby="help-title">
        <h2 id="help-title">Questions?</h2>
        <p style={{ color: "var(--ink-2)" }}>Message us on Instagram and we will help with sizing, orders and delivery.</p>
        <a className="btn btn-line" href="https://www.instagram.com/nuriya.eg" target="_blank" rel="noopener noreferrer">
          Message @nuriya.eg
        </a>
      </section>
    </div>
  );
}
