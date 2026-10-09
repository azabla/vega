import { FolderGit2, LayoutGrid, List, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { PortfolioLayout } from "@/components/PortfolioLayout";
import { ProjectCard, ProjectCardSkeleton, ProjectRow } from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/Section";
import { useAppearance } from "@/hooks/useAppearance";
import { useProjects } from "@/hooks/usePortfolio";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

const TOP_SKILLS = 8;

const Chip = ({ active, onClick, children }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={cn(
      "shrink-0 rounded-full border px-3.5 py-1.5 text-sm whitespace-nowrap transition",
      active ? "border-foreground bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground"
    )}
  >
    {children}
  </button>
);

export const ProjectArchive = () => {
  const { data: projects, loading } = useProjects();
  const { settings } = useAppearance();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(null);
  const [skill, setSkill] = useState(null);
  const [allSkills, setAllSkills] = useState(false);
  const [view, setView] = useState(null); // null = the owner's choice
  const layout = view ?? (settings.projects_layout === "list" ? "list" : "grid");

  const categories = useMemo(() => [...new Set((projects ?? []).map((p) => p.category).filter(Boolean))], [projects]);

  // skills by how many projects use them
  const skills = useMemo(() => {
    const counts = new Map();
    (projects ?? []).forEach((p) => p.skills.forEach((s) => counts.set(s.slug, { name: s.name, n: (counts.get(s.slug)?.n ?? 0) + 1 })));
    return [...counts].sort((a, b) => b[1].n - a[1].n);
  }, [projects]);

  const visible = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return (projects ?? []).filter((p) => {
      const text = `${p.title} ${p.summary} ${p.category} ${p.skills.map((s) => s.name).join(" ")}`.toLowerCase();
      return (
        (!category || p.category === category) &&
        (!skill || p.skills.some((s) => s.slug === skill)) &&
        words.every((w) => text.includes(w))
      );
    });
  }, [projects, query, category, skill]);

  const filtered = Boolean(query || category || skill);
  const clear = () => {
    setQuery("");
    setCategory(null);
    setSkill(null);
  };
  const shownSkills = allSkills ? skills : skills.slice(0, TOP_SKILLS);

  return (
    <PortfolioLayout title="Projects" meta={{ description: "Case studies: the problem, the approach and what changed." }}>
      <PageHeader
        eyebrow="Work"
        title="Projects"
        description={
          projects?.length
            ? `${pluralize(projects.length, "project")}, from production platforms to early experiments. Open one for the full case study.`
            : "Case studies: the problem, the approach and what changed."
        }
      />

      <div className="container pb-16 md:pb-24">
        {!loading && projects.length > 0 && (
          <div className="mb-8 space-y-4 border-b pb-6">
            <div className="flex items-center gap-2">
              <label className="relative min-w-0 flex-1 sm:max-w-sm">
                <span className="sr-only">Search projects</span>
                <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name or skill"
                  className="h-11 w-full rounded-full border border-input bg-card pr-4 pl-10 text-base outline-none focus-visible:border-primary-ink md:text-sm"
                />
              </label>
              <div className="ml-auto flex shrink-0 rounded-full border bg-card p-1" role="group" aria-label="Layout">
                {[
                  { id: "grid", icon: LayoutGrid, label: "Grid" },
                  { id: "list", icon: List, label: "List" },
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    aria-pressed={layout === v.id}
                    aria-label={v.label}
                    onClick={() => setView(v.id)}
                    className={cn(
                      "inline-flex size-9 items-center justify-center rounded-full transition",
                      layout === v.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <v.icon className="size-4" />
                  </button>
                ))}
              </div>
            </div>

            {categories.length > 1 && (
              <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Type">
                <Chip active={!category} onClick={() => setCategory(null)}>
                  All types
                </Chip>
                {categories.map((c) => (
                  <Chip key={c} active={category === c} onClick={() => setCategory(category === c ? null : c)}>
                    {c}
                  </Chip>
                ))}
              </div>
            )}

            {skills.length > 1 && (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Skill">
                {shownSkills.map(([slug, { name, n }]) => (
                  <button
                    key={slug}
                    type="button"
                    aria-pressed={skill === slug}
                    onClick={() => setSkill(skill === slug ? null : slug)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 font-mono text-[0.72rem] transition",
                      skill === slug ? "border-primary-ink bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {name} <span className="opacity-60">{n}</span>
                  </button>
                ))}
                {skills.length > TOP_SKILLS && (
                  <button type="button" onClick={() => setAllSkills((v) => !v)} className="px-2 py-1 font-mono text-[0.72rem] text-primary-ink">
                    {allSkills ? "Fewer" : `+${skills.length - TOP_SKILLS} more`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : !projects.length ? (
          <EmptyState icon={FolderGit2} title="No projects yet" description="Projects will appear here as case studies." />
        ) : !visible.length ? (
          <EmptyState
            icon={Search}
            title="Nothing matches"
            description="Try another word, or clear the filters."
            action={
              <Button variant="secondary" onClick={clear}>
                <X /> Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <h2 className="sr-only">Project list</h2>
            <p className="mb-5 font-mono text-xs text-muted-foreground" aria-live="polite">
              {filtered ? `${visible.length} of ${pluralize(projects.length, "project")}` : pluralize(projects.length, "project")}
              {filtered && (
                <button type="button" onClick={clear} className="ml-3 text-primary-ink link-underline">
                  Clear
                </button>
              )}
            </p>
            {layout === "list" ? (
              <div className="border-t">
                {visible.map((p) => (
                  <ProjectRow key={p.id} project={p} />
                ))}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </PortfolioLayout>
  );
};
