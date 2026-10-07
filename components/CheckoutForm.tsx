"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useActionState, useEffect, useRef, useState, type ReactNode } from "react";
import { placeOrder, type CheckoutState } from "@/app/checkout/actions";
import { useBag } from "./BagProvider";
import { BagLineItem } from "./BagLineItem";
import { formatEgp } from "@/lib/money";
import { areasByFee } from "@/lib/shipping";
import { useStore } from "./StoreProvider";
import { fieldError, type FieldErrors } from "@/lib/checkout";

const FIELDS = ["phone", "name", "area", "address"] as const;
type Field = (typeof FIELDS)[number];

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
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

function Summary({ feePiasters }: { feePiasters?: number }) {
  const bag = useBag();
  return (
    <>
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
          <dd>{feePiasters === undefined ? "Choose area" : formatEgp(feePiasters)}</dd>
        </div>
        <div className="big">
          <dt>Total</dt>
          <dd>{formatEgp(bag.subtotalPiasters + (feePiasters ?? 0))}</dd>
        </div>
      </dl>
    </>
  );
}

export function CheckoutForm({ cardEnabled = false }: { cardEnabled?: boolean }) {
  const bag = useBag();
  const router = useRouter();
  const { areas } = useStore();
  const groups = areasByFee(areas);
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, null);
  const [areaId, setAreaId] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  // One key per checkout attempt, made in the browser at the first tap (never at build time, or every
  // shopper would share it). Retries and double taps reuse it, so the server saves one order only.
  const keyRef = useRef<string | null>(null);
  // A second tap while the first is still on its way is ignored (the server would return the same
  // order anyway, but the extra round trip could bounce the shopper back to the thank-you page).
  const sendingRef = useRef(false);
  const fee = areas.find((a) => a.id === areaId)?.feePiasters;

  // Server errors replace local ones after each submit.
  useEffect(() => {
    if (state?.saved) {
      // Saved in the database: open the thank-you page (replace, so Back doesn't return to a filled form).
      router.replace(`/checkout/done?o=${state.saved.number}&p=${state.saved.payment}`);
      return; // keep the button locked while the page changes
    }
    sendingRef.current = false; // the server answered with a problem: allow another try
    if (state?.errors) {
      setErrors(state.errors);
      focusFirst(state.errors);
    }
  }, [state, router]);

  function focusFirst(errs: FieldErrors) {
    const first = FIELDS.find((f) => errs[f]);
    if (first) formRef.current?.querySelector<HTMLElement>(`#${first}`)?.focus();
  }

  // Check a field when the shopper leaves it; clear its error as soon as it becomes valid.
  function check(field: Field, value: string, onlyClear = false) {
    const msg = fieldError(field, value);
    setErrors((prev) => {
      if (onlyClear && !prev[field]) return prev;
      return { ...prev, [field]: onlyClear && msg ? prev[field] : msg };
    });
  }

  const live = (field: Field) => ({
    onBlur: (e: { currentTarget: { value: string } }) => e.currentTarget.value && check(field, e.currentTarget.value),
    onChange: (e: { currentTarget: { value: string } }) => check(field, e.currentTarget.value, true),
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `${field}-err` : undefined,
  });

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

  const total = formatEgp(bag.subtotalPiasters + (fee ?? 0));

  return (
    <div className="co">
      <details className="sum sum-m">
        <summary>
          <span>Order summary</span>
          <b>{total}</b>
        </summary>
        <Summary feePiasters={fee} />
      </details>

      <form
        ref={formRef}
        noValidate
        onSubmit={(e) => {
          // Submitted by hand (not the form's action prop) so React does not clear the fields:
          // if the server says no, the shopper keeps everything they typed.
          e.preventDefault();
          if (sendingRef.current) return;
          const form = new FormData(e.currentTarget);
          const next: FieldErrors = {};
          for (const f of FIELDS) {
            const msg = fieldError(f, form.get(f));
            if (msg) next[f] = msg;
          }
          if (Object.keys(next).length) {
            setErrors(next);
            focusFirst(next);
            return;
          }
          keyRef.current ??= crypto.randomUUID();
          form.set("key", keyRef.current);
          sendingRef.current = true;
          startTransition(() => action(form));
        }}
      >
        <h1>Checkout</h1>
        <p className="small" style={{ marginTop: "var(--s1)" }}>
          No account needed. We confirm every order on WhatsApp.
        </p>
        <input type="hidden" name="cart" value={JSON.stringify(bag.lines)} />
        {/* Left empty by people; bots that fill every field are refused. */}
        <div className="hp" aria-hidden="true" inert>
          <label>
            Leave empty
            <input type="text" name="hp_note" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>

        <fieldset className="fs">
          <legend>Contact</legend>
          <Field id="phone" label="Mobile number" error={errors.phone}>
            <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="010 1234 5678" required {...live("phone")} />
          </Field>
          <Field id="name" label="Full name" error={errors.name}>
            <input id="name" name="name" autoComplete="name" required {...live("name")} />
          </Field>
        </fieldset>

        <fieldset className="fs">
          <legend>Delivery</legend>
          <Field id="area" label="Area" error={errors.area}>
            <select
              id="area"
              name="area"
              required
              value={areaId}
              {...live("area")}
              onChange={(e) => {
                setAreaId(e.target.value);
                check("area", e.target.value, true);
              }}
            >
              <option value="">Choose your area</option>
              {groups.map((g) => (
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
            <textarea id="address" name="address" autoComplete="street-address" placeholder="Street, building, floor, apartment" required {...live("address")} />
          </Field>
        </fieldset>

        <fieldset className="fs">
          <legend>Payment</legend>
          <div className="pay">
            <label>
              <input type="radio" name="payment" value="cod" defaultChecked />
              <span>Cash on delivery</span>
            </label>
            {cardEnabled && (
              <label>
                <input type="radio" name="payment" value="card" />
                <span>Card</span>
                <small className="small">Secure Paymob page</small>
              </label>
            )}
          </div>
          {!cardEnabled && <p className="small">Card payment is coming soon.</p>}
          {errors.payment && (
            <p className="form-err" role="alert">
              {errors.payment}
            </p>
          )}
        </fieldset>

        {state?.notice && (
          <p className="form-err" role="alert">
            {state.notice}
          </p>
        )}

        {errors.cart && (
          <p className="form-err" role="alert">
            {errors.cart}
          </p>
        )}

        <button className="btn" type="submit" disabled={pending || Boolean(state?.saved)} style={{ marginTop: "var(--s4)" }}>
          {pending || state?.saved ? "Placing your order…" : `Place order · ${total}`}
        </button>
        <p className="small" style={{ marginTop: "var(--s2)" }}>
          Check your order with the courier before you accept. After the courier leaves, returns and exchanges are closed.
        </p>
      </form>

      <aside className="sum sum-d" aria-label="Order summary">
        <h2>Summary</h2>
        <Summary feePiasters={fee} />
      </aside>
    </div>
  );
}
