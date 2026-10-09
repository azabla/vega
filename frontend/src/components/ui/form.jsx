import { cn } from "@/lib/utils";

// Large touch targets (h-11) and a 16px font so iOS doesn't zoom on focus
const control =
  "w-full rounded-lg border border-input bg-background px-3 text-base text-foreground shadow-xs transition outline-none placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-destructive/20 md:text-sm";

export const Label = ({ className, ...props }) => (
  <label className={cn("text-sm font-medium text-foreground", className)} {...props} />
);

export const Input = ({ className, ...props }) => <input className={cn(control, "h-11", className)} {...props} />;

export const Textarea = ({ className, rows = 4, ...props }) => (
  <textarea rows={rows} className={cn(control, "min-h-24 py-2.5 leading-6", className)} {...props} />
);

export const Select = ({ className, children, ...props }) => (
  <select className={cn(control, "h-11 cursor-pointer pr-8", className)} {...props}>
    {children}
  </select>
);

export const Checkbox = ({ className, ...props }) => (
  <input type="checkbox" className={cn("size-5 shrink-0 cursor-pointer rounded accent-primary", className)} {...props} />
);

export const FieldHint = ({ className, ...props }) => (
  <p className={cn("text-xs leading-5 text-muted-foreground", className)} {...props} />
);

export const FieldError = ({ children, className, ...props }) =>
  children ? (
    <p role="alert" className={cn("text-xs leading-5 font-medium text-destructive", className)} {...props}>
      {children}
    </p>
  ) : null;

export const FormAlert = ({ children, className }) =>
  children ? (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive",
        className
      )}
    >
      {children}
    </div>
  ) : null;
