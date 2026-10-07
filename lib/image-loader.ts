/**
 * Photos are prepared ahead of time by scripts/make-images.py (public/img/<name>-<width>.webp), so no photo
 * is ever resized while a customer waits: every visitor, including the first after a change, gets a finished
 * file straight from Vercel's global network. Anything that is not a shop photo is served as it is.
 */
export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  const m = /^\/images\/([\w-]+)\.jpg$/.exec(src);
  return m ? `/img/${m[1]}-${width}.webp` : src;
}
