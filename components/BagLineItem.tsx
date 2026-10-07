"use client";

import { useStore } from "./StoreProvider";
import { formatEgp } from "@/lib/money";
import { MAX_QTY_PER_LINE } from "@/lib/checkout";
import type { BagLine } from "./BagProvider";
import { preview } from "@/lib/blur";
import { FadeImage } from "./FadeImage";

type Props = {
  line: BagLine;
  onQty?: (qty: number) => void;
  onRemove?: () => void;
};

export function BagLineItem({ line, onQty, onRemove }: Props) {
  const { catalog, unitPrice } = useStore();
  const color = catalog.colors[line.color];
  const image = color.images[0]!;
  const editable = Boolean(onQty && onRemove);
  return (
    <div className="ln">
      <div className="ln-img" style={preview(image.src)}>
        <FadeImage src={image.src} alt="" fill sizes="72px" />
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
        <span className="price">{formatEgp(line.qty * unitPrice(line.color, line.size))}</span>
        {editable && (
          <button type="button" className="rm" onClick={onRemove}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
