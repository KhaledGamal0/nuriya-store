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
