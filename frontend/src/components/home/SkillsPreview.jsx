import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppearance } from "@/hooks/useAppearance";
import { useSkills } from "@/hooks/usePortfolio";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { evidenceSummary, proofCount, strongestSkills } from "@/lib/portfolio";

export const SkillsPreview = () => {
  const { data: skills, loading } = useSkills();
  const { settings } = useAppearance();
  const base = usePortfolioPath();

  if (!loading && !skills.length) return null;
  const top = strongestSkills(skills ?? []).filter((s) => proofCount(s) > 0 || s.years_of_experience).slice(0, 8);
  const shown = top.length ? top : (skills ?? []).slice(0, 8);
  const href = (s) => (settings.pages.skills ? `${base}/skills#${s.slug}` : null);

  return (
    <Section id="skills">
      <SectionHeader
        eyebrow="Skills"
        title="What I'm good at, with proof"
        description="No progress bars. Each skill links to the projects and roles where I've used it."
        action={
          settings.pages.skills && (
            <Button href={`${base}/skills`} variant="secondary" size="sm">
              All {skills?.length ?? ""} skills <ArrowRight />
            </Button>
          )
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
          : shown.map((skill, i) => {
              const to = href(skill);
              const Card = to ? Link : "div";
              return (
                <Reveal key={skill.id} delay={(i % 4) * 60} className="flex">
                  <Card to={to} className={`group surface flex w-full min-w-0 flex-col p-5 ${to ? "surface-hover" : ""}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-mono text-[0.7rem] uppercase tracking-wider text-muted-foreground">{skill.category?.name}</p>
                      {to && <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition group-hover:text-primary-ink" />}
                    </div>
                    <p className="font-heading mt-2 truncate text-2xl">{skill.name}</p>
                    <p className="mt-auto pt-3 text-sm text-muted-foreground">{evidenceSummary(skill) || "—"}</p>
                  </Card>
                </Reveal>
              );
            })}
      </div>
    </Section>
  );
};
