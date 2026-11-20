# UI/UX audit

2026-11-20T20:27:54.887Z · 0 findings

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
- [mobile] /: performance 92 (budget 95)
- [mobile] /: LCP 3.28s (budget 2.0s)
- [mobile] /: JavaScript 184 KB transferred (budget 180)
- [mobile] /quiet-confidence/white: performance 94 (budget 95)
- [mobile] /quiet-confidence/white: LCP 3.01s (budget 2.0s)
- [mobile] /quiet-confidence/white: JavaScript 184 KB transferred (budget 180)
- [mobile] /quiet-confidence/burgundy: performance 94 (budget 95)
- [mobile] /quiet-confidence/burgundy: LCP 3.09s (budget 2.0s)
- [mobile] /quiet-confidence/burgundy: JavaScript 184 KB transferred (budget 180)
- [mobile] /checkout: JavaScript 191 KB transferred (budget 180)
- [mobile] /returns: JavaScript 182 KB transferred (budget 180)

# Lighthouse (mobile, simulated 4G, median of 3 runs)

| Page | Perf | A11y | Best pr. | SEO | LCP | CLS | TBT | JS |
|---|---|---|---|---|---|---|---|---|
| / | 92 | 100 | 100 | 100 | 3.28s | 0.000 | 68ms | 184 KB |
| /quiet-confidence/white | 94 | 100 | 100 | 100 | 3.01s | 0.000 | 90ms | 184 KB |
| /quiet-confidence/burgundy | 94 | 100 | 100 | 100 | 3.09s | 0.000 | 63ms | 184 KB |
| /checkout | 100 | 100 | 100 | 63 | 0.94s | 0.000 | 48ms | 191 KB |
| /returns | 100 | 100 | 100 | 100 | 0.96s | 0.000 | 52ms | 182 KB |

- /: Reduce unused JavaScript (~300 ms)
- /quiet-confidence/white: Reduce unused JavaScript (~300 ms)
- /quiet-confidence/burgundy: Reduce unused JavaScript (~300 ms)

### Details
- /: LCP element:  | phases: Time to first byte 11ms, Resource load delay 40ms, Resource load duration 14ms, Element render delay 65ms | render-blocking: none | biggest scripts: 00vh43f6_i_oy.js 72KB, 2b23rnl5a4r7f.js 47KB, 2cpp-6opo15_2.js 24KB, 2_l8xelhkrs92.js 11KB, 1f0kui785itr3.js 8KB | fonts: 9KB + 16KB + 9KB | first image: 65KB
- /quiet-confidence/white: LCP element:  | phases: Time to first byte 9ms, Resource load delay 52ms, Resource load duration 13ms, Element render delay 71ms | render-blocking: none | biggest scripts: 00vh43f6_i_oy.js 72KB, 2b23rnl5a4r7f.js 47KB, 2cpp-6opo15_2.js 24KB, 2_l8xelhkrs92.js 11KB, 1f0kui785itr3.js 8KB | fonts: 9KB + 16KB + 9KB | first image: 37KB
- /quiet-confidence/burgundy: LCP element:  | phases: Time to first byte 9ms, Resource load delay 40ms, Resource load duration 15ms, Element render delay 68ms | render-blocking: none | biggest scripts: 00vh43f6_i_oy.js 72KB, 2b23rnl5a4r7f.js 47KB, 2cpp-6opo15_2.js 24KB, 2_l8xelhkrs92.js 11KB, 1f0kui785itr3.js 8KB | fonts: 9KB + 16KB + 9KB | first image: 102KB
- /checkout: LCP element:  | phases: Time to first byte 10ms, Element render delay 84ms | render-blocking: none | biggest scripts: 00vh43f6_i_oy.js 72KB, 2b23rnl5a4r7f.js 47KB, 2cpp-6opo15_2.js 24KB, 2_l8xelhkrs92.js 11KB, 1f0kui785itr3.js 8KB | fonts: 9KB + 16KB + 9KB | first image: -
- /returns: LCP element:  | phases: Time to first byte 7ms, Element render delay 84ms | render-blocking: none | biggest scripts: 00vh43f6_i_oy.js 72KB, 2b23rnl5a4r7f.js 47KB, 2cpp-6opo15_2.js 24KB, 2_l8xelhkrs92.js 11KB, 1f0kui785itr3.js 8KB | fonts: 9KB + 16KB + 9KB + 36KB | first image: -

## Stress and chaos (0 findings)
- All scenarios behaved correctly and the books balance.

| Measure | Result |
|---|---|
| page load: requests / errors | 2400 / 0 |
| page load: throughput | 347 req/s |
| page load: p50 / p95 / max | 148 / 196 / 352 ms |
| page load (time) | 6.9 s |
| crowd: all 30 answered in | 1.6 s |
| crowd: thank-you pages / sold-out messages | 10 / 20 |
| crowd: 30 buyers, 10 pieces (time) | 8.9 s |
| internet drops while ordering (time) | 1.9 s |
| order saved but the answer is lost (time) | 3.8 s |
| tampered bag (time) | 1.4 s |
| Arabic numerals and Arabic text (time) | 1.4 s |
| bot fills the hidden field (time) | 1.4 s |
| spam device: results | 30 orders, then limited |
| one device spamming orders (time) | 41.4 s |
| small 320 px phone (time) | 2.9 s |
| slow 3G: product page → thank-you page | 13.4 s |
| slow 3G, full purchase (time) | 13.4 s |
| refresh secret brute force (time) | 0.1 s |
| stress orders saved (all scenarios) | 45 |

## Database-down drill (0 findings)
- Shop pages stayed up, health reported the outage, checkout refused safely.
