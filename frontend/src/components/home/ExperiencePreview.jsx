import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/skeleton";
import { TimelineItem } from "@/components/Timeline";
import { useAppearance } from "@/hooks/useAppearance";
import { useExperience } from "@/hooks/usePortfolio";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { timelineFromExperience } from "@/lib/portfolio";

export const ExperiencePreview = () => {
  const { data: experience, loading } = useExperience();
  const { settings } = useAppearance();
  const base = usePortfolioPath();

  const work = (experience ?? [])
    .map(timelineFromExperience)
    .filter((item) => item.kind === "work")
    .slice(0, 3);
  if (!loading && !work.length) return null;

  return (
    <Section id="experience">
      <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <SectionHeader
          eyebrow="Experience"
          title="Where I've worked"
          className="md:flex-col md:items-start lg:sticky lg:top-28 lg:self-start"
          action={
            settings.pages.experience && (
              <Button href={`${base}/experience`} variant="link">
                Full timeline <ArrowRight />
              </Button>
            )
          }
        />
        <ol className="relative">
          {loading
            ? [0, 1].map((i) => (
                <li key={i}>
                  <Skeleton className="mb-4 h-32 rounded-2xl" />
                </li>
              ))
            : work.map((job, i) => <TimelineItem key={job.key} item={job} index={i} last={i === work.length - 1} compact />)}
        </ol>
      </div>
    </Section>
  );
};
