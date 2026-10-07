"use client";

import { useEffect } from "react";
import { useBag } from "./BagProvider";

/** Empties the bag once the order confirmation page is shown. */
export function ClearBag() {
  const { clear } = useBag();
  useEffect(() => clear(), [clear]);
  return null;
}
