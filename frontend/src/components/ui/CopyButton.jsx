import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

/** Copies `value`; announces "Copied" to screen readers. */
export const CopyButton = ({ value, label = "Copy", className, children }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => setCopied(await copyText(value))}
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium transition hover:bg-secondary",
        className
      )}
    >
      {copied ? <Check className="size-4 shrink-0 text-success" /> : <Copy className="size-4 shrink-0" />}
      <span className="truncate">{children ?? label}</span>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
};
