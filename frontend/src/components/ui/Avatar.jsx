import { useState } from "react";
import { hashOf, initialsOf } from "@/lib/format";
import { cn } from "@/lib/utils";

// Photo, or initials on a tint picked from the name
export const Avatar = ({ src, name = "", className }) => {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn("size-10 shrink-0 rounded-full border object-cover", className)}
      />
    );
  }
  const strength = 6 + (hashOf(name) % 3) * 3; // light enough for AA initials
  return (
    <span
      aria-hidden
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-medium text-primary-ink",
        className
      )}
      style={{ background: `color-mix(in oklab, var(--primary) ${strength}%, var(--card))` }}
    >
      {initialsOf(name) || "?"}
    </span>
  );
};
