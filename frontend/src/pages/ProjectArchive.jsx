import { ArrowLeft, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PortfolioLayout } from "@/components/PortfolioLayout";
import { ProjectCard } from "@/components/ProjectCard";
import { portfolioAPI } from "@/services/portfolioAPI";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { cn } from "@/lib/utils";

export const ProjectArchive = () => {
  const base = usePortfolioPath();
  const { data: projects, loading } = usePortfolioData(portfolioAPI.getProjects);
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState("all");

  const skills = useMemo(() => {
    const all = new Map();
    projects?.forEach((p) => p.skills.forEach((s) => all.set(s.slug, s.name)));
    return [...all].sort((a, b) => a[1].localeCompare(b[1]));
  }, [projects]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (projects ?? []).filter(
      (p) =>
        (skill === "all" || p.skills.some((s) => s.slug === skill)) &&
        (!q || p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q))
    );
  }, [projects, query, skill]);

  return (
    <PortfolioLayout>
      <section className="pt-32 pb-24 px-4">
        <div className="container max-w-6xl">
          <Link
            to={`${base || "/"}#projects`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft size={16} /> Back to portfolio
          </Link>

          <h1 className="mt-6 text-4xl font-bold">
            Project <span className="text-primary">Archive</span>
          </h1>
          <p className="mt-3 text-muted-foreground">Everything I have built, filterable by skill.</p>

          <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-center">
            <label className="relative md:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search projects"
                className="w-full rounded-full border border-input bg-background py-2 pl-9 pr-4 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              {[["all", "All"], ...skills].map(([slug, name]) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => setSkill(slug)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
                    skill === slug
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary/50 hover:text-primary"
                  )}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-12">
            {loading ? (
              <p className="text-muted-foreground">Loading projects...</p>
            ) : visible.length ? (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {visible.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No projects match.</p>
            )}
          </div>
        </div>
      </section>
    </PortfolioLayout>
  );
};
