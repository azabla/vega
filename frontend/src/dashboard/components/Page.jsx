import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const PageHeader = ({ title, description, action }) => (
  <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
    <div>
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      {description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
    </div>
    {action}
  </div>
);

export const Panel = ({ title, description, action, children, className }) => (
  <section className={cn("surface p-4 sm:p-6", className)}>
    {(title || action) && (
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
      </div>
    )}
    {children}
  </section>
);

export const ListSkeleton = ({ rows = 3 }) => (
  <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
    {Array.from({ length: rows }, (_, i) => (
      <Skeleton key={i} className="h-16 w-full rounded-xl" />
    ))}
  </div>
);

export const LoadError = ({ onRetry, children = "Couldn't load this section." }) => (
  <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
    <p className="flex items-center gap-2 text-destructive">
      <AlertCircle className="size-4 shrink-0" />
      {children}
    </p>
    {onRetry && (
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);

export const EmptyState = ({ icon: Icon, title, children, action }) => (
  <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center">
    {Icon && (
      <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Icon className="size-5" />
      </span>
    )}
    <div>
      <p className="font-medium">{title}</p>
      {children && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{children}</p>}
    </div>
    {action}
  </div>
);

export const SaveButton = ({ saving, children = "Save", ...props }) => (
  <Button type="submit" size="lg" className="min-w-24 px-4" disabled={saving} {...props}>
    {saving && <Loader2 className="size-4 animate-spin" />}
    {saving ? "Saving…" : children}
  </Button>
);
