# Lighthouse (mobile, simulated 4G, median of 3 runs)

| Page | Perf | A11y | Best pr. | SEO | LCP | CLS | TBT | JS |
|---|---|---|---|---|---|---|---|---|
| / | 96 | 100 | 100 | 100 | 2.60s | 0.000 | 95ms | 176 KB |
| /quiet-confidence/white | 92 | 100 | 100 | 100 | 3.22s | 0.000 | 112ms | 176 KB |
| /quiet-confidence/burgundy | 92 | 100 | 100 | 100 | 3.33s | 0.000 | 78ms | 176 KB |
| /checkout | 96 | 100 | 100 | 63 | 2.16s | 0.000 | 175ms | 181 KB |
| /returns | 93 | 100 | 100 | 100 | 2.96s | 0.000 | 159ms | 174 KB |

- /quiet-confidence/white: Reduce unused JavaScript (~150 ms)
- /quiet-confidence/burgundy: Reduce unused JavaScript (~150 ms)
- /returns: Reduce unused JavaScript (~150 ms)

### Details
- /: LCP element:  | phases: Time to first byte 13ms, Resource load delay 16ms, Resource load duration 7ms, Element render delay 61ms | render-blocking: none | biggest scripts: 3i_kwhzvotacq.js 72KB, 020fcnt65rc4z.js 46KB, 1i2pz9v42h-jz.js 19KB, 0fgkdx75o3nm6.js 13KB, 3koyarw6rgz08.js 8KB | fonts: 8KB + 8KB + 15KB | first image: 64KB
- /quiet-confidence/white: LCP element:  | phases: Time to first byte 11ms, Resource load delay 17ms, Resource load duration 6ms, Element render delay 76ms | render-blocking: none | biggest scripts: 3i_kwhzvotacq.js 72KB, 020fcnt65rc4z.js 46KB, 1i2pz9v42h-jz.js 19KB, 0fgkdx75o3nm6.js 13KB, 3koyarw6rgz08.js 8KB | fonts: 8KB + 8KB + 15KB | first image: 37KB
- /quiet-confidence/burgundy: LCP element:  | phases: Time to first byte 11ms, Resource load delay 14ms, Resource load duration 27ms, Element render delay 65ms | render-blocking: none | biggest scripts: 3i_kwhzvotacq.js 72KB, 020fcnt65rc4z.js 46KB, 1i2pz9v42h-jz.js 19KB, 0fgkdx75o3nm6.js 13KB, 3koyarw6rgz08.js 8KB | fonts: 8KB + 8KB + 15KB | first image: 101KB
- /checkout: LCP element:  | phases: Time to first byte 11ms, Element render delay 80ms | render-blocking: none | biggest scripts: 3i_kwhzvotacq.js 72KB, 020fcnt65rc4z.js 46KB, 1i2pz9v42h-jz.js 19KB, 0fgkdx75o3nm6.js 13KB, 3koyarw6rgz08.js 8KB | fonts: 8KB + 8KB + 15KB | first image: -
- /returns: LCP element:  | phases: Time to first byte 10ms, Element render delay 93ms | render-blocking: none | biggest scripts: 3i_kwhzvotacq.js 72KB, 020fcnt65rc4z.js 46KB, 1i2pz9v42h-jz.js 19KB, 0fgkdx75o3nm6.js 13KB, 3koyarw6rgz08.js 8KB | fonts: 8KB + 8KB + 15KB + 36KB | first image: -
