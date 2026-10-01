import { cn } from "@/lib/utils";

export const Tag = ({ className, children, ...props }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1 rounded-full border bg-secondary/60 px-2.5 py-0.5 text-xs font-medium text-secondary-foreground",
      className
    )}
    {...props}
  >
    {children}
  </span>
);

const STATUS_STYLES = {
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  in_progress: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  archived: "border-border bg-muted text-muted-foreground",
};

export const StatusBadge = ({ status, label, className }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
      STATUS_STYLES[status] ?? STATUS_STYLES.archived,
      className
    )}
  >
    <span className="size-1.5 rounded-full bg-current" />
    {label}
  </span>
);
