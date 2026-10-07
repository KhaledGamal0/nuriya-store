"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PRODUCT, isColor, isSize, type ColorId, type SizeId } from "@/lib/catalog";
import { MAX_QTY_PER_LINE } from "@/lib/checkout";

export type BagLine = { color: ColorId; size: SizeId; qty: number };

type BagContext = {
  lines: BagLine[];
  count: number;
  /** Display only. The server recomputes every amount at checkout. */
  subtotalPiasters: number;
  add: (color: ColorId, size: SizeId) => void;
  setQty: (index: number, qty: number) => void;
  remove: (index: number) => void;
  clear: () => void;
  bagOpen: boolean;
  openBag: () => void;
  closeBag: () => void;
  toast: (message: string) => void;
};

const Ctx = createContext<BagContext | null>(null);
const KEY = "nuriya-bag-v1";

function load(): BagLine[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    if (!Array.isArray(data)) return [];
    return data.filter(
      (l): l is BagLine =>
        typeof l === "object" && l !== null && isColor(l.color) && isSize(l.size) && Number.isInteger(l.qty) && l.qty > 0,
    );
  } catch {
    return [];
  }
}

export function BagProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<BagLine[]>([]);
  const [ready, setReady] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setLines(load());
    setReady(true);
    const sync = (e: StorageEvent) => e.key === KEY && setLines(load());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* private mode: the bag still works for this visit */
    }
  }, [lines, ready]);

  const toast = useCallback((text: string) => {
    setMessage(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(null), 2400);
  }, []);

  const add = useCallback((color: ColorId, size: SizeId) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.color === color && l.size === size);
      if (i === -1) return [...prev, { color, size, qty: 1 }];
      return prev.map((l, j) => (j === i ? { ...l, qty: Math.min(MAX_QTY_PER_LINE, l.qty + 1) } : l));
    });
  }, []);

  const value = useMemo<BagContext>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotalPiasters: lines.reduce((n, l) => n + l.qty * PRODUCT.pricePiasters, 0),
      add,
      setQty: (index, qty) =>
        setLines((prev) => prev.map((l, j) => (j === index ? { ...l, qty: Math.max(1, Math.min(MAX_QTY_PER_LINE, qty)) } : l))),
      remove: (index) => setLines((prev) => prev.filter((_, j) => j !== index)),
      clear: () => setLines([]),
      bagOpen,
      openBag: () => setBagOpen(true),
      closeBag: () => setBagOpen(false),
      toast,
    }),
    [lines, add, bagOpen, toast],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="toast" role="status" aria-live="polite" data-on={message ? "true" : "false"}>
        {message}
      </div>
    </Ctx.Provider>
  );
}

export function useBag(): BagContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBag must be used inside <BagProvider>");
  return ctx;
}
