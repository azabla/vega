import { cn } from "@/lib/utils";

export const Tag = ({ className, children, ...props }) => (
  <span
    className={cn(
      "inline-flex max-w-full items-center gap-1 truncate rounded-full border bg-secondary/60 px-2.5 py-0.5 font-mono text-[0.72rem] text-secondary-foreground",
      className
    )}
    {...props}
  >
    {children}
  </span>
);

/** Tags with a "+N" chip once there are more than `max`. Items are strings or { id, name }. */
export const TagList = ({ items = [], max = 6, className }) => {
  if (!items.length) return null;
  const shown = items.slice(0, max);
  const hidden = items.length - shown.length;
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {shown.map((item) => {
        const name = typeof item === "string" ? item : item.name;
        return (
          <li key={item.id ?? name} className="min-w-0">
            <Tag>{name}</Tag>
          </li>
        );
      })}
      {hidden > 0 && (
        <li>
          <Tag className="text-muted-foreground" title={items.slice(max).map((i) => i.name ?? i).join(", ")}>
            +{hidden}
          </Tag>
        </li>
      )}
    </ul>
  );
};

const STATUS_TONE = {
  completed: "text-success",
  in_progress: "text-warning",
  archived: "text-muted-foreground",
};

export const StatusBadge = ({ status, label, className }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-0.5 text-xs font-medium",
      STATUS_TONE[status] ?? STATUS_TONE.archived,
      className
    )}
  >
    <span className="size-1.5 rounded-full bg-current" aria-hidden />
    <span className="text-foreground">{label}</span>
  </span>
);
