"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { afterSale, priceFor, type CatalogData, type ColorId, type SizeId } from "@/lib/catalog";
import type { Area } from "@/lib/shipping";

type Store = {
  catalog: CatalogData;
  areas: readonly Area[];
  minFeePiasters: number;
  /** Display price for a colour/size. The server recomputes every amount at checkout. */
  unitPrice: (color: ColorId, size: SizeId) => number;
};

const Ctx = createContext<Store | null>(null);

/** Shares the catalog and delivery areas (loaded on the server) with interactive components. */
export function StoreProvider({ catalog: built, areas, children }: { catalog: CatalogData; areas: readonly Area[]; children: ReactNode }) {
  // A timed sale switches off on the second it ends, even if the page was opened before (no reload needed).
  const [ended, setEnded] = useState(false);
  useEffect(() => {
    if (!built.sale) return;
    const ms = new Date(built.sale.endsAt).getTime() - Date.now();
    if (ms <= 0) return setEnded(true);
    const t = window.setTimeout(() => setEnded(true), Math.min(ms, 2_147_000_000));
    return () => window.clearTimeout(t);
  }, [built]);
  const catalog = useMemo(() => (ended ? afterSale(built) : built), [built, ended]);
  const value = useMemo<Store>(
    () => ({
      catalog,
      areas,
      minFeePiasters: areas.length ? Math.min(...areas.map((a) => a.feePiasters)) : 0,
      unitPrice: (color, size) => priceFor(catalog, color, size) ?? catalog.pricePiasters,
    }),
    [catalog, areas],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
