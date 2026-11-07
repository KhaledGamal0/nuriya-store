# Lighthouse (mobile, simulated 4G, median of 3 runs)

| Page | Perf | A11y | Best pr. | SEO | LCP | CLS | TBT | JS |
|---|---|---|---|---|---|---|---|---|
| / | 93 | 100 | 100 | 100 | 3.18s | 0.000 | 68ms | 183 KB |
| /quiet-confidence/white | 93 | 100 | 100 | 100 | 3.11s | 0.000 | 103ms | 183 KB |
| /quiet-confidence/burgundy | 92 | 100 | 100 | 100 | 3.26s | 0.000 | 75ms | 183 KB |
| /checkout | 100 | 100 | 100 | 63 | 0.94s | 0.000 | 65ms | 190 KB |
| /returns | 99 | 100 | 100 | 100 | 0.95s | 0.000 | 147ms | 182 KB |

- /: Reduce unused JavaScript (~180 ms)
- /quiet-confidence/white: Reduce unused JavaScript (~190 ms)
- /quiet-confidence/burgundy: Reduce unused JavaScript (~190 ms)

### Details
- /: LCP element:  | phases: Time to first byte 9ms, Resource load delay 45ms, Resource load duration 14ms, Element render delay 55ms | render-blocking: none | biggest scripts: 0m7a9yen5gu1g.js 73KB, 148fxp3ob2q1l.js 46KB, 0t7w4bflmr0bd.js 24KB, 1s7nrul705d0r.js 11KB, 3koyarw6rgz08.js 8KB | fonts: 9KB + 9KB + 16KB | first image: 65KB
- /quiet-confidence/white: LCP element:  | phases: Time to first byte 8ms, Resource load delay 51ms, Resource load duration 15ms, Element render delay 58ms | render-blocking: none | biggest scripts: 0m7a9yen5gu1g.js 73KB, 148fxp3ob2q1l.js 46KB, 0t7w4bflmr0bd.js 24KB, 1s7nrul705d0r.js 11KB, 3koyarw6rgz08.js 8KB | fonts: 9KB + 9KB + 16KB | first image: 37KB
- /quiet-confidence/burgundy: LCP element:  | phases: Time to first byte 8ms, Resource load delay 26ms, Resource load duration 14ms, Element render delay 59ms | render-blocking: none | biggest scripts: 0m7a9yen5gu1g.js 73KB, 148fxp3ob2q1l.js 46KB, 0t7w4bflmr0bd.js 24KB, 1s7nrul705d0r.js 11KB, 3koyarw6rgz08.js 8KB | fonts: 9KB + 9KB + 16KB | first image: 102KB
- /checkout: LCP element:  | phases: Time to first byte 48ms, Element render delay 77ms | render-blocking: none | biggest scripts: 0m7a9yen5gu1g.js 73KB, 148fxp3ob2q1l.js 46KB, 0t7w4bflmr0bd.js 24KB, 1s7nrul705d0r.js 11KB, 3koyarw6rgz08.js 8KB | fonts: 9KB + 9KB + 16KB | first image: -
- /returns: LCP element:  | phases: Time to first byte 9ms, Element render delay 103ms | render-blocking: none | biggest scripts: 0m7a9yen5gu1g.js 73KB, 148fxp3ob2q1l.js 46KB, 0t7w4bflmr0bd.js 24KB, 1s7nrul705d0r.js 11KB, 3koyarw6rgz08.js 8KB | fonts: 9KB + 9KB + 16KB + 36KB | first image: -
