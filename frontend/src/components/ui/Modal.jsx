import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Native <dialog>: focus trap, Esc to close and a backdrop for free.
 * Clicking the backdrop does nothing, so a stray tap can't discard a half-filled form.
 * Full-screen sheet on phones, centered card from `sm` up.
 */
export const Modal = ({ open, onClose, title, description, children, footer, className }) => {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      className={cn(
        "m-0 h-dvh max-h-none w-full max-w-none bg-card p-0 text-card-foreground backdrop:bg-black/50 backdrop:backdrop-blur-sm",
        "sm:m-auto sm:h-auto sm:max-h-[90dvh] sm:max-w-xl sm:rounded-2xl sm:border sm:shadow-2xl",
        className
      )}
    >
      {open && (
        <div className="flex h-full max-h-[inherit] flex-col">
          <header className="flex items-start justify-between gap-4 border-b px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
              {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
          {footer && <footer className="flex justify-end gap-2 border-t px-5 py-3.5">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
};
