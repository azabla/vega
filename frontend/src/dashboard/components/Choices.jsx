import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/** Radio group drawn as tiles; native radios keep arrow-key navigation. */
export const Choices = ({ name, value, onChange, options, columns = "grid-cols-2", render }) => (
  <div className={cn("grid gap-2", columns)} role="radiogroup">
    {options.map((o) => {
      const checked = value === o.id;
      return (
        <label
          key={o.id}
          className={cn(
            "relative flex cursor-pointer flex-col gap-2 rounded-xl border bg-background p-3 text-sm transition has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary-ink",
            checked ? "border-primary-ink ring-1 ring-primary-ink" : "hover:border-input"
          )}
        >
          <input type="radio" name={name} checked={checked} onChange={() => onChange(o.id)} className="sr-only" />
          {render(o, checked)}
          {checked && (
            <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-primary-ink text-background">
              <Check className="size-3" strokeWidth={3} />
            </span>
          )}
        </label>
      );
    })}
  </div>
);

export const Switch = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    className={cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition", checked ? "border-primary-ink bg-primary-ink" : "bg-muted")}
  >
    <span className={cn("absolute size-[1.125rem] rounded-full bg-background shadow transition-transform", checked ? "translate-x-[1.3rem]" : "translate-x-0.5")} />
  </button>
);
