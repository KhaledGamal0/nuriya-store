"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

/**
 * A photo that fades in softly once it has loaded, over its frame's colour preview. Used for photos below
 * the first screen. The first photo of a page uses plain <Image priority> (no fade) so it shows as early as possible.
 * Safety: CSS shows the photo after 3 s even if this code never runs.
 */
export function FadeImage({ className, onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  return (
    <Image
      {...props}
      className={className ? `fade ${className}` : "fade"}
      data-loaded={loaded ? "" : undefined}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
    />
  );
}
