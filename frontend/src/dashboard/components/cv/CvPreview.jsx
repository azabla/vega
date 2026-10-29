import { Loader2, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The rendered pages, with every section clickable: a click opens that section's controls.
 * `regions` come from the renderer (cv/render.py regions()), so they match the PDF exactly.
 */
export const CvPreview = ({ preview, onRetry, onPick, labelOf }) => (
  <div className="flex flex-col gap-3">
    <p className="flex min-h-5 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground" aria-live="polite">
      {preview.loading ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="size-3.5 animate-spin" /> Updating preview…
        </span>
      ) : preview.error ? (
        <span className="text-destructive">Couldn't update the preview.</span>
      ) : (
        <span>
          {`${preview.pageCount} ${preview.pageCount === 1 ? "page" : "pages"}${preview.pageCount > preview.pages.length ? ` (first ${preview.pages.length} shown)` : ""}`}
        </span>
      )}
      {preview.error && (
        <Button type="button" variant="outline" size="xs" onClick={onRetry}>
          Retry
        </Button>
      )}
      {preview.regions.length > 0 && (
        <span className="ml-auto inline-flex items-center gap-1">
          <MousePointerClick className="size-3.5" /> Click any part to edit it
        </span>
      )}
    </p>
    {preview.pages.length === 0 && !preview.error ? (
      <div className="aspect-[210/297] w-full animate-pulse rounded-lg border bg-muted" aria-label="Loading preview" />
    ) : (
      preview.pages.map((src, page) => (
        <div key={page} className="relative">
          <img
            src={src}
            alt={`Page ${page + 1} of your CV`}
            className={cn("w-full rounded-lg border bg-white shadow-sm transition-opacity", preview.loading && "opacity-60")}
          />
          {!preview.loading &&
            preview.regions
              .filter((r) => r.page === page)
              .map((r, i) => (
                <button
                  key={`${r.id}-${i}`}
                  type="button"
                  onClick={() => onPick(r.id)}
                  aria-label={`Edit ${labelOf(r.id)}`}
                  className="group/region absolute rounded-sm outline-2 outline-offset-2 outline-transparent transition hover:bg-primary/5 hover:outline-primary-ink focus-visible:outline-primary-ink"
                  style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` }}
                >
                  <span className="pointer-events-none absolute -top-2.5 left-1 hidden rounded-full bg-foreground px-2 py-0.5 text-[0.68rem] font-medium whitespace-nowrap text-background group-hover/region:block group-focus-visible/region:block">
                    Edit {labelOf(r.id)}
                  </span>
                </button>
              ))}
        </div>
      ))
    )}
  </div>
);
