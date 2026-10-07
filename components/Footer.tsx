import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="ft">
          <div>
            <Logo className="logo" />
            <p className="small" style={{ marginTop: "var(--s1)" }}>comfy · everyday pieces</p>
          </div>
          <div>
            <h2>Shop</h2>
            <ul>
              <li><Link href="/quiet-confidence/cream">Cream</Link></li>
              <li><Link href="/quiet-confidence/burgundy">Burgundy</Link></li>
            </ul>
          </div>
          <div>
            <h2>Help</h2>
            <ul>
              <li><Link href="/size-guide">Size guide</Link></li>
              <li><Link href="/returns">Delivery and returns</Link></li>
              <li><a href="https://www.instagram.com/nuriya.eg" target="_blank" rel="noopener noreferrer">Instagram @nuriya.eg</a></li>
            </ul>
          </div>
        </div>
        <p className="small ft-b">© {new Date().getFullYear()} Nuriya, Cairo</p>
      </div>
    </footer>
  );
}
