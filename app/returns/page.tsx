import type { Metadata } from "next";
import { areasByFee } from "@/lib/shipping";
import { formatEgp } from "@/lib/money";

export const metadata: Metadata = { title: "Delivery and returns" };

export default function ReturnsPage() {
  return (
    <div className="wrap done">
      <h1>Delivery and returns</h1>

      <section style={{ display: "grid", gap: "var(--s1)" }} aria-labelledby="ret-en">
        <h2 id="ret-en" style={{ fontSize: 28 }}>Returns and exchanges</h2>
        <p><b style={{ fontWeight: 500 }}>Before you accept.</b> Open your parcel and check the size and the item while the courier is still with you.</p>
        <p><b style={{ fontWeight: 500 }}>After the courier leaves.</b> Once the order is accepted and the courier has left, returns and exchanges are closed.</p>
        <p className="small">Please check your size and item before accepting.</p>
      </section>

      <section lang="ar" dir="rtl" style={{ display: "grid", gap: "var(--s1)", width: "100%" }} aria-labelledby="ret-ar">
        <h2 id="ret-ar" style={{ fontSize: 26, fontFamily: "var(--body)", fontWeight: 500 }}>سياسة الاسترجاع والاستبدال</h2>
        <p><b style={{ fontWeight: 500 }}>قبل الاستلام.</b> يمكنك فتح الطلب والتأكد من المقاس والمنتج أثناء وجود مندوب الشحن معك.</p>
        <p><b style={{ fontWeight: 500 }}>بعد مغادرة المندوب.</b> بعد قبول الطلب ومغادرة المندوب، لا يمكننا قبول الاسترجاع أو الاستبدال.</p>
        <p className="small">نرجو التأكد من المقاس والمنتج قبل استلام الطلب.</p>
      </section>

      <section style={{ display: "grid", gap: "var(--s1)", width: "100%" }} aria-labelledby="del">
        <h2 id="del" style={{ fontSize: 28 }}>Delivery fees</h2>
        <table className="tbl">
          <tbody>
            {areasByFee().map((g) => (
              <tr key={g.feePiasters}>
                <td>{g.areas.map((a) => a.nameEn).join(", ")}</td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>{formatEgp(g.feePiasters)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
