import { Quote } from "lucide-react";
import { Link } from "react-router-dom";
import { Avatar } from "@/components/ui/Avatar";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/skeleton";
import { useTestimonials } from "@/hooks/usePortfolio";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { cn } from "@/lib/utils";

export const TestimonialCard = ({ testimonial: t, featured, className }) => {
  const base = usePortfolioPath();
  const byline = [t.role, t.company].filter(Boolean).join(", ");
  return (
    <figure className={cn("surface flex h-full flex-col p-6 md:p-8", featured && "bg-accent", className)}>
      <Quote className="size-6 text-primary-ink" aria-hidden />
      <blockquote className={cn("mt-4 flex-1 leading-7", featured ? "font-heading text-2xl leading-snug md:text-[1.75rem]" : "text-[1.05rem]")}>
        “{t.quote}”
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t pt-5">
        <Avatar src={t.photo} name={t.name} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {t.url ? (
              <a href={t.url} target="_blank" rel="noreferrer" className="link-underline">
                {t.name}
              </a>
            ) : (
              t.name
            )}
          </p>
          {byline && <p className="truncate text-xs text-muted-foreground">{byline}</p>}
        </div>
        {t.project && (
          <Link to={`${base}/projects/${t.project.slug}`} className="ml-auto hidden max-w-[40%] shrink-0 truncate rounded-full border px-2.5 py-1 font-mono text-[0.65rem] text-muted-foreground transition hover:text-foreground sm:block">
            {t.project.title}
          </Link>
        )}
      </figcaption>
    </figure>
  );
};

export const Testimonials = () => {
  const { data: testimonials, loading } = useTestimonials();
  if (!loading && !testimonials.length) return null;
  const [first, ...rest] = testimonials ?? [];

  return (
    <Section id="testimonials">
      <SectionHeader eyebrow="Kind words" title="What people say" />
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Reveal className={cn(rest.length > 1 && "lg:row-span-2")}>
            <TestimonialCard testimonial={first} featured />
          </Reveal>
          {rest.map((t, i) => (
            <Reveal key={t.id} delay={(i + 1) * 80}>
              <TestimonialCard testimonial={t} />
            </Reveal>
          ))}
        </div>
      )}
    </Section>
  );
};
