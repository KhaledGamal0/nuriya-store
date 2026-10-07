"use client";

import { useState } from "react";

const COPY = {
  en: {
    steps: [
      { title: "Before you accept", body: "Open your parcel and check the size and the item while the courier is still with you." },
      { title: "After the courier leaves", body: "Once the order is accepted and the courier has left, returns and exchanges are closed." },
    ],
    note: "Please check your size and item before accepting.",
  },
  ar: {
    steps: [
      { title: "قبل الاستلام", body: "يمكنك فتح الطلب والتأكد من المقاس والمنتج أثناء وجود مندوب الشحن معك." },
      { title: "بعد مغادرة المندوب", body: "بعد قبول الطلب ومغادرة المندوب، لا يمكننا قبول الاسترجاع أو الاستبدال." },
    ],
    note: "نرجو التأكد من المقاس والمنتج قبل استلام الطلب.",
  },
} as const;

/** The approved returns policy (docs/04-policies.md), in English or Arabic. */
export function ReturnsPolicy() {
  const [lang, setLang] = useState<"en" | "ar">("en");
  const copy = COPY[lang];

  return (
    <section className="page-sec" aria-labelledby="returns-title">
      <div className="page-sec-h">
        <h2 id="returns-title">Returns and exchanges</h2>
        <div className="seg" role="group" aria-label="Language">
          <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>
            English
          </button>
          <button type="button" lang="ar" aria-pressed={lang === "ar"} onClick={() => setLang("ar")}>
            العربية
          </button>
        </div>
      </div>

      <div lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} style={{ display: "grid", gap: "var(--s2)" }}>
        <ol className="steps" style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {copy.steps.map((s, i) => (
            <li className="step" key={s.title}>
              <span className="step-n" aria-hidden="true">
                0{i + 1}
              </span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
        <p className="note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
          <span>{copy.note}</span>
        </p>
      </div>
    </section>
  );
}
