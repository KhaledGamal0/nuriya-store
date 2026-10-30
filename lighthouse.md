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
