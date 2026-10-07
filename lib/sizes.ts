/**
 * `sizes` for photos that fill the phone screen. 3x iPhones would otherwise download the 1200 px file;
 * the 828 px one looks the same at phone size and is about half the bytes, so it appears much sooner on 4G.
 * (3x: 70vw of 390 px × 3 ≈ 820 px → 828 file; 2x phones already get 828.) Computers are not affected.
 */
export const PHONE_FULL = "(min-resolution: 3dppx) 70vw, 100vw";
