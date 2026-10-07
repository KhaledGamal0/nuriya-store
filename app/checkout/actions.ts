"use server";

import { after } from "next/server";
import { headers } from "next/headers";
import { MESSAGES, validateCheckout, type FieldErrors } from "@/lib/checkout";
import { getAreas, getCatalog } from "@/lib/store";
import { getSql, hasDatabase } from "@/lib/db";
import { hashIp, placeOrder as saveOrder, type PlaceResult, type RefusalReason } from "@/lib/orders";
import { sendPendingOrderEmails } from "@/lib/notify";
import { refreshStorefront } from "@/lib/refresh";

/** `notice` is a message for the whole form (not one field); the bag and every typed field are kept. */
export type CheckoutState = {
  errors: FieldErrors;
  message?: string;
  notice?: string;
  /** Set only after the order is saved in the database. The browser then opens the thank-you page. */
  saved?: { number: string; payment: "cod" | "card" };
} | null;

const UNAVAILABLE =
  "We couldn't place your order just now. Nothing was charged. Please try again in a minute, or message us on Instagram @nuriya.eg.";

const REFUSALS: Record<RefusalReason, CheckoutState> = {
  rate_limited: { errors: {}, notice: "Too many attempts from this device. Please wait a few minutes, then try again." },
  phone_limit: { errors: {}, notice: "This number already has several orders today. Message us on Instagram @nuriya.eg and we'll help you." },
  blocked: { errors: {}, notice: "We can't take this order online. Please message us on Instagram @nuriya.eg." },
  sold_out: { errors: { cart: MESSAGES.soldOut } },
  price_changed: { errors: { cart: "A price or delivery fee just changed. Please refresh the page, check your total, and place the order again." } },
  area_unavailable: { errors: { area: "Delivery to this area isn't available right now. Please choose another area or message us." } },
  cod_unavailable: { errors: { payment: "Cash on delivery isn't available for this area." } },
  card_unavailable: { errors: { payment: "Card payment is coming soon. Please choose cash on delivery." } },
  bad_key: { errors: {}, notice: UNAVAILABLE },
};

export async function placeOrder(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  // Hidden field only bots fill in.
  if (String(form.get("hp_note") ?? "") !== "") return { errors: {}, notice: UNAVAILABLE };
  // Without a database an order can't be saved — never pretend it was.
  if (!hasDatabase()) return { errors: {}, notice: UNAVAILABLE };

  let catalog: Awaited<ReturnType<typeof getCatalog>>;
  let areas: Awaited<ReturnType<typeof getAreas>>;
  try {
    [catalog, areas] = await Promise.all([getCatalog(), getAreas()]);
  } catch (err) {
    // Database unreachable (after one retry). Never fall back to built-in prices for a real order.
    console.error("checkout.unavailable", err instanceof Error ? err.message : err);
    return { errors: {}, notice: UNAVAILABLE };
  }

  const result = validateCheckout(
    {
      phone: form.get("phone"),
      name: form.get("name"),
      areaId: form.get("area"),
      address: form.get("address"),
      payment: form.get("payment"),
      cart: form.get("cart"),
    },
    { catalog, areas },
  );
  if (!result.ok) return { errors: result.errors, message: "Please check the highlighted fields." };

  const h = await headers();
  const ip = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  let saved: PlaceResult;
  try {
    saved = await saveOrder(getSql(), result.order, { key: String(form.get("key") ?? ""), ipHash: hashIp(ip) });
  } catch (err) {
    console.error("checkout.save_failed", err instanceof Error ? err.message : err);
    return { errors: {}, notice: UNAVAILABLE };
  }

  if (!saved.ok) {
    if (saved.reason === "price_changed" || saved.reason === "sold_out") refreshStorefront();
    console.info("checkout.refused", saved.reason);
    return REFUSALS[saved.reason];
  }

  console.info("order.saved", { number: saved.number, existing: saved.existing, payment: saved.payment });
  if (saved.soldOutNow) refreshStorefront(); // a size just sold out: pages show it within seconds
  // E-mail the shop after the response is sent, so the customer never waits for it (and retry older misses).
  after(() => sendPendingOrderEmails(getSql()).catch((e) => console.error("order.email.batch_failed", e)));

  // TODO(phase 4): card → create a Paymob intention for the saved total and send the shopper to Paymob's hosted page.
  // Returned, not redirect(): a server-action redirect left the page's transition pending, so the next
  // link tap did nothing and the title never updated. A normal client navigation is reliable.
  return { errors: {}, saved: { number: saved.number, payment: saved.payment } };
}
