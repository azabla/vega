import { ArrowUpRight, ExternalLink } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Link } from "react-router-dom";
import { ProjectCover } from "@/components/ui/ProjectCover";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, Tag } from "@/components/ui/Tag";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { yearOf } from "@/lib/format";

const MAX_TAGS = 4;

export const ProjectCard = ({ project }) => {
  const base = usePortfolioPath();
  const href = `${base}/projects/${project.slug}`;
  const extra = project.skills.length - MAX_TAGS;

  return (
    <article className="group surface surface-hover relative flex flex-col overflow-hidden">
      <Link to={href} className="block overflow-hidden" tabIndex={-1} aria-hidden>
        <ProjectCover
          project={project}
          className="aspect-[16/9] w-full transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <StatusBadge status={project.status} label={project.status_display} />
          {project.started_on && <span>{yearOf(project.started_on)}</span>}
        </div>

        <h3 className="mt-3 text-lg font-semibold leading-snug">
          <Link to={href} className="after:absolute after:inset-0">
            {project.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">{project.summary}</p>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {project.skills.slice(0, MAX_TAGS).map((s) => (
            <Tag key={s.id}>{s.name}</Tag>
          ))}
          {extra > 0 && <Tag className="text-muted-foreground">+{extra}</Tag>}
        </div>

        <div className="mt-6 flex items-center justify-between border-t pt-4 text-sm">
          <span className="inline-flex items-center gap-1 font-medium text-primary">
            Case study
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
          {/* above the card-wide link */}
          <div className="relative z-10 flex gap-3 text-muted-foreground">
            {project.github_url && (
              <a href={project.github_url} target="_blank" rel="noreferrer" aria-label="Source code" className="hover:text-foreground">
                <FaGithub className="size-4" />
              </a>
            )}
            {project.live_url && (
              <a href={project.live_url} target="_blank" rel="noreferrer" aria-label="Live site" className="hover:text-foreground">
                <ExternalLink className="size-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export const ProjectCardSkeleton = () => (
  <div className="surface overflow-hidden">
    <Skeleton className="aspect-[16/9] w-full rounded-none" />
    <div className="space-y-3 p-6">
      <Skeleton className="h-5 w-24 rounded-full" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>
    </div>
  </div>
);
