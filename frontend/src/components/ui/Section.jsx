import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

/** Small mono label above a heading. */
export const Eyebrow = ({ className, children }) => (
  <p className={cn("eyebrow flex items-center gap-2 text-primary-ink", className)}>
    <span className="h-px w-5 bg-current opacity-60" aria-hidden />
    {children}
  </p>
);

export const Section = ({ id, className, children }) => (
  <section id={id} className={cn("py-16 md:py-28", className)}>
    <div className="container">{children}</div>
  </section>
);

export const SectionHeader = ({ eyebrow, title, description, action, className }) => (
  <Reveal className={cn("mb-10 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between", className)}>
    <div className="min-w-0 max-w-2xl">
      {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
      <h2 className="font-heading text-h2">{title}</h2>
      {description && <p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </Reveal>
);

/** Top of a full page: clears the fixed navbar. `children` go under the description. */
export const PageHeader = ({ eyebrow, title, description, children, className }) => (
  <header className={cn("container pt-28 pb-10 md:pt-40 md:pb-16", className)}>
    <div className="animate-fade-up">
      {eyebrow && <Eyebrow className="mb-5">{eyebrow}</Eyebrow>}
      <h1 className="font-heading max-w-4xl text-display break-words">{title}</h1>
      {description && <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{description}</p>}
      {children}
    </div>
  </header>
);
