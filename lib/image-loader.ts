// Every photo is prepared ahead of time by scripts/make-images.py (public/img/<name>-<width>.webp), so the
// browser downloads a finished file from Vercel's global network: nothing is resized while a customer waits.
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  const m = /^\/images\/([\w-]+)\.jpg$/.exec(src);
  return m ? `/img/${m[1]}-${width}.webp` : src;
}
