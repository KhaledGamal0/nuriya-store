# UI/UX audit

2026-10-24T01:29:54.495Z · 0 findings

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


## lighthouse (8)
- [mobile] /: LCP 2.60s (budget 2.0s)
- [mobile] /quiet-confidence/white: performance 94 (budget 95)
- [mobile] /quiet-confidence/white: LCP 3.04s (budget 2.0s)
- [mobile] /quiet-confidence/burgundy: performance 92 (budget 95)
- [mobile] /quiet-confidence/burgundy: LCP 3.23s (budget 2.0s)
- [mobile] /checkout: LCP 2.61s (budget 2.0s)
- [mobile] /checkout: JavaScript 183 KB transferred (budget 180)
- [mobile] /returns: LCP 2.77s (budget 2.0s)

# Lighthouse (mobile, simulated 4G, median of 3 runs)

| Page | Perf | A11y | Best pr. | SEO | LCP | CLS | TBT | JS |
|---|---|---|---|---|---|---|---|---|
| / | 96 | 100 | 100 | 100 | 2.60s | 0.000 | 111ms | 177 KB |
| /quiet-confidence/white | 94 | 100 | 100 | 100 | 3.04s | 0.000 | 84ms | 177 KB |
| /quiet-confidence/burgundy | 92 | 100 | 100 | 100 | 3.23s | 0.000 | 83ms | 177 KB |
| /checkout | 96 | 100 | 100 | 63 | 2.61s | 0.000 | 126ms | 183 KB |
| /returns | 96 | 100 | 100 | 100 | 2.77s | 0.000 | 58ms | 176 KB |

- /quiet-confidence/white: Reduce unused JavaScript (~300 ms)
- /quiet-confidence/burgundy: Reduce unused JavaScript (~300 ms)
- /checkout: Reduce unused JavaScript (~300 ms)
- /returns: Reduce unused JavaScript (~210 ms)

### Details
- /: LCP element:  | phases: Time to first byte 32ms, Resource load delay 14ms, Resource load duration 9ms, Element render delay 77ms | render-blocking: none | biggest scripts: 3i_kwhzvotacq.js 72KB, 020fcnt65rc4z.js 46KB, 0zzudobbjxo04.js 23KB, 41xgj1a_vb74r.js 10KB, 3koyarw6rgz08.js 8KB | fonts: 8KB + 8KB + 15KB | first image: 64KB
- /quiet-confidence/white: LCP element:  | phases: Time to first byte 15ms, Resource load delay 16ms, Resource load duration 8ms, Element render delay 71ms | render-blocking: none | biggest scripts: 3i_kwhzvotacq.js 72KB, 020fcnt65rc4z.js 46KB, 0zzudobbjxo04.js 23KB, 41xgj1a_vb74r.js 10KB, 3koyarw6rgz08.js 8KB | fonts: 8KB + 8KB + 15KB | first image: 37KB
- /quiet-confidence/burgundy: LCP element:  | phases: Time to first byte 9ms, Resource load delay 14ms, Resource load duration 22ms, Element render delay 71ms | render-blocking: none | biggest scripts: 3i_kwhzvotacq.js 72KB, 020fcnt65rc4z.js 46KB, 0zzudobbjxo04.js 23KB, 41xgj1a_vb74r.js 10KB, 3koyarw6rgz08.js 8KB | fonts: 8KB + 8KB + 15KB | first image: 101KB
- /checkout: LCP element:  | phases: Time to first byte 17ms, Element render delay 86ms | render-blocking: none | biggest scripts: 3i_kwhzvotacq.js 72KB, 020fcnt65rc4z.js 46KB, 0zzudobbjxo04.js 23KB, 41xgj1a_vb74r.js 10KB, 3koyarw6rgz08.js 8KB | fonts: 8KB + 8KB + 15KB | first image: -
- /returns: LCP element:  | phases: Time to first byte 9ms, Element render delay 101ms | render-blocking: none | biggest scripts: 3i_kwhzvotacq.js 72KB, 020fcnt65rc4z.js 46KB, 0zzudobbjxo04.js 23KB, 41xgj1a_vb74r.js 10KB, 3koyarw6rgz08.js 8KB | fonts: 8KB + 8KB + 15KB + 36KB | first image: -

## Stress and chaos (0 findings)
- All scenarios behaved correctly and the books balance.

| Measure | Result |
|---|---|
| page load: requests / errors | 2400 / 0 |
| page load: throughput | 289 req/s |
| page load: p50 / p95 / max | 174 / 238 / 475 ms |
| page load (time) | 8.3 s |
| crowd: all 30 answered in | 2.3 s |
| crowd: thank-you pages / sold-out messages | 10 / 20 |
| crowd: 30 buyers, 10 pieces (time) | 10.0 s |
| internet drops while ordering (time) | 1.7 s |
| order saved but the answer is lost (time) | 3.6 s |
| tampered bag (time) | 1.3 s |
| Arabic numerals and Arabic text (time) | 1.2 s |
| bot fills the hidden field (time) | 1.2 s |
| spam device: results | 30 orders, then limited |
| one device spamming orders (time) | 36.7 s |
| small 320 px phone (time) | 3.1 s |
| slow 3G: product page → thank-you page | 12.9 s |
| slow 3G, full purchase (time) | 13.0 s |
| refresh secret brute force (time) | 0.1 s |
| stress orders saved (all scenarios) | 45 |

## Database-down drill (0 findings)
- Shop pages stayed up, health reported the outage, checkout refused safely.
