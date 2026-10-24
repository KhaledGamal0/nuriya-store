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
