import { ArrowUpRight, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { ProjectCover } from "@/components/ui/ProjectCover";
import { Reveal } from "@/components/ui/Reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, TagList } from "@/components/ui/Tag";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { projectYears } from "@/lib/portfolio";
import { GithubIcon } from "@/lib/profile";
import { cn } from "@/lib/utils";

const useHref = (project) => `${usePortfolioPath()}/projects/${project.slug}`;

// Source / live links sit above the card-wide link so they stay clickable
const ProjectLinks = ({ project, className }) =>
  project.github_url || project.live_url ? (
    <div className={cn("relative z-10 flex items-center gap-1 text-muted-foreground", className)}>
      {project.github_url && (
        <a href={project.github_url} target="_blank" rel="noreferrer" aria-label={`${project.title}: source code`} className="inline-flex size-9 items-center justify-center rounded-full transition hover:bg-secondary hover:text-foreground">
          <GithubIcon className="size-4" />
        </a>
      )}
      {project.live_url && (
        <a href={project.live_url} target="_blank" rel="noreferrer" aria-label={`${project.title}: live site`} className="inline-flex size-9 items-center justify-center rounded-full transition hover:bg-secondary hover:text-foreground">
          <ExternalLink className="size-4" />
        </a>
      )}
    </div>
  ) : null;

const Meta = ({ project }) => {
  const years = projectYears(project);
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
      <StatusBadge status={project.status} label={project.status_display} />
      {project.category && <span className="font-mono uppercase tracking-wider">{project.category}</span>}
      {years && <span className="font-mono">{years}</span>}
    </div>
  );
};

/** Grid card. */
export const ProjectCard = ({ project, className }) => {
  const href = useHref(project);
  return (
    <article className={cn("group surface surface-hover relative flex min-w-0 flex-col overflow-hidden", className)}>
      <ProjectCover project={project} className="border-b transition-transform duration-500 [&_img]:group-hover:scale-[1.03] [&_img]:transition-transform [&_img]:duration-500" />
      <div className="flex flex-1 flex-col p-5 md:p-6">
        <Meta project={project} />
        <h3 className="font-heading mt-3 text-2xl leading-tight break-words">
          <Link to={href} className="after:absolute after:inset-0 after:rounded-2xl">
            {project.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">{project.summary}</p>
        <TagList items={project.skills} max={4} className="mt-5" />
        <div className="mt-5 flex items-center justify-between border-t pt-3">
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-ink">
            Case study
            <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
          <ProjectLinks project={project} />
        </div>
      </div>
    </article>
  );
};

/** Large alternating image + text block for the home page. */
export const ProjectShowcase = ({ project, index = 0, flip }) => {
  const href = useHref(project);
  return (
    <Reveal as="article" className="group relative grid min-w-0 items-center gap-6 md:grid-cols-12 md:gap-10">
      <Link
        to={href}
        tabIndex={-1}
        aria-hidden
        className={cn("surface surface-hover block overflow-hidden md:col-span-7", flip && "md:order-2")}
      >
        <ProjectCover project={project} />
      </Link>
      <div className={cn("min-w-0 md:col-span-5", flip && "md:order-1")}>
        <p className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</p>
        <div className="mt-3">
          <Meta project={project} />
        </div>
        <h3 className="font-heading mt-4 text-h2 break-words">
          <Link to={href} className="transition hover:text-primary-ink">
            {project.title}
          </Link>
        </h3>
        <p className="mt-4 leading-7 text-muted-foreground">{project.summary}</p>
        {project.role && <p className="mt-3 text-sm">Role: <span className="text-muted-foreground">{project.role}</span></p>}
        <TagList items={project.skills} max={5} className="mt-5" />
        <div className="mt-6 flex items-center gap-3">
          <Link to={href} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-ink link-underline">
            Read the case study <ArrowUpRight className="size-4" />
          </Link>
          <ProjectLinks project={project} />
        </div>
      </div>
    </Reveal>
  );
};

/** Compact row: title, summary and year. */
export const ProjectRow = ({ project }) => {
  const href = useHref(project);
  const years = projectYears(project);
  return (
    <article className="group relative grid min-w-0 grid-cols-[1fr_auto] items-start gap-x-4 gap-y-1 border-b py-5 sm:grid-cols-[6rem_1fr_auto] sm:py-6">
      <p className="hidden pt-1 font-mono text-xs text-muted-foreground sm:block">{years}</p>
      <div className="min-w-0">
        <h3 className="font-heading text-xl leading-snug break-words md:text-2xl">
          <Link to={href} className="transition after:absolute after:inset-0 group-hover:text-primary-ink">
            {project.title}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{project.summary}</p>
        <p className="mt-2 font-mono text-xs text-muted-foreground sm:hidden">{years}</p>
      </div>
      <ArrowUpRight className="mt-1 size-5 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary-ink" aria-hidden />
    </article>
  );
};

export const ProjectCardSkeleton = () => (
  <div className="surface overflow-hidden" role="status" aria-label="Loading">
    <Skeleton className="aspect-[16/9] w-full rounded-none" />
    <div className="space-y-3 p-6">
      <Skeleton className="h-5 w-24 rounded-full" />
      <Skeleton className="h-7 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  </div>
);
