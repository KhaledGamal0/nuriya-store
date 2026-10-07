"use client";

import { useEffect, useRef } from "react";
import { useBag } from "./BagProvider";

/** Empties the bag once the order confirmation page is shown. */
export function ClearBag() {
  const { clear } = useBag();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return; // once per visit, never in a loop
    done.current = true;
    clear();
  }, [clear]);
  return null;
}
