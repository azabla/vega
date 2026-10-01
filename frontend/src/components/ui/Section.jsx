import { cn } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";

export const Section = ({ id, className, children }) => (
  <section id={id} className={cn("py-20 md:py-28", className)}>
    <div className="container">{children}</div>
  </section>
);

export const SectionHeader = ({ eyebrow, title, description, action, className }) => (
  <Reveal className={cn("mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between", className)}>
    <div className="max-w-2xl">
      {eyebrow && (
        <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      )}
      <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>}
    </div>
    {action}
  </Reveal>
);
