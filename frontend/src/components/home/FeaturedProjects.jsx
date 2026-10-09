import { ArrowRight } from "lucide-react";
import { ProjectCard, ProjectCardSkeleton, ProjectRow, ProjectShowcase } from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { useAppearance } from "@/hooks/useAppearance";
import { useProjects } from "@/hooks/usePortfolio";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { featuredProjects } from "@/lib/portfolio";

/** Projects in the owner's chosen layout: showcase | grid | list. */
export const ProjectList = ({ projects, layout }) => {
  if (layout === "list") {
    return (
      <div className="border-t">
        {projects.map((p) => (
          <ProjectRow key={p.id} project={p} />
        ))}
      </div>
    );
  }
  if (layout === "showcase") {
    return (
      <div className="space-y-16 md:space-y-24">
        {projects.map((p, i) => (
          <ProjectShowcase key={p.id} project={p} index={i} flip={i % 2 === 1} />
        ))}
      </div>
    );
  }
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p, i) => (
        <Reveal key={p.id} delay={(i % 3) * 80} className="flex">
          <ProjectCard project={p} className="w-full" />
        </Reveal>
      ))}
    </div>
  );
};

export const FeaturedProjects = () => {
  const { data: projects, loading } = useProjects();
  const { settings } = useAppearance();
  const base = usePortfolioPath();

  if (!loading && !projects.length) return null;
  const featured = featuredProjects(projects ?? [], 3);
  const more = (projects?.length ?? 0) - featured.length;

  return (
    <Section id="projects">
      <SectionHeader
        eyebrow="Selected work"
        title="Things I've built"
        description="Case studies of the work I'm proudest of: the problem, how I approached it and what changed."
        action={
          settings.pages.projects && (
            <Button href={`${base}/projects`} variant="secondary" size="sm">
              {more > 0 ? `All ${projects.length} projects` : "All projects"} <ArrowRight />
            </Button>
          )
        }
      />
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <ProjectList projects={featured} layout={settings.projects_layout} />
      )}
    </Section>
  );
};
