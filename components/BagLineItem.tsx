import Image from "next/image";
import { PRODUCT } from "@/lib/catalog";
import { formatEgp } from "@/lib/money";
import { MAX_QTY_PER_LINE } from "@/lib/checkout";
import type { BagLine } from "./BagProvider";

type Props = {
  line: BagLine;
  onQty?: (qty: number) => void;
  onRemove?: () => void;
};

export function BagLineItem({ line, onQty, onRemove }: Props) {
  const color = PRODUCT.colors[line.color];
  const image = color.images[0]!;
  const editable = Boolean(onQty && onRemove);
  return (
    <div className="ln">
      <div className="ln-img">
        <Image src={image.src} alt="" fill sizes="72px" />
      </div>
      <div className="ln-m">
        <b>{PRODUCT.name}</b>
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
        <span className="price">{formatEgp(line.qty * PRODUCT.pricePiasters)}</span>
        {editable && (
          <button type="button" className="rm" onClick={onRemove}>
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
