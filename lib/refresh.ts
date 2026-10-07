import { revalidatePath } from "next/cache";

/**
 * Rebuild every storefront page from the database on its next visit.
 * Pages are static (fast, no per-minute rebuilds); call this whenever prices, stock, photos,
 * delivery fees or content change. The admin dashboard and order flow call it automatically.
 */
export function refreshStorefront(): void {
  revalidatePath("/", "layout");
}
