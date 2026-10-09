import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppearance } from "@/hooks/useAppearance";
import { useAbout } from "@/hooks/usePortfolio";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";

export const AboutTeaser = () => {
  const { data: about, loading } = useAbout();
  const base = usePortfolioPath();
  const { settings } = useAppearance();

  if (!loading && !about) return null;

  return (
    <Section id="about">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <SectionHeader
          eyebrow={about?.heading || "About"}
          title={loading ? <><span className="sr-only">Loading</span><Skeleton className="h-10 w-72" /></> : about.title}
          className="mb-0 md:mb-0 md:flex-col md:items-start"
        />
        <Reveal className="space-y-5">
          {loading ? (
            <>
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-11/12" />
              <Skeleton className="h-5 w-4/5" />
            </>
          ) : (
            <>
              <p className="text-lg leading-8 text-muted-foreground">
                {about.description}
              </p>
              {about.services?.length > 0 && (
                <ul className="grid gap-x-6 gap-y-3 border-t pt-6 sm:grid-cols-2">
                  {about.services.slice(0, 4).map((s, i) => (
                    <li key={s.id} className="flex gap-3">
                      <span className="font-mono text-xs text-primary-ink">{String(i + 1).padStart(2, "0")}</span>
                      <span className="text-sm font-medium">{s.title}</span>
                    </li>
                  ))}
                </ul>
              )}
              {settings.pages.about && (
                <Button href={`${base}/about`} variant="link">
                  More about me <ArrowRight />
                </Button>
              )}
            </>
          )}
        </Reveal>
      </div>
    </Section>
  );
};
