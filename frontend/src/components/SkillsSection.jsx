import { ArrowUpRight, Award, Briefcase, FolderGit2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/skeleton";
import { portfolioAPI } from "@/services/portfolioAPI";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";

const proofCount = (skill) =>
  skill.evidence.projects.length + skill.evidence.experience.length + skill.evidence.certificates.length;

// Proof instead of star ratings: every skill links to where it was used
const EvidencePanel = ({ skill }) => {
  const base = usePortfolioPath();
  const { projects, experience, certificates } = skill.evidence;

  return (
    <div className="surface animate-fade-up p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold">
          Where I've used <span className="text-primary">{skill.name}</span>
        </h3>
        <p className="text-sm text-muted-foreground">
          {[
            projects.length && pluralize(projects.length, "project"),
            experience.length && pluralize(experience.length, "role"),
            certificates.length && pluralize(certificates.length, "certificate"),
            skill.years_of_experience && `${skill.years_of_experience}+ years`,
          ]
            .filter(Boolean)
            .join(" · ") || "No evidence linked yet"}
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <Link
            key={p.slug}
            to={`${base}/projects/${p.slug}`}
            className="group flex items-center gap-3 rounded-xl border bg-background/50 p-3 text-sm transition hover:border-primary/40"
          >
            <FolderGit2 className="size-4 shrink-0 text-primary" />
            <span className="flex-1 truncate font-medium">{p.title}</span>
            <ArrowUpRight className="size-4 text-muted-foreground transition group-hover:text-primary" />
          </Link>
        ))}
        {experience.map((e) => (
          <div key={`${e.position}-${e.company}`} className="flex items-center gap-3 rounded-xl border bg-background/50 p-3 text-sm">
            <Briefcase className="size-4 shrink-0 text-primary" />
            <span className="truncate">
              <span className="font-medium">{e.position}</span> · {e.company}
            </span>
          </div>
        ))}
        {certificates.map((c) => (
          <div key={`${c.name}-${c.issuer}`} className="flex items-center gap-3 rounded-xl border bg-background/50 p-3 text-sm">
            <Award className="size-4 shrink-0 text-primary" />
            <span className="truncate">
              <span className="font-medium">{c.name}</span> · {c.issuer}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkillsSection = () => {
  const { data: skills, loading } = usePortfolioData(portfolioAPI.getSkills);
  const [selectedId, setSelectedId] = useState(null);

  const groups = useMemo(() => {
    const byCategory = new Map();
    (skills ?? []).forEach((skill) => {
      const name = skill.category?.name ?? "Other";
      if (!byCategory.has(name)) byCategory.set(name, []);
      byCategory.get(name).push(skill);
    });
    return [...byCategory];
  }, [skills]);

  if (!loading && !skills?.length) return null;

  const strongest = [...(skills ?? [])].sort((a, b) => proofCount(b) - proofCount(a))[0];
  const selected = skills?.find((s) => s.id === selectedId) ?? strongest;

  return (
    <Section id="skills" className="bg-secondary/30">
      <SectionHeader
        eyebrow="Skills"
        title="Skills, backed by evidence"
        description="No star ratings. Pick a skill to see the projects, roles and certificates where I've actually used it."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="surface space-y-4 p-6">
                <Skeleton className="h-4 w-24" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 5 }).map((__, j) => (
                    <Skeleton key={j} className="h-7 w-20 rounded-full" />
                  ))}
                </div>
              </div>
            ))
          : groups.map(([category, items], i) => (
              <Reveal key={category} delay={i * 60} className="surface p-6">
                <h3 className="font-mono text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
                  {category}
                </h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {items.map((skill) => {
                    const count = proofCount(skill);
                    const isSelected = selected?.id === skill.id;
                    return (
                      <button
                        key={skill.id}
                        type="button"
                        onClick={() => setSelectedId(skill.id)}
                        aria-pressed={isSelected}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "bg-background hover:border-primary/50 hover:text-primary"
                        )}
                      >
                        {skill.name}
                        {count > 0 && (
                          <span
                            className={cn(
                              "rounded-full px-1.5 text-[11px] tabular-nums",
                              isSelected ? "bg-primary-foreground/20" : "bg-secondary text-muted-foreground"
                            )}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </Reveal>
            ))}
      </div>

      {selected && (
        <div className="mt-6" key={selected.id}>
          <EvidencePanel skill={selected} />
        </div>
      )}
    </Section>
  );
};
