"use client";

import { useStore } from "./StoreProvider";
import { Price } from "./Price";

/** The product price as it is right now: follows a timed sale and switches back the moment it ends. */
export function LivePrice({ className = "price" }: { className?: string }) {
  const { catalog } = useStore();
  return <Price className={className} now={catalog.pricePiasters} was={catalog.compareAtPiasters} />;
}
