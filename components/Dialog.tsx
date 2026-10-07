"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  variant: "left" | "right" | "sheet";
  labelledBy: string;
  children: ReactNode;
};

/** Native <dialog>: traps focus, closes on Escape, makes the page behind inert. Clicking the backdrop closes it. */
export function Dialog({ open, onClose, variant, labelledBy, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`dlg dlg-${variant === "sheet" ? "sheet" : `panel dlg-${variant}`}`}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="dlg-inner">{children}</div>
    </dialog>
  );
}

export function CloseButton({ onClick, label = "Close" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" className="ib" onClick={onClick} aria-label={label}>
      <svg width="14" height="14" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M1 1l12 12M13 1L1 13" />
      </svg>
    </button>
  );
}
