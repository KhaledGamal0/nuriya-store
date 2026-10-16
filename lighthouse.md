# Lighthouse (mobile, simulated 4G, median of 3 runs)

| Page | Perf | A11y | Best pr. | SEO | LCP | CLS | TBT | JS |
|---|---|---|---|---|---|---|---|---|
| / | 92 | 100 | 100 | 100 | 3.20s | 0.000 | 132ms | 177 KB |
| /quiet-confidence/white | 94 | 100 | 100 | 100 | 3.05s | 0.000 | 107ms | 177 KB |
| /quiet-confidence/burgundy | 92 | 100 | 100 | 100 | 3.20s | 0.000 | 92ms | 177 KB |
| /checkout | 95 | 100 | 100 | 63 | 2.64s | 0.000 | 139ms | 183 KB |
| /returns | 95 | 100 | 100 | 100 | 2.80s | 0.000 | 75ms | 175 KB |

- /: Reduce unused JavaScript (~300 ms)
- /quiet-confidence/white: Reduce unused JavaScript (~300 ms)
- /quiet-confidence/burgundy: Reduce unused JavaScript (~300 ms)
- /checkout: Reduce unused JavaScript (~300 ms)
- /returns: Reduce unused JavaScript (~240 ms)

### Details
- /: LCP element:  | phases: Time to first byte 49ms, Resource load delay 16ms, Resource load duration 27ms, Element render delay 72ms | render-blocking: none | biggest scripts: 3i_kwhzvotacq.js 72KB, 020fcnt65rc4z.js 46KB, 44zxqajidrajy.js 23KB, 41xgj1a_vb74r.js 10KB, 3koyarw6rgz08.js 8KB | fonts: 8KB + 8KB + 15KB | first image: 64KB
- /quiet-confidence/white: LCP element:  | phases: Time to first byte 11ms, Resource load delay 16ms, Resource load duration 23ms, Element render delay 77ms | render-blocking: none | biggest scripts: 3i_kwhzvotacq.js 72KB, 020fcnt65rc4z.js 46KB, 44zxqajidrajy.js 23KB, 41xgj1a_vb74r.js 10KB, 3koyarw6rgz08.js 8KB | fonts: 8KB + 8KB + 15KB | first image: 37KB
- /quiet-confidence/burgundy: LCP element:  | phases: Time to first byte 10ms, Resource load delay 15ms, Resource load duration 11ms, Element render delay 82ms | render-blocking: none | biggest scripts: 3i_kwhzvotacq.js 72KB, 020fcnt65rc4z.js 46KB, 44zxqajidrajy.js 23KB, 41xgj1a_vb74r.js 10KB, 3koyarw6rgz08.js 8KB | fonts: 8KB + 8KB + 15KB | first image: 101KB
- /checkout: LCP element:  | phases: Time to first byte 74ms, Element render delay 88ms | render-blocking: none | biggest scripts: 3i_kwhzvotacq.js 72KB, 020fcnt65rc4z.js 46KB, 44zxqajidrajy.js 23KB, 41xgj1a_vb74r.js 10KB, 3koyarw6rgz08.js 8KB | fonts: 8KB + 8KB + 15KB | first image: -
- /returns: LCP element:  | phases: Time to first byte 10ms, Element render delay 117ms | render-blocking: none | biggest scripts: 3i_kwhzvotacq.js 72KB, 020fcnt65rc4z.js 46KB, 44zxqajidrajy.js 23KB, 41xgj1a_vb74r.js 10KB, 3koyarw6rgz08.js 8KB | fonts: 8KB + 8KB + 15KB + 36KB | first image: -
