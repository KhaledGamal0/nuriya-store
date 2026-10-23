"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { pixel, pixelReturning } from "@/lib/pixel";

/** Meta Pixel: Meta's script after the page has loaded, and PageView on every in-site page change. */
export function MetaPixel() {
  const path = usePathname();
  const first = useRef(true);
  // A returning buyer: matched by her scrambled id from her last order (once per page load).
  useEffect(() => pixelReturning(), []);
  useEffect(() => {
    // The first PageView is sent by the start-up snippet below; later ones on each in-site navigation.
    if (first.current) {
      first.current = false;
      return;
    }
    pixel("PageView");
  }, [path]);

  return (
    <>
      <Script src="https://connect.facebook.net/en_US/fbevents.js" strategy="lazyOnload" />
    </>
  );
}
