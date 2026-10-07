"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { priceFor, type CatalogData, type ColorId, type SizeId } from "@/lib/catalog";
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
export function StoreProvider({ catalog, areas, children }: { catalog: CatalogData; areas: readonly Area[]; children: ReactNode }) {
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
