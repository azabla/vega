import { ArrowLeft, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PortfolioLayout } from "@/components/PortfolioLayout";
import { ProjectCard, ProjectCardSkeleton } from "@/components/ProjectCard";
import { portfolioAPI } from "@/services/portfolioAPI";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { cn } from "@/lib/utils";

const STATUSES = [
  ["all", "All"],
  ["completed", "Completed"],
  ["in_progress", "In progress"],
  ["archived", "Archived"],
];

const chip = (active) =>
  cn(
    "rounded-full border px-3 py-1.5 text-xs font-medium transition whitespace-nowrap",
    active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/50 hover:text-primary"
  );

export const ProjectArchive = () => {
  const base = usePortfolioPath();
  const { data: projects, loading } = usePortfolioData(portfolioAPI.getProjects);
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("all");
  const [status, setStatus] = useState("all");

  // skills ordered by how many projects use them
  const skills = useMemo(() => {
    const counts = new Map();
    projects?.forEach((p) =>
      p.skills.forEach((s) => counts.set(s.slug, { name: s.name, n: (counts.get(s.slug)?.n ?? 0) + 1 }))
    );
    return [...counts].sort((a, b) => b[1].n - a[1].n);
  }, [projects]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (projects ?? []).filter(
      (p) =>
        (skill === "all" || p.skills.some((s) => s.slug === skill)) &&
        (status === "all" || p.status === status) &&
        (!q || p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q))
    );
  }, [projects, query, skill, status]);

  const filtered = query || skill !== "all" || status !== "all";

  return (
    <PortfolioLayout title="Projects">
      <section className="container pt-28 pb-24">
        <Link
          to={`${base || "/"}#projects`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to portfolio
        </Link>

        <header className="mt-8 animate-fade-up">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">Archive</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">All projects</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Everything I've built — from production platforms to early experiments. Filter by skill or status.
          </p>
        </header>

        <div className="mt-10 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative sm:w-80">
              <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects"
                className="h-10 w-full rounded-full border border-input bg-card pr-4 pl-10 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-ring/30"
              />
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {STATUSES.map(([value, label]) => (
                <button key={value} type="button" onClick={() => setStatus(value)} className={chip(status === value)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button type="button" onClick={() => setSkill("all")} className={chip(skill === "all")}>
              All skills
            </button>
            {skills.map(([slug, { name, n }]) => (
              <button key={slug} type="button" onClick={() => setSkill(slug)} className={chip(skill === slug)}>
                {name} <span className="opacity-60">{n}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ProjectCardSkeleton key={i} />
              ))}
            </div>
          ) : visible.length ? (
            <>
              {filtered && (
                <p className="mb-6 text-sm text-muted-foreground">
                  {visible.length} of {projects.length} projects
                </p>
              )}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {visible.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </>
          ) : (
            <div className="surface flex flex-col items-center gap-3 py-16 text-center">
              <p className="font-medium">No projects match these filters</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setSkill("all");
                  setStatus("all");
                }}
                className="inline-flex items-center gap-1 text-sm text-primary"
              >
                <X className="size-4" /> Clear filters
              </button>
            </div>
          )}
        </div>
      </section>
    </PortfolioLayout>
  );
};
