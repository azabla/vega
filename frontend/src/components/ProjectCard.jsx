import { ArrowRight, ExternalLink, FolderGit2 } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Link } from "react-router-dom";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";

export const ProjectCard = ({ project }) => {
  const base = usePortfolioPath();

  return (
    <article className="group gradient-border overflow-hidden bg-card card-hover flex flex-col">
      <div className="relative overflow-hidden">
        {project.thumbnail ? (
          <img
            src={project.thumbnail}
            alt={project.title}
            className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-52 w-full flex items-center justify-center bg-gradient-to-br from-primary/20 via-primary/5 to-background">
            <FolderGit2 className="h-12 w-12 text-primary/60" />
          </div>
        )}

        {project.featured && (
          <div className="absolute left-4 top-4 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium px-3 py-1">
            Featured
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-6 text-left">
        <h3 className="text-xl font-semibold mb-3">{project.title}</h3>

        <p className="text-muted-foreground text-sm leading-6 flex-1">{project.summary}</p>

        <div className="flex flex-wrap gap-2 mt-6">
          {project.skills.map((skill) => (
            <span
              key={skill.id}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium"
            >
              {skill.name}
            </span>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Link
            to={`${base}/projects/${project.slug}`}
            className="flex items-center gap-2 text-primary font-medium group/link"
          >
            View Case Study
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover/link:translate-x-1"
            />
          </Link>

          <div className="flex gap-4">
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noreferrer"
                aria-label="Source code on GitHub"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <FaGithub size={18} />
              </a>
            )}

            {project.live_url && (
              <a
                href={project.live_url}
                target="_blank"
                rel="noreferrer"
                aria-label="Live site"
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <ExternalLink size={18} />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};
