import { Trophy } from "lucide-react";
import { AchievementItem } from "@/components/AchievementItem";
import { PortfolioLayout } from "@/components/PortfolioLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { PageHeader } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppearance } from "@/hooks/useAppearance";
import { useAchievements } from "@/hooks/usePortfolio";
import { pluralize } from "@/lib/format";
import { groupAchievements } from "@/lib/portfolio";
import { labelsOf } from "@/lib/professions";

/** Awards, publications, exhibitions, talks and grants, grouped by kind. */
export const Achievements = () => {
  const { data: achievements, loading } = useAchievements();
  const { settings } = useAppearance();
  const title = labelsOf(settings.profession).achievements;
  const groups = groupAchievements(achievements ?? []);

  return (
    <PortfolioLayout
      title={title}
      meta={{ description: "Awards, publications, exhibitions and talks." }}
    >
      <PageHeader
        eyebrow="Recognition"
        title={title}
        description={
          achievements?.length
            ? groups.map((g) => pluralize(g.items.length, g.one)).join(" · ")
            : "Awards, publications, exhibitions and talks."
        }
      >
        {groups.length > 1 && (
          <nav
            aria-label="Kinds"
            className="scrollbar-none -mx-4 mt-10 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
          >
            {groups.map((g) => (
              <a
                key={g.kind}
                href={`#${g.kind}`}
                className="shrink-0 rounded-full border bg-card px-3.5 py-1.5 text-sm text-muted-foreground transition hover:text-foreground"
              >
                {g.name}{" "}
                <span className="font-mono text-[0.7rem] opacity-60">
                  {g.items.length}
                </span>
              </a>
            ))}
          </nav>
        )}
      </PageHeader>

      <div className="container pb-16 md:pb-24">
        <div className="prose-width space-y-14">
          {loading ? (
            <div className="space-y-3" role="status" aria-label="Loading">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-2xl" />
              ))}
            </div>
          ) : !groups.length ? (
            <EmptyState
              icon={Trophy}
              title="Nothing here yet"
              description="Awards, publications, exhibitions and talks will appear here."
            />
          ) : (
            groups.map((g) => (
              <section
                key={g.kind}
                id={g.kind}
                aria-labelledby={`${g.kind}-title`}
                className="scroll-mt-28"
              >
                <Reveal>
                  <h2
                    id={`${g.kind}-title`}
                    className="mb-6 font-heading text-3xl"
                  >
                    {g.name}
                  </h2>
                </Reveal>
                <ul className="divide-y">
                  {g.items.map((a) => (
                    <AchievementItem key={a.id} item={a} />
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </PortfolioLayout>
  );
};
