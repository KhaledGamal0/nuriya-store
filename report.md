# UI/UX audit

2026-10-30T11:37:56.886Z · 0 findings

## Photos: 40 checked on 25 screens, 0 not loaded
- [mobile] home: 4 photos, all loaded
- [mobile] product-white: 4 photos, all loaded
- [mobile] product-burgundy: 4 photos, all loaded
- [mobile] size-guide: 0 photos, all loaded
- [mobile] returns: 0 photos, all loaded
- [mobile] checkout-empty: 0 photos, all loaded
- [mobile] order-done: 0 photos, all loaded
- [mobile] not-found: 0 photos, all loaded
- [mobile] photo-viewer: 3 photos, all loaded
- [mobile] bag-open: 1 photos, all loaded
- [mobile] checkout-with-bag: 1 photos, all loaded
- [mobile] thank-you: 1 photos, all loaded
- [desktop] home: 4 photos, all loaded
- [desktop] product-white: 4 photos, all loaded
- [desktop] product-burgundy: 4 photos, all loaded
- [desktop] size-guide: 0 photos, all loaded
- [desktop] returns: 0 photos, all loaded
- [desktop] checkout-empty: 0 photos, all loaded
- [desktop] order-done: 0 photos, all loaded
- [desktop] not-found: 0 photos, all loaded
- [desktop] photo-viewer: 3 photos, all loaded
- [desktop] bag-open: 1 photos, all loaded
- [desktop] checkout-with-bag: 1 photos, all loaded
- [desktop] thank-you: 1 photos, all loaded
- [mobile] home-after-slow-load: 4 photos, all loaded


## lighthouse (11)
- [mobile] /: performance 93 (budget 95)
- [mobile] /: LCP 3.19s (budget 2.0s)
- [mobile] /: JavaScript 183 KB transferred (budget 180)
- [mobile] /quiet-confidence/white: performance 93 (budget 95)
- [mobile] /quiet-confidence/white: LCP 3.12s (budget 2.0s)
- [mobile] /quiet-confidence/white: JavaScript 183 KB transferred (budget 180)
- [mobile] /quiet-confidence/burgundy: performance 92 (budget 95)
- [mobile] /quiet-confidence/burgundy: LCP 3.31s (budget 2.0s)
- [mobile] /quiet-confidence/burgundy: JavaScript 183 KB transferred (budget 180)
- [mobile] /checkout: JavaScript 190 KB transferred (budget 180)
- [mobile] /returns: JavaScript 182 KB transferred (budget 180)

# Lighthouse (mobile, simulated 4G, median of 3 runs)

| Page | Perf | A11y | Best pr. | SEO | LCP | CLS | TBT | JS |
|---|---|---|---|---|---|---|---|---|
| / | 93 | 100 | 100 | 100 | 3.19s | 0.000 | 83ms | 183 KB |
| /quiet-confidence/white | 93 | 100 | 100 | 100 | 3.12s | 0.000 | 89ms | 183 KB |
| /quiet-confidence/burgundy | 92 | 100 | 100 | 100 | 3.31s | 0.000 | 86ms | 183 KB |
| /checkout | 100 | 100 | 100 | 63 | 1.02s | 0.000 | 89ms | 190 KB |
| /returns | 97 | 100 | 100 | 100 | 0.99s | 0.000 | 197ms | 182 KB |

- /: Reduce unused JavaScript (~300 ms)
- /quiet-confidence/white: Reduce unused JavaScript (~190 ms)
- /quiet-confidence/burgundy: Reduce unused JavaScript (~250 ms)

### Details
- /: LCP element:  | phases: Time to first byte 12ms, Resource load delay 14ms, Resource load duration 11ms, Element render delay 78ms | render-blocking: none | biggest scripts: 0m7a9yen5gu1g.js 73KB, 148fxp3ob2q1l.js 46KB, 0t7w4bflmr0bd.js 24KB, 1s7nrul705d0r.js 11KB, 3koyarw6rgz08.js 8KB | fonts: 9KB + 9KB + 16KB | first image: 65KB
- /quiet-confidence/white: LCP element:  | phases: Time to first byte 11ms, Resource load delay 13ms, Resource load duration 24ms, Element render delay 60ms | render-blocking: none | biggest scripts: 0m7a9yen5gu1g.js 73KB, 148fxp3ob2q1l.js 46KB, 0t7w4bflmr0bd.js 24KB, 1s7nrul705d0r.js 11KB, 3koyarw6rgz08.js 8KB | fonts: 9KB + 9KB + 16KB | first image: 37KB
- /quiet-confidence/burgundy: LCP element:  | phases: Time to first byte 9ms, Resource load delay 16ms, Resource load duration 25ms, Element render delay 68ms | render-blocking: none | biggest scripts: 0m7a9yen5gu1g.js 73KB, 148fxp3ob2q1l.js 46KB, 0t7w4bflmr0bd.js 24KB, 1s7nrul705d0r.js 11KB, 3koyarw6rgz08.js 8KB | fonts: 9KB + 9KB + 16KB | first image: 102KB
- /checkout: LCP element:  | phases: Time to first byte 53ms, Element render delay 105ms | render-blocking: none | biggest scripts: 0m7a9yen5gu1g.js 73KB, 148fxp3ob2q1l.js 46KB, 0t7w4bflmr0bd.js 24KB, 1s7nrul705d0r.js 11KB, 3koyarw6rgz08.js 8KB | fonts: 9KB + 9KB + 16KB | first image: -
- /returns: LCP element:  | phases: Time to first byte 11ms, Element render delay 103ms | render-blocking: none | biggest scripts: 0m7a9yen5gu1g.js 73KB, 148fxp3ob2q1l.js 46KB, 0t7w4bflmr0bd.js 24KB, 1s7nrul705d0r.js 11KB, 3koyarw6rgz08.js 8KB | fonts: 9KB + 9KB + 16KB + 36KB | first image: -

## Stress and chaos (0 findings)
- All scenarios behaved correctly and the books balance.

| Measure | Result |
|---|---|
| page load: requests / errors | 2400 / 0 |
| page load: throughput | 275 req/s |
| page load: p50 / p95 / max | 185 / 237 / 442 ms |
| page load (time) | 8.7 s |
| crowd: all 30 answered in | 2.2 s |
| crowd: thank-you pages / sold-out messages | 10 / 20 |
| crowd: 30 buyers, 10 pieces (time) | 13.0 s |
| internet drops while ordering (time) | 2.0 s |
| order saved but the answer is lost (time) | 3.9 s |
| tampered bag (time) | 1.5 s |
| Arabic numerals and Arabic text (time) | 1.5 s |
| bot fills the hidden field (time) | 1.5 s |
| spam device: results | 30 orders, then limited |
| one device spamming orders (time) | 42.8 s |
| small 320 px phone (time) | 3.0 s |
| slow 3G: product page → thank-you page | 13.3 s |
| slow 3G, full purchase (time) | 13.4 s |
| refresh secret brute force (time) | 0.1 s |
| stress orders saved (all scenarios) | 45 |

## Database-down drill (0 findings)
- Shop pages stayed up, health reported the outage, checkout refused safely.
