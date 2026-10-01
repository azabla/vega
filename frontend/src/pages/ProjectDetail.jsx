import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  ExternalLink,
  Lightbulb,
  Network,
  Puzzle,
  Sparkles,
  User,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Link, useParams } from "react-router-dom";
import { PortfolioLayout } from "@/components/PortfolioLayout";
import { ProjectCover } from "@/components/ui/ProjectCover";
import { Reveal } from "@/components/ui/Reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, Tag } from "@/components/ui/Tag";
import { portfolioAPI } from "@/services/portfolioAPI";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { formatMonthYear } from "@/lib/format";

const Block = ({ id, icon, title, children }) => {
  const Icon = icon;
  return (
    <Reveal as="section" id={id} className="scroll-mt-24">
      <h2 className="flex items-center gap-2.5 text-xl font-semibold tracking-tight">
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-4" />
        </span>
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </Reveal>
  );
};

const DetailSkeleton = () => (
  <div className="container pt-28 pb-24">
    <Skeleton className="h-4 w-28" />
    <Skeleton className="mt-8 h-6 w-32 rounded-full" />
    <Skeleton className="mt-4 h-12 w-2/3" />
    <Skeleton className="mt-4 h-5 w-1/2" />
    <Skeleton className="mt-10 aspect-[21/9] w-full rounded-2xl" />
    <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_18rem]">
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-11/12" />
        <Skeleton className="h-4 w-4/5" />
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  </div>
);

export const ProjectDetail = () => {
  const { slug } = useParams();
  const base = usePortfolioPath();
  const { data: project, loading, error } = usePortfolioData(portfolioAPI.getProject, slug);
  const { data: all } = usePortfolioData(portfolioAPI.getProjects);

  if (loading) {
    return (
      <PortfolioLayout>
        <DetailSkeleton />
      </PortfolioLayout>
    );
  }

  if (error || !project) {
    return (
      <PortfolioLayout title="Not found">
        <div className="container flex min-h-[60vh] flex-col items-center justify-center gap-4 pt-24 text-center">
          <p className="text-lg font-medium">Project not found</p>
          <Link to={`${base}/projects`} className="text-sm text-primary">
            ← Back to all projects
          </Link>
        </div>
      </PortfolioLayout>
    );
  }

  const index = all?.findIndex((p) => p.slug === project.slug) ?? -1;
  const prev = index > 0 ? all[index - 1] : null;
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

  const sections = [
    { id: "overview", title: "Overview", show: true },
    { id: "features", title: "Key features", show: project.features.length > 0 },
    { id: "architecture", title: "Architecture", show: Boolean(project.architecture?.description || project.architecture?.diagram) },
    { id: "challenges", title: "Challenges", show: project.challenges.length > 0 },
    { id: "lessons", title: "Lessons learned", show: project.lessons.length > 0 },
    { id: "gallery", title: "Gallery", show: project.gallery.length > 0 },
  ].filter((s) => s.show);

  const facts = [
    project.role && { icon: User, label: "Role", value: project.role },
    project.started_on && { icon: Calendar, label: "Started", value: formatMonthYear(project.started_on) },
  ].filter(Boolean);

  return (
    <PortfolioLayout title={project.title}>
      <article className="container pt-28 pb-24">
        <Link
          to={`${base}/projects`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All projects
        </Link>

        <header className="mt-8 max-w-3xl animate-fade-up">
          <StatusBadge status={project.status} label={project.status_display} />
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">{project.title}</h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">{project.summary}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            {project.live_url && (
              <a
                href={project.live_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:brightness-110"
              >
                Visit live site <ExternalLink className="size-4" />
              </a>
            )}
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-full border bg-card px-5 text-sm font-medium hover:bg-secondary"
              >
                <FaGithub className="size-4" /> Source code
              </a>
            )}
          </div>
        </header>

        <ProjectCover project={project} className="mt-12 aspect-[21/9] w-full rounded-2xl border" />

        <div className="mt-14 grid gap-14 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-16">
            <Block id="overview" icon={BookOpen} title="Overview">
              <p className="whitespace-pre-line text-[17px] leading-8 text-muted-foreground">{project.overview}</p>
            </Block>

            {project.features.length > 0 && (
              <Block id="features" icon={Sparkles} title="Key features">
                <div className="grid gap-4 sm:grid-cols-2">
                  {project.features.map((f) => (
                    <div key={f.id} className="surface p-5">
                      {f.image && <img src={f.image} alt="" className="mb-4 w-full rounded-lg border" />}
                      <h3 className="font-medium">{f.title}</h3>
                      {f.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{f.description}</p>}
                      {(f.demo_url || f.documentation_url) && (
                        <div className="mt-3 flex gap-4 text-sm">
                          {f.demo_url && (
                            <a href={f.demo_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                              Demo
                            </a>
                          )}
                          {f.documentation_url && (
                            <a href={f.documentation_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                              Docs
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Block>
            )}

            {sections.some((s) => s.id === "architecture") && (
              <Block id="architecture" icon={Network} title="Architecture">
                {project.architecture.description && (
                  <p className="whitespace-pre-line leading-7 text-muted-foreground">{project.architecture.description}</p>
                )}
                {project.architecture.diagram && (
                  <img
                    src={project.architecture.diagram}
                    alt={`${project.title} architecture diagram`}
                    className="mt-6 w-full rounded-2xl border bg-card"
                  />
                )}
              </Block>
            )}

            {project.challenges.length > 0 && (
              <Block id="challenges" icon={Puzzle} title="Challenges & solutions">
                <div className="space-y-4">
                  {project.challenges.map((c) => (
                    <div key={c.id} className="surface overflow-hidden">
                      <p className="border-b bg-secondary/40 px-5 py-3 text-sm font-medium">
                        <span className="mr-2 font-mono text-xs text-amber-600 dark:text-amber-300">PROBLEM</span>
                        {c.problem}
                      </p>
                      <p className="px-5 py-4 text-sm leading-6 text-muted-foreground">
                        <span className="mr-2 font-mono text-xs text-emerald-600 dark:text-emerald-300">SOLUTION</span>
                        {c.solution}
                      </p>
                    </div>
                  ))}
                </div>
              </Block>
            )}

            {project.lessons.length > 0 && (
              <Block id="lessons" icon={Lightbulb} title="Lessons learned">
                <ul className="space-y-4">
                  {project.lessons.map((l) => (
                    <li key={l.id} className="border-l-2 border-primary/40 pl-4">
                      <p className="font-medium">{l.title}</p>
                      {l.description && <p className="mt-1 text-sm leading-6 text-muted-foreground">{l.description}</p>}
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            {project.gallery.length > 0 && (
              <Block id="gallery" icon={Sparkles} title="Gallery">
                <div className="grid gap-4 sm:grid-cols-2">
                  {project.gallery.map((img) => (
                    <figure key={img.id}>
                      <img src={img.image} alt={img.caption || project.title} className="w-full rounded-xl border" />
                      {img.caption && <figcaption className="mt-2 text-xs text-muted-foreground">{img.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              </Block>
            )}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="surface divide-y">
              {facts.length > 0 && (
                <dl className="space-y-4 p-5">
                  {facts.map((fact) => (
                    <div key={fact.label} className="flex items-start gap-3">
                      <fact.icon className="mt-0.5 size-4 text-muted-foreground" />
                      <div>
                        <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                        <dd className="text-sm font-medium">{fact.value}</dd>
                      </div>
                    </div>
                  ))}
                </dl>
              )}
              {project.skills.length > 0 && (
                <div className="p-5">
                  <p className="mb-3 text-xs text-muted-foreground">Stack</p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.skills.map((s) => (
                      <Tag key={s.id}>{s.name}</Tag>
                    ))}
                  </div>
                </div>
              )}
              {sections.length > 1 && (
                <nav className="hidden p-5 lg:block" aria-label="On this page">
                  <p className="mb-3 text-xs text-muted-foreground">On this page</p>
                  <ul className="space-y-2 text-sm">
                    {sections.map((s) => (
                      <li key={s.id}>
                        <a href={`#${s.id}`} className="text-muted-foreground transition hover:text-foreground">
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </div>
          </aside>
        </div>

        {(prev || next) && (
          <nav className="mt-20 grid gap-4 border-t pt-10 sm:grid-cols-2" aria-label="More projects">
            {prev ? (
              <Link to={`${base}/projects/${prev.slug}`} className="surface surface-hover group p-5">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowLeft className="size-3" /> Previous
                </span>
                <span className="mt-1 block font-medium group-hover:text-primary">{prev.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link to={`${base}/projects/${next.slug}`} className="surface surface-hover group p-5 text-right">
                <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                  Next <ArrowRight className="size-3" />
                </span>
                <span className="mt-1 block font-medium group-hover:text-primary">{next.title}</span>
              </Link>
            )}
          </nav>
        )}
      </article>
    </PortfolioLayout>
  );
};
