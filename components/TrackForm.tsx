"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";
import { trackOrder, type TrackState } from "@/app/track/actions";
import { formatEgp } from "@/lib/money";

export function TrackForm() {
  const [state, action, pending] = useActionState<TrackState, FormData>(trackOrder, null);
  const numberRef = useRef<HTMLInputElement>(null);

  // Prefill the order number when arriving from the confirmation page (?o=NUR-…).
  useEffect(() => {
    const o = new URLSearchParams(window.location.search).get("o");
    if (o && numberRef.current && !numberRef.current.value) numberRef.current.value = o;
  }, []);

  const order = state?.order;
  return (
    <>
      <form
        className="track-form"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          startTransition(() => action(form));
        }}
      >
        <div className="f">
          <label htmlFor="number">Order number</label>
          <input ref={numberRef} id="number" name="number" placeholder="NUR-7K3Q9P" autoCapitalize="characters" autoComplete="off" required />
        </div>
        <div className="f">
          <label htmlFor="track-phone">Mobile number</label>
          <input id="track-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="010 1234 5678" required />
        </div>
        <button className="btn" type="submit" disabled={pending}>
          {pending ? "Checking…" : "Check status"}
        </button>
        {state?.notice && (
          <p className="form-err" role="alert">
            {state.notice}
          </p>
        )}
      </form>

      {order && (
        <section className="track-result" aria-live="polite" aria-label={`Order ${order.number}`}>
          <p className="small">Order {order.number}</p>
          <h2>{order.statusText}</h2>
          {order.trackingNumber && <p className="small">Courier tracking: {order.trackingNumber}</p>}
          <ul>
            {order.items.map((i, n) => (
              <li key={n}>
                <span>
                  {i.qty} × {i.name}, {i.color}, {i.size}
                </span>
                <span>{formatEgp(i.linePiasters)}</span>
              </li>
            ))}
            <li>
              <span>Delivery to {order.area}</span>
              <span>{formatEgp(order.shippingPiasters)}</span>
            </li>
            <li className="big">
              <span>Total{order.payment === "cod" ? " · cash on delivery" : ""}</span>
              <span>{formatEgp(order.totalPiasters)}</span>
            </li>
          </ul>
        </section>
      )}
    </>
  );
}
