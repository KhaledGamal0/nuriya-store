"use client";

import Link from "next/link";
import { useActionState, useState, type ReactNode } from "react";
import { placeOrder, type CheckoutState } from "@/app/checkout/actions";
import { useBag } from "./BagProvider";
import { BagLineItem } from "./BagLineItem";
import { formatEgp } from "@/lib/money";
import { AREAS, areasByFee } from "@/lib/shipping";

const GROUPS = areasByFee();

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="f" data-bad={error ? "true" : "false"}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <span className="f-err" id={`${id}-err`}>
          {error}
        </span>
      )}
    </div>
  );
}

export function CheckoutForm() {
  const bag = useBag();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, null);
  const [areaId, setAreaId] = useState("");
  const errors = state?.errors ?? {};
  const fee = AREAS.find((a) => a.id === areaId)?.feePiasters;

  if (bag.lines.length === 0) {
    return (
      <div className="done">
        <h1>Your bag is empty</h1>
        <Link className="btn btn-line" href="/#shop">
          Shop now
        </Link>
      </div>
    );
  }

  const err = (k: keyof typeof errors) => (errors[k] ? { "aria-invalid": true, "aria-describedby": `${k}-err` } : {});

  return (
    <div className="co">
      <form action={action} noValidate>
        <h1>Checkout</h1>
        <p className="small" style={{ marginTop: "var(--s1)" }}>
          No account needed. We confirm every order on WhatsApp.
        </p>
        <input type="hidden" name="cart" value={JSON.stringify(bag.lines)} />

        <fieldset className="fs">
          <legend>Contact</legend>
          <Field id="phone" label="Mobile number" error={errors.phone}>
            <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="010 1234 5678" required {...err("phone")} />
          </Field>
          <Field id="name" label="Full name" error={errors.name}>
            <input id="name" name="name" autoComplete="name" required {...err("name")} />
          </Field>
        </fieldset>

        <fieldset className="fs">
          <legend>Delivery</legend>
          <Field id="area" label="Area" error={errors.area}>
            <select id="area" name="area" required value={areaId} onChange={(e) => setAreaId(e.target.value)} {...err("area")}>
              <option value="">Choose your area</option>
              {GROUPS.map((g) => (
                <optgroup key={g.feePiasters} label={`${formatEgp(g.feePiasters)} delivery`}>
                  {g.areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nameEn}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field id="address" label="Address" error={errors.address}>
            <textarea id="address" name="address" autoComplete="street-address" placeholder="Street, building, floor, apartment" required {...err("address")} />
          </Field>
        </fieldset>

        <fieldset className="fs">
          <legend>Payment</legend>
          <div className="pay">
            <label>
              <input type="radio" name="payment" value="cod" defaultChecked />
              <span>Cash on delivery</span>
            </label>
            <label>
              <input type="radio" name="payment" value="card" />
              <span>Card</span>
              <small className="small">Secure Paymob page</small>
            </label>
          </div>
        </fieldset>

        {state?.message && (
          <p className="form-err" role="alert">
            {errors.cart ?? state.message}
          </p>
        )}

        <button className="btn" type="submit" disabled={pending} style={{ marginTop: "var(--s4)" }}>
          {pending ? "Placing your order…" : "Place order"}
        </button>
        <p className="small" style={{ marginTop: "var(--s2)" }}>
          Check your order with the courier before you accept. After the courier leaves, returns and exchanges are closed.
        </p>
      </form>

      <aside className="sum" aria-label="Order summary">
        <h2>Summary</h2>
        <div>
          {bag.lines.map((line) => (
            <BagLineItem key={`${line.color}-${line.size}`} line={line} />
          ))}
        </div>
        <dl>
          <div>
            <dt>Subtotal</dt>
            <dd>{formatEgp(bag.subtotalPiasters)}</dd>
          </div>
          <div>
            <dt>Delivery</dt>
            <dd>{fee === undefined ? "Choose area" : formatEgp(fee)}</dd>
          </div>
          <div className="big">
            <dt>Total</dt>
            <dd>{formatEgp(bag.subtotalPiasters + (fee ?? 0))}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
