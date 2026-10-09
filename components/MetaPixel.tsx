"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { pixel } from "@/lib/pixel";

/**
 * Meta Pixel: the tiny queue (fbInit, in the layout, runs before the page starts) collects events;
 * Meta's own script arrives after the page has loaded; PageView is sent on every page change.
 */
export const fbInit = (id: string) =>
  `!function(f,n){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[]}(window);fbq('init','${id}');fbq('track','PageView');`;

export function MetaPixel() {
  const path = usePathname();
  const first = useRef(true);
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
