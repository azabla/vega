import { Boxes, Code, Layers, Plug, Server } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/skeleton";
import { portfolioAPI } from "@/services/portfolioAPI";
import { usePortfolioData } from "@/hooks/usePortfolioData";

const ICONS = [Server, Layers, Plug, Boxes, Code];

export const AboutSection = () => {
  const { data: about, loading } = usePortfolioData(portfolioAPI.getAboutMe);

  // hidden when the owner hasn't written an about section
  if (!loading && !about) return null;

  return (
    <Section id="about">
      <SectionHeader eyebrow="About" title={loading ? <Skeleton className="h-9 w-80" /> : about.title} />

      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr]">
        <Reveal className="space-y-5 text-[17px] leading-8 text-muted-foreground">
          {loading ? (
            <>
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-11/12" />
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="mt-6 h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
            </>
          ) : (
            <>
              <p>{about.description}</p>
              {about.description_2 && <p>{about.description_2}</p>}
              {about.cv_file && (
                <a
                  href={about.cv_file}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 items-center rounded-full border bg-card px-5 text-sm font-medium text-foreground transition hover:bg-secondary"
                >
                  Download CV
                </a>
              )}
            </>
          )}
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)
            : about.services.map((service, i) => {
                const Icon = ICONS[i % ICONS.length];
                return (
                  <Reveal key={service.id} delay={i * 80} className="surface surface-hover p-6">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                      <Icon className="size-5" />
                    </span>
                    <h3 className="mt-5 font-semibold">{service.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{service.description}</p>
                  </Reveal>
                );
              })}
        </div>
      </div>
    </Section>
  );
};
