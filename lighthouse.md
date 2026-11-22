# Lighthouse (mobile, simulated 4G, median of 3 runs)

| Page | Perf | A11y | Best pr. | SEO | LCP | CLS | TBT | JS |
|---|---|---|---|---|---|---|---|---|
| / | 93 | 100 | 100 | 100 | 3.19s | 0.000 | 61ms | 184 KB |
| /quiet-confidence/white | 93 | 100 | 100 | 100 | 3.11s | 0.000 | 127ms | 184 KB |
| /quiet-confidence/burgundy | 92 | 100 | 100 | 100 | 3.26s | 0.000 | 93ms | 184 KB |
| /checkout | 100 | 100 | 100 | 63 | 0.95s | 0.000 | 65ms | 191 KB |
| /returns | 99 | 100 | 100 | 100 | 0.95s | 0.000 | 126ms | 182 KB |

- /: Reduce unused JavaScript (~300 ms)
- /quiet-confidence/white: Reduce unused JavaScript (~190 ms)
- /quiet-confidence/burgundy: Reduce unused JavaScript (~190 ms)

### Details
- /: LCP element:  | phases: Time to first byte 12ms, Resource load delay 20ms, Resource load duration 18ms, Element render delay 68ms | render-blocking: none | biggest scripts: 00vh43f6_i_oy.js 72KB, 2b23rnl5a4r7f.js 47KB, 2cpp-6opo15_2.js 24KB, 2_l8xelhkrs92.js 11KB, 1f0kui785itr3.js 8KB | fonts: 9KB + 16KB + 9KB | first image: 65KB
- /quiet-confidence/white: LCP element:  | phases: Time to first byte 8ms, Resource load delay 56ms, Resource load duration 17ms, Element render delay 62ms | render-blocking: none | biggest scripts: 00vh43f6_i_oy.js 72KB, 2b23rnl5a4r7f.js 47KB, 2cpp-6opo15_2.js 24KB, 2_l8xelhkrs92.js 11KB, 1f0kui785itr3.js 8KB | fonts: 9KB + 16KB + 9KB | first image: 37KB
- /quiet-confidence/burgundy: LCP element:  | phases: Time to first byte 9ms, Resource load delay 35ms, Resource load duration 18ms, Element render delay 81ms | render-blocking: none | biggest scripts: 00vh43f6_i_oy.js 72KB, 2b23rnl5a4r7f.js 47KB, 2cpp-6opo15_2.js 24KB, 2_l8xelhkrs92.js 11KB, 1f0kui785itr3.js 8KB | fonts: 9KB + 16KB + 9KB | first image: 102KB
- /checkout: LCP element:  | phases: Time to first byte 12ms, Element render delay 89ms | render-blocking: none | biggest scripts: 00vh43f6_i_oy.js 72KB, 2b23rnl5a4r7f.js 47KB, 2cpp-6opo15_2.js 24KB, 2_l8xelhkrs92.js 11KB, 1f0kui785itr3.js 8KB | fonts: 9KB + 16KB + 9KB | first image: -
- /returns: LCP element:  | phases: Time to first byte 11ms, Element render delay 137ms | render-blocking: none | biggest scripts: 00vh43f6_i_oy.js 72KB, 2b23rnl5a4r7f.js 47KB, 2cpp-6opo15_2.js 24KB, 2_l8xelhkrs92.js 11KB, 1f0kui785itr3.js 8KB | fonts: 9KB + 16KB + 9KB + 36KB | first image: -
