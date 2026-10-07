"use server";

import { redirect } from "next/navigation";
import { newOrderNumber, validateCheckout, type FieldErrors } from "@/lib/checkout";
import { getAreas, getCatalog } from "@/lib/store";

export type CheckoutState = { errors: FieldErrors; message?: string } | null;

export async function placeOrder(_prev: CheckoutState, form: FormData): Promise<CheckoutState> {
  const [catalog, areas] = await Promise.all([getCatalog(), getAreas()]);
  const result = validateCheckout({
    phone: form.get("phone"),
    name: form.get("name"),
    areaId: form.get("area"),
    address: form.get("address"),
    payment: form.get("payment"),
    cart: form.get("cart"),
  }, { catalog, areas });

  if (!result.ok) {
    return { errors: result.errors, message: "Please check the highlighted fields." };
  }

  const orderNo = newOrderNumber();
  // TODO(phase 3): rate-limit by phone and IP, save the order and reserve stock in one transaction.
  // TODO(phase 4): for card payments, create a Paymob payment intention for result.order.totalPiasters
  //                and redirect to Paymob's hosted checkout. The order becomes PAID only from the
  //                HMAC-verified webhook, never from this redirect.
  console.info("order.placed", {
    orderNo,
    payment: result.order.payment,
    area: result.order.area.id,
    totalPiasters: result.order.totalPiasters,
  });

  redirect(`/checkout/done?o=${orderNo}&p=${result.order.payment}`);
}
