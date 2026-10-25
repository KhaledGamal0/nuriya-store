"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { pixelBoth } from "@/lib/pixel";

/**
 * Meta Pixel: Meta's script after the page has loaded, and PageView on the first page and every in-site page
 * change — browser + server copy with one event id (the start-up snippet only queues; Meta's script sends later).
 */
export function MetaPixel() {
  const path = usePathname();
  useEffect(() => pixelBoth("PageView", {}), [path]);

  return (
    <>
      <Script src="https://connect.facebook.net/en_US/fbevents.js" strategy="lazyOnload" />
    </>
  );
}
