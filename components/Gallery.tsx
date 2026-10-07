"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { ProductImage } from "@/lib/catalog";

export function Gallery({ images, label }: { images: readonly ProductImage[]; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  return (
    <div>
      <div
        ref={ref}
        className="gal"
        tabIndex={0}
        role="region"
        aria-label={`${label} photos. Swipe or scroll for more.`}
        onScroll={() => {
          const el = ref.current;
          if (el) setActive(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {images.map((img, i) => (
          <div className="gal-i" key={img.src}>
            <Image
              src={img.src}
              alt={img.alt}
              fill
              priority={i === 0}
              sizes="(min-width: 900px) 40vw, 100vw"
            />
          </div>
        ))}
      </div>
      <div className="gal-bar" aria-hidden="true">
        {images.map((img, i) => (
          <i key={img.src} data-on={i === active ? "true" : "false"} />
        ))}
      </div>
    </div>
  );
}
