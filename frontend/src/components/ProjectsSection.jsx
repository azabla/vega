import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { portfolioAPI } from "@/services/portfolioAPI";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { ProjectCard } from "@/components/ProjectCard";

export const ProjectsSection = () => {
  const base = usePortfolioPath();
  const { data: projects, loading } = usePortfolioData(portfolioAPI.getFeaturedProjects);

  return (
    <section id="projects" className="py-24 px-4 relative">
      <div className="container max-w-6xl">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary font-medium mb-3">Selected Work</p>

          <h2 className="text-4xl font-bold">Featured Projects</h2>

          <p className="mt-5 text-muted-foreground leading-7">
            A selection of projects that demonstrate my experience building
            scalable backend systems, APIs, SaaS platforms, and modern web
            applications.
          </p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground">Loading projects...</p>
        ) : projects?.length ? (
          <div className="grid lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">No featured projects yet.</p>
        )}

        <div className="mt-16 flex justify-center">
          <Link to={`${base}/projects`} className="cosmic-button flex items-center gap-2">
            View Project Archive
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};
