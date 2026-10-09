import { ArrowLeft, ArrowRight, ExternalLink, FolderSearch } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { TestimonialCard } from "@/components/home/Testimonials";
import { PortfolioLayout } from "@/components/PortfolioLayout";
import { Button } from "@/components/ui/button";
import { Counter } from "@/components/ui/Counter";
import { EmptyState } from "@/components/ui/EmptyState";
import { Img } from "@/components/ui/Img";
import { Lightbox } from "@/components/ui/Lightbox";
import { ProjectCover } from "@/components/ui/ProjectCover";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge, TagList } from "@/components/ui/Tag";
import { useProject, useProjects, useTestimonials } from "@/hooks/usePortfolio";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { formatDuration, pluralize } from "@/lib/format";
import { projectYears } from "@/lib/portfolio";
import { GithubIcon } from "@/lib/profile";
import { cn } from "@/lib/utils";

const Block = ({ id, number, title, children }) => (
  <Reveal as="section" id={id} aria-labelledby={`${id}-title`} className="scroll-mt-28">
    <p className="font-mono text-xs text-muted-foreground">{String(number).padStart(2, "0")}</p>
    <h2 id={`${id}-title`} className="font-heading mt-2 text-3xl md:text-4xl">
      {title}
    </h2>
    <div className="mt-6">{children}</div>
  </Reveal>
);

const Prose = ({ children }) => <p className="whitespace-pre-line text-[1.05rem] leading-8 text-muted-foreground">{children}</p>;

// Highlights the section currently in view in the "On this page" list
const useActiveId = (ids) => {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join(",");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" }
    );
    key.split(",").forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [key]);
  return active;
};

const DetailSkeleton = () => (
  <div className="container pt-28 pb-24" role="status" aria-label="Loading">
    <Skeleton className="h-4 w-28" />
    <Skeleton className="mt-8 h-14 w-2/3" />
    <Skeleton className="mt-4 h-5 w-1/2" />
    <Skeleton className="mt-10 aspect-[16/9] w-full rounded-2xl md:aspect-[21/9]" />
  </div>
);

export const ProjectDetail = () => {
  const { slug } = useParams();
  const base = usePortfolioPath();
  const { data: project, loading, error } = useProject(slug);
  const { data: all } = useProjects();
  const { data: testimonials } = useTestimonials();
  const [photo, setPhoto] = useState(null);

  const testimonial = testimonials?.find((t) => t.project?.slug === slug);
  const metrics = project?.metrics ?? [];
  const sections = project
    ? [
        { id: "overview", title: "Overview", show: Boolean(project.overview) },
        { id: "problem", title: "The problem", show: Boolean(project.problem) },
        { id: "features", title: "What I built", show: project.features.length > 0 },
        { id: "architecture", title: "Architecture", show: Boolean(project.architecture?.description || project.architecture?.diagram) },
        { id: "challenges", title: "Challenges", show: project.challenges.length > 0 },
        { id: "results", title: "Results", show: Boolean(project.results) || metrics.length > 0 },
        { id: "lessons", title: "Lessons learned", show: project.lessons.length > 0 },
        { id: "gallery", title: "Gallery", show: project.gallery.length > 0 },
      ].filter((s) => s.show)
    : [];
  const active = useActiveId(sections.map((s) => s.id));

  if (loading) {
    return (
      <PortfolioLayout>
        <DetailSkeleton />
      </PortfolioLayout>
    );
  }

  if (error || !project) {
    return (
      <PortfolioLayout title="Project not found">
        <div className="container pt-32 pb-24">
          <EmptyState
            icon={FolderSearch}
            title="This project doesn't exist"
            description="It may have been renamed or removed."
            action={<Button href={`${base}/projects`}>All projects</Button>}
          />
        </div>
      </PortfolioLayout>
    );
  }

  const index = all?.findIndex((p) => p.slug === project.slug) ?? -1;
  const next = all?.length > 1 ? all[(index + 1) % all.length] : null;
  const years = projectYears(project);
  const facts = [
    project.role && { label: "Role", value: project.role },
    years && {
      label: "Timeline",
      value: years,
      detail: project.started_on && (project.ended_on || project.status === "in_progress") ? formatDuration(project.started_on, project.ended_on) : null,
    },
    project.team_size && { label: "Team", value: project.team_size === 1 ? "Solo" : pluralize(project.team_size, "person").replace("persons", "people") },
    { label: "Status", value: <StatusBadge status={project.status} label={project.status_display} /> },
  ].filter(Boolean);
  const number = (id) => sections.findIndex((s) => s.id === id) + 1;
  const images = project.gallery.map((g) => ({ src: g.image, caption: g.caption }));

  return (
    <PortfolioLayout
      title={project.title}
      meta={{
        description: project.summary,
        image: project.thumbnail,
        type: "article",
        jsonLd: { "@context": "https://schema.org", "@type": "CreativeWork", name: project.title, description: project.summary, url: window.location.href },
      }}
    >
      <article className="pb-16 md:pb-24">
        <header className="container pt-24 md:pt-32">
          <Link to={`${base}/projects`} className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="size-4" /> All projects
          </Link>
          <div className="mt-8 max-w-4xl animate-fade-up">
            <Eyebrow>{project.category || "Case study"}</Eyebrow>
            <h1 className="font-heading mt-5 text-display break-words">{project.title}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">{project.summary}</p>
            {(project.live_url || project.github_url) && (
              <div className="mt-8 flex flex-wrap gap-2">
                {project.live_url && (
                  <Button href={project.live_url} size="lg">
                    Visit live site <ExternalLink />
                  </Button>
                )}
                {project.github_url && (
                  <Button href={project.github_url} size="lg" variant="secondary">
                    <GithubIcon /> Source code
                  </Button>
                )}
              </div>
            )}
          </div>

          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border md:grid-cols-4">
            {facts.map((f) => (
              <div key={f.label} className="min-w-0 bg-card p-4 md:p-5">
                <dt className="eyebrow text-muted-foreground">{f.label}</dt>
                <dd className="mt-2 text-sm font-medium break-words">{f.value}</dd>
                {f.detail && <dd className="mt-0.5 font-mono text-xs text-muted-foreground">{f.detail}</dd>}
              </div>
            ))}
          </dl>
        </header>

        <div className="container mt-6">
          {/* the cover sits in a quiet browser frame */}
          <div className="surface overflow-hidden">
            <div className="flex items-center gap-1.5 border-b px-4 py-2.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
            </div>
            <ProjectCover project={project} ratio="16 / 8" eager />
          </div>
        </div>

        <div className="container mt-14 grid gap-14 md:mt-20 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-16">
          <div className="hidden lg:block">
            <div className="sticky top-28 space-y-8">
              {sections.length > 1 && (
                <nav aria-label="On this page">
                  <p className="eyebrow mb-3 text-muted-foreground">On this page</p>
                  <ul className="space-y-1 border-l text-sm">
                    {sections.map((s) => (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          aria-current={active === s.id ? "location" : undefined}
                          className={cn(
                            "-ml-px block border-l py-1 pl-4 transition",
                            active === s.id ? "border-primary-ink text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
              {project.skills.length > 0 && (
                <div>
                  <p className="eyebrow mb-3 text-muted-foreground">Stack</p>
                  <TagList items={project.skills} max={20} />
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 max-w-3xl space-y-16 md:space-y-20">
            {project.skills.length > 0 && (
              <div className="lg:hidden">
                <p className="eyebrow mb-3 text-muted-foreground">Stack</p>
                <TagList items={project.skills} max={12} />
              </div>
            )}

            {project.overview && (
              <Block id="overview" number={number("overview")} title="Overview">
                <Prose>{project.overview}</Prose>
              </Block>
            )}

            {project.problem && (
              <Block id="problem" number={number("problem")} title="The problem">
                <Prose>{project.problem}</Prose>
              </Block>
            )}

            {project.features.length > 0 && (
              <Block id="features" number={number("features")} title="What I built">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {project.features.map((f) => (
                    <li key={f.id} className="surface flex min-w-0 flex-col overflow-hidden">
                      {f.image && <Img src={f.image} alt="" ratio="16 / 10" className="border-b" />}
                      <div className="p-5">
                        <h3 className="font-medium">{f.title}</h3>
                        {f.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{f.description}</p>}
                        {(f.demo_url || f.documentation_url) && (
                          <div className="mt-3 flex gap-4 text-sm">
                            {f.demo_url && (
                              <a href={f.demo_url} target="_blank" rel="noreferrer" className="text-primary-ink link-underline">
                                Demo
                              </a>
                            )}
                            {f.documentation_url && (
                              <a href={f.documentation_url} target="_blank" rel="noreferrer" className="text-primary-ink link-underline">
                                Docs
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            {sections.some((s) => s.id === "architecture") && (
              <Block id="architecture" number={number("architecture")} title="Architecture">
                {project.architecture.description && <Prose>{project.architecture.description}</Prose>}
                {project.architecture.diagram && (
                  <button type="button" onClick={() => setPhoto("diagram")} className="mt-6 block w-full cursor-zoom-in">
                    <Img src={project.architecture.diagram} alt={`${project.title} architecture diagram`} className="surface bg-card" imgClassName="object-contain" />
                  </button>
                )}
              </Block>
            )}

            {project.challenges.length > 0 && (
              <Block id="challenges" number={number("challenges")} title="Challenges">
                <ol className="space-y-3">
                  {project.challenges.map((c) => (
                    <li key={c.id} className="surface p-5 md:p-6">
                      <p className="font-medium">{c.problem}</p>
                      <p className="mt-3 border-l-2 border-primary-ink/60 pl-4 text-sm leading-6 text-muted-foreground">{c.solution}</p>
                    </li>
                  ))}
                </ol>
              </Block>
            )}

            {(project.results || metrics.length > 0) && (
              <Block id="results" number={number("results")} title="Results">
                {metrics.length > 0 && (
                  <dl className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {metrics.map((m) => (
                      <div key={m.id} className="surface p-5">
                        <dt className="sr-only">{m.label}</dt>
                        <dd className="font-heading text-5xl leading-none text-primary-ink">
                          <Counter value={m.value} />
                        </dd>
                        <dd className="mt-3 font-medium">{m.label}</dd>
                        {m.description && <dd className="mt-1 text-sm leading-6 text-muted-foreground">{m.description}</dd>}
                      </div>
                    ))}
                  </dl>
                )}
                {project.results && <Prose>{project.results}</Prose>}
              </Block>
            )}

            {project.lessons.length > 0 && (
              <Block id="lessons" number={number("lessons")} title="Lessons learned">
                <ul className="divide-y border-y">
                  {project.lessons.map((l) => (
                    <li key={l.id} className="py-5">
                      <p className="font-medium">{l.title}</p>
                      {l.description && <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{l.description}</p>}
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            {project.gallery.length > 0 && (
              <Block id="gallery" number={number("gallery")} title="Gallery">
                <ul className="grid gap-3 sm:grid-cols-2">
                  {project.gallery.map((g, i) => (
                    <li key={g.id}>
                      <button type="button" onClick={() => setPhoto(i)} className="block w-full cursor-zoom-in text-left">
                        <Img src={g.image} alt={g.caption || `${project.title} screenshot ${i + 1}`} ratio="16 / 10" className="surface" />
                        {g.caption && <span className="mt-2 block text-xs text-muted-foreground">{g.caption}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </Block>
            )}

            {testimonial && <TestimonialCard testimonial={testimonial} featured className="h-auto" />}
          </div>
        </div>

        <Lightbox
          images={photo === "diagram" ? [{ src: project.architecture?.diagram, caption: "Architecture" }] : images}
          index={photo === "diagram" ? 0 : photo}
          onIndexChange={(i) => setPhoto(photo === "diagram" && i != null ? "diagram" : i)}
          title={project.title}
        />

        {next && next.slug !== project.slug && (
          <div className="container mt-20 md:mt-28">
            <Link to={`${base}/projects/${next.slug}`} className="group surface surface-hover flex items-center justify-between gap-6 p-6 md:p-10">
              <span className="min-w-0">
                <span className="eyebrow text-muted-foreground">Next project</span>
                <span className="font-heading mt-2 block truncate text-3xl md:text-5xl">{next.title}</span>
              </span>
              <ArrowRight className="size-7 shrink-0 text-primary-ink transition group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
        )}
      </article>
    </PortfolioLayout>
  );
};
