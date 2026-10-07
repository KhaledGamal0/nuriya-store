"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ProductImage } from "@/lib/catalog";
import { Dialog, CloseButton } from "./Dialog";
import { preview } from "@/lib/blur";
import { PHONE_FULL } from "@/lib/sizes";

function Arrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d={dir === "prev" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

/** Product photos: swipe on phones, grid on desktop. Tap any photo to open it full screen. */
export function Gallery({ images, label }: { images: readonly ProductImage[]; label: string }) {
  const strip = useRef<HTMLDivElement>(null);
  const viewer = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [viewIndex, setViewIndex] = useState(0);
  const total = images.length;

  const goStrip = (i: number) => strip.current?.scrollTo({ left: i * strip.current.clientWidth, behavior: "smooth" });
  const goViewer = (i: number) => {
    const n = Math.max(0, Math.min(total - 1, i));
    viewer.current?.scrollTo({ left: n * viewer.current.clientWidth, behavior: "smooth" });
  };

  // Open the viewer on the photo that was tapped.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      if (viewer.current) viewer.current.scrollLeft = viewIndex * viewer.current.clientWidth;
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  return (
    <div className="gal-wrap">
      <div
        ref={strip}
        className="gal"
        role="region"
        aria-label={`${label} photos`}
        onScroll={() => {
          const el = strip.current;
          if (el) setActive(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {images.map((img, i) => (
          <button
            type="button"
            className="gal-i"
            key={img.src}
            style={preview(img.src)}
            onClick={() => {
              setViewIndex(i);
              setOpen(true);
            }}
            aria-label={`Open photo ${i + 1} of ${total} full screen`}
          >
            {/* All product photos load straight away: the first at top priority, the rest just behind it.
                Lazy loading inside a sideways gallery is unreliable on iPhone (photos could stay blank).
                decoding="sync": a photo already downloaded is painted together with its frame, never one
                frame later (async decoding showed the colour frame for a moment, mostly on iPhones). */}
            <Image
              src={img.src}
              alt={img.alt}
              fill
              quality={65}
              sizes={`(min-width: 900px) 30vw, ${PHONE_FULL}`}
              decoding="sync"
              {...(i === 0 ? { priority: true } : { loading: "eager" as const, fetchPriority: "low" as const })}
            />
          </button>
        ))}
      </div>
      <span className="gal-count" aria-hidden="true">
        {active + 1} / {total}
      </span>
      <div className="gal-bar" role="group" aria-label="Choose photo">
        {images.map((img, i) => (
          <button key={img.src} type="button" onClick={() => goStrip(i)} aria-label={`Photo ${i + 1}`} aria-current={i === active ? "true" : undefined}>
            <i />
          </button>
        ))}
      </div>

      <Dialog open={open} onClose={() => setOpen(false)} variant="full" labelledBy="viewer-title">
        <div className="vw-h">
          <h2 id="viewer-title" className="small" tabIndex={-1} autoFocus>
            {viewIndex + 1} / {total}
          </h2>
          <CloseButton onClick={() => setOpen(false)} label="Close photos" />
        </div>
        <div
          ref={viewer}
          className="vw"
          tabIndex={0}
          aria-label={`${label} photos, use arrow keys to move`}
          onScroll={() => {
            const el = viewer.current;
            if (el) setViewIndex(Math.round(el.scrollLeft / el.clientWidth));
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") goViewer(viewIndex + 1);
            if (e.key === "ArrowLeft") goViewer(viewIndex - 1);
          }}
        >
          {images.map((img) => (
            <div className="vw-i" key={img.src} style={preview(img.src)}>
              {/* Same size and quality as the gallery, so on phones the photo is already downloaded: opens instantly. */}
              {open && <Image src={img.src} alt={img.alt} fill sizes={PHONE_FULL} quality={65} loading="eager" decoding="sync" />}
            </div>
          ))}
        </div>
        <button type="button" className="vw-nav vw-prev" onClick={() => goViewer(viewIndex - 1)} disabled={viewIndex === 0} aria-label="Previous photo">
          <Arrow dir="prev" />
        </button>
        <button type="button" className="vw-nav vw-next" onClick={() => goViewer(viewIndex + 1)} disabled={viewIndex === total - 1} aria-label="Next photo">
          <Arrow dir="next" />
        </button>
      </Dialog>
    </div>
  );
}
