import type { ReactNode } from "react";

/**
 * Re-mounts on every navigation (so switching colour starts the gallery at photo 1). No fade: pages are pre-built and appear instantly, and a fade-in
 * delays what visitors see (and the LCP metric) by its full duration.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
