import Link from "next/link";
import { Logo } from "./Logo";
import { cardPaymentsEnabled } from "@/lib/orders";

const INSTAGRAM = "https://www.instagram.com/nuriya.eg";

export function Footer() {
  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="ft-top reveal">
          <p>Not loud. Just unforgettable.</p>
          <a className="btn btn-line" href={INSTAGRAM} target="_blank" rel="noopener noreferrer">
            Follow @nuriya.eg
          </a>
        </div>

        <div className="ft">
          <div className="ft-brand">
            <Logo className="logo" />
            <p className="small">comfy · everyday pieces. Made in Cairo.</p>
          </div>
          <nav aria-labelledby="ft-shop">
            <h2 id="ft-shop">Shop</h2>
            <ul>
              <li><Link className="line-link" href="/quiet-confidence/white">White</Link></li>
              <li><Link className="line-link" href="/quiet-confidence/burgundy">Burgundy</Link></li>
            </ul>
          </nav>
          <nav aria-labelledby="ft-help">
            <h2 id="ft-help">Help</h2>
            <ul>
              <li><Link className="line-link" href="/size-guide">Size guide</Link></li>
              <li><Link className="line-link" href="/returns">Delivery and returns</Link></li>
            </ul>
          </nav>
          <nav aria-labelledby="ft-follow">
            <h2 id="ft-follow">Follow</h2>
            <ul>
              <li><a className="line-link" href={INSTAGRAM} target="_blank" rel="noopener noreferrer">Instagram</a></li>
              <li><span className="small">Tag us to get featured</span></li>
            </ul>
          </nav>
        </div>

        <div className="ft-b">
          <span>© {new Date().getFullYear()} Nuriya · Cairo, Egypt</span>
          <span>{cardPaymentsEnabled() ? "Cash on delivery · Visa · Mastercard" : "Cash on delivery across Egypt"}</span>
        </div>
      </div>
    </footer>
  );
}
