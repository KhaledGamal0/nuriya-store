"use client";

import { useStore } from "./StoreProvider";

/**
 * Small "Sale" label on product photos while an offer runs (Khaled, Nov 20 2026: the one badge allowed).
 * Kept short and in the corner so it never covers the model's face (the sale name is in the popup and price note).
 * Follows the live catalog, so it disappears the moment the sale ends, without a reload.
 * Hidden from screen readers: the price and the sale note already say it.
 */
export function SaleTag() {
  const { catalog } = useStore();
  if (catalog.compareAtPiasters == null) return null;
  return (
    <span className="tag" aria-hidden="true">
      Sale
    </span>
  );
}
