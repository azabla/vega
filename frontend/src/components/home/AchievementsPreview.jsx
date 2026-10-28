import { ArrowRight } from "lucide-react";
import { AchievementItem } from "@/components/AchievementItem";
import { Button } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppearance } from "@/hooks/useAppearance";
import { useAchievements } from "@/hooks/usePortfolio";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { labelsOf } from "@/lib/professions";

const SHOWN = 4;

export const AchievementsPreview = () => {
  const { data: achievements, loading } = useAchievements();
  const { settings } = useAppearance();
  const base = usePortfolioPath();

  if (!loading && !achievements.length) return null;
  const shown = (achievements ?? []).slice(0, SHOWN);
  const mixed = new Set(shown.map((a) => a.kind)).size > 1;

  return (
    <Section id="achievements">
      <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
        <SectionHeader
          eyebrow="Recognition"
          title={labelsOf(settings.profession).achievements}
          className="md:flex-col md:items-start lg:sticky lg:top-28 lg:self-start"
          action={
            settings.pages.achievements &&
            achievements?.length > SHOWN && (
              <Button href={`${base}/achievements`} variant="link">
                All {achievements.length} <ArrowRight />
              </Button>
            )
          }
        />
        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : (
          <ul className="divide-y">
            {shown.map((a) => (
              <AchievementItem key={a.id} item={a} showKind={mixed} compact />
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
};
