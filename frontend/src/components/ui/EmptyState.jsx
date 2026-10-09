import { cn } from "@/lib/utils";

/** Friendly placeholder for a list with nothing in it yet. */
export const EmptyState = ({ icon: Icon, title, description, action, className }) => (
  <div className={cn("surface flex flex-col items-center px-6 py-14 text-center", className)}>
    {Icon && (
      <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </span>
    )}
    <p className="font-heading text-2xl">{title}</p>
    {description && <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
