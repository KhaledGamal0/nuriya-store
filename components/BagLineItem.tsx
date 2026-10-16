"use client";

import Image from "next/image";
import { useStore } from "./StoreProvider";
import { formatEgp } from "@/lib/money";
import { MAX_QTY_PER_LINE } from "@/lib/checkout";
import { useBag, type BagLine } from "./BagProvider";
import { preview } from "@/lib/blur";

type Props = {
  line: BagLine;
  onQty?: (qty: number) => void;
  onRemove?: () => void;
};

export function BagLineItem({ line, onQty, onRemove }: Props) {
  const { catalog } = useStore();
  const { totalPiasters, parts } = useBag().priceOf(line);
  const color = catalog.colors[line.color];
  const image = color.images[0]!;
  const editable = Boolean(onQty && onRemove);
  return (
    <div className="ln">
      <div className="ln-img" style={preview(image.src)}>
        <Image src={image.src} alt="" fill sizes="72px" loading="eager" />
      </div>
      <div className="ln-m">
        <b>{catalog.name}</b>
        <span>
          {color.name} · {line.size}
        </span>
        {editable ? (
          <div className="qty" role="group" aria-label={`Quantity for ${color.name} ${line.size}`}>
            <button type="button" onClick={() => onQty!(line.qty - 1)} disabled={line.qty <= 1} aria-label="Decrease quantity">
              −
            </button>
            <output aria-live="polite">{line.qty}</output>
            <button type="button" onClick={() => onQty!(line.qty + 1)} disabled={line.qty >= MAX_QTY_PER_LINE} aria-label="Increase quantity">
              +
            </button>
          </div>
        ) : (
          <span>Qty {line.qty}</span>
        )}
      </div>
      <div className="ln-r">
        <span className="price">{formatEgp(totalPiasters)}</span>
        {parts.length > 1 && (
          // The offer ran out inside this line: show how the price is made up.
          <small className="ln-split">{parts.map((p) => `${p.qty} × ${formatEgp(p.unitPiasters)}`).join(" + ")}</small>
        )}
        {editable && (
          <button type="button" className="rm" onClick={onRemove}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
