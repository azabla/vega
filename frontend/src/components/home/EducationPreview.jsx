import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/skeleton";
import { TimelineItem } from "@/components/Timeline";
import { useAppearance } from "@/hooks/useAppearance";
import { useEducation } from "@/hooks/usePortfolio";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { timelineFromEducation } from "@/lib/portfolio";

/** Degrees, diplomas and TVET on the home page: off by default, on for students. */
export const EducationPreview = () => {
  const { data: education, loading } = useEducation();
  const { settings } = useAppearance();
  const base = usePortfolioPath();

  const items = (education ?? []).map(timelineFromEducation).slice(0, 3);
  if (!loading && !items.length) return null;

  return (
    <Section id="education">
      <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <SectionHeader
          eyebrow="Education"
          title="Where I've studied"
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
            : items.map((item, i) => <TimelineItem key={item.key} item={item} index={i} last={i === items.length - 1} compact />)}
        </ol>
      </div>
    </Section>
  );
};
