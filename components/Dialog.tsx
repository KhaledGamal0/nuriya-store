"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  variant: "left" | "right" | "sheet";
  labelledBy: string;
  children: ReactNode;
};

const CLOSE_MS = 260;

/**
 * Native <dialog>: traps focus, Escape closes, the page behind is inert, tapping the backdrop closes.
 * Closing plays a short slide-out before the dialog is removed, on every browser (including iOS Safari).
 */
export function Dialog({ open, onClose, variant, labelledBy, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      dialog.removeAttribute("data-closing");
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (!dialog.open) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      dialog.close();
      return;
    }
    dialog.setAttribute("data-closing", "true");
    const t = window.setTimeout(() => {
      dialog.close();
      dialog.removeAttribute("data-closing");
    }, CLOSE_MS);
    return () => window.clearTimeout(t);
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
      onCancel={(e) => {
        // Escape key: animate out instead of closing instantly.
        e.preventDefault();
        onClose();
      }}
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
