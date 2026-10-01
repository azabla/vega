import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ProjectCard, ProjectCardSkeleton } from "@/components/ProjectCard";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { portfolioAPI } from "@/services/portfolioAPI";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";

export const ProjectsSection = () => {
  const base = usePortfolioPath();
  const { data: featured, loading } = usePortfolioData(portfolioAPI.getFeaturedProjects);
  const { data: all } = usePortfolioData(portfolioAPI.getProjects);

  if (!loading && !featured?.length && !all?.length) return null;
  // fall back to the newest projects when none are marked featured
  const projects = featured?.length ? featured : (all ?? []).slice(0, 3);

  return (
    <Section id="projects">
      <SectionHeader
        eyebrow="Selected work"
        title="Featured projects"
        description="Products I've designed and built end to end. Open a project for the full case study: architecture, challenges and what I learned."
        action={
          <Link
            to={`${base}/projects`}
            className="group inline-flex shrink-0 items-center gap-2 text-sm font-medium text-primary"
          >
            All {all?.length ? `${all.length} ` : ""}projects
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <ProjectCardSkeleton key={i} />)
          : projects.map((project, i) => (
              <Reveal key={project.id} delay={i * 80} className="flex">
                <ProjectCard project={project} />
              </Reveal>
            ))}
      </div>
    </Section>
  );
};
