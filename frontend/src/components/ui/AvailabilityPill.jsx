import { availabilityOf } from "@/lib/profile";
import { cn } from "@/lib/utils";

const TONE = { success: "bg-success", warning: "bg-warning", muted: "bg-muted-foreground" };

/** "● Open to work · from March". Renders nothing when no status is set. */
export const AvailabilityPill = ({ profile, className }) => {
  const status = availabilityOf(profile);
  if (!status) return null;
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full border bg-card/80 px-3 py-1 text-xs font-medium backdrop-blur",
        className
      )}
    >
      <span className="relative flex size-2 shrink-0" aria-hidden>
        {status.pulse && <span className={cn("absolute inset-0 animate-pulse-dot rounded-full", TONE[status.tone])} />}
        <span className={cn("relative size-2 rounded-full", TONE[status.tone])} />
      </span>
      <span className="truncate">
        {status.label}
        {status.note && <span className="text-muted-foreground"> · {status.note}</span>}
      </span>
    </span>
  );
};
