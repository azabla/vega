import { ArrowUpRight, Award, Briefcase, Wrench } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { PortfolioLayout } from "@/components/PortfolioLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { PageHeader } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/skeleton";
import { useSkills } from "@/hooks/usePortfolio";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { pluralize } from "@/lib/format";
import { proofCount } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

const MAX_PROJECTS = 3;

// Proof, not ratings: the projects, roles and certificates behind a skill
const SkillCard = ({ skill }) => {
  const base = usePortfolioPath();
  const { projects, experience, certificates } = skill.evidence;
  const proof = proofCount(skill);

  return (
    <article
      id={skill.slug}
      className={cn(
        "surface flex min-w-0 scroll-mt-28 flex-col p-5 transition target:border-primary-ink target:shadow-[0_0_0_4px_color-mix(in_oklab,var(--primary)_15%,transparent)]",
        !proof && "bg-transparent"
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-heading truncate text-2xl">{skill.name}</h3>
        {skill.years_of_experience && (
          <span className="shrink-0 font-mono text-xs text-muted-foreground">{pluralize(skill.years_of_experience, "yr")}</span>
        )}
      </div>

      {projects.length > 0 && (
        <ul className="mt-4 space-y-1">
          {projects.slice(0, MAX_PROJECTS).map((p) => (
            <li key={p.slug}>
              <Link to={`${base}/projects/${p.slug}`} className="group -mx-2 flex items-center gap-2 rounded-lg px-2 py-1 text-sm transition hover:bg-secondary">
                <span className="min-w-0 flex-1 truncate">{p.title}</span>
                <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground group-hover:text-primary-ink" aria-hidden />
              </Link>
            </li>
          ))}
          {projects.length > MAX_PROJECTS && (
            <li className="px-0 pt-1 text-xs text-muted-foreground">+ {pluralize(projects.length - MAX_PROJECTS, "more project")}</li>
          )}
        </ul>
      )}

      <p className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-4 text-xs text-muted-foreground">
        {projects.length > 0 && <span>{pluralize(projects.length, "project")}</span>}
        {experience.length > 0 && (
          <span className="inline-flex items-center gap-1" title={experience.map((e) => `${e.position}, ${e.company}`).join("\n")}>
            <Briefcase className="size-3" aria-hidden /> {pluralize(experience.length, "role")}
          </span>
        )}
        {certificates.length > 0 && (
          <span className="inline-flex items-center gap-1" title={certificates.map((c) => c.name).join("\n")}>
            <Award className="size-3" aria-hidden /> {pluralize(certificates.length, "certificate")}
          </span>
        )}
        {!proof && <span>No linked work yet</span>}
      </p>
    </article>
  );
};

export const Skills = () => {
  const { data: skills, loading } = useSkills();

  const groups = useMemo(() => {
    const byCategory = new Map();
    (skills ?? []).forEach((skill) => {
      const name = skill.category?.name ?? "Other";
      if (!byCategory.has(name)) byCategory.set(name, { slug: skill.category?.slug ?? "other", items: [] });
      byCategory.get(name).items.push(skill);
    });
    return [...byCategory];
  }, [skills]);

  const proven = (skills ?? []).filter((s) => proofCount(s) > 0).length;

  return (
    <PortfolioLayout title="Skills" meta={{ description: "Skills, each linked to the projects and roles that prove it." }}>
      <PageHeader
        eyebrow="Skills"
        title="Skills, with receipts"
        description={
          skills?.length
            ? `${skills.length} skills, ${proven} of them linked to real projects, roles or certificates. No progress bars, just evidence.`
            : "Every skill links to the projects and roles where it was used."
        }
      >
        {groups.length > 1 && (
          <nav aria-label="Categories" className="scrollbar-none -mx-4 mt-10 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {groups.map(([name, { slug, items }]) => (
              <a key={name} href={`#cat-${slug}`} className="shrink-0 rounded-full border bg-card px-3.5 py-1.5 text-sm text-muted-foreground transition hover:text-foreground">
                {name} <span className="font-mono text-[0.7rem] opacity-60">{items.length}</span>
              </a>
            ))}
          </nav>
        )}
      </PageHeader>

      <div className="container space-y-16 pb-16 md:space-y-20 md:pb-24">
        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : !skills.length ? (
          <EmptyState icon={Wrench} title="No skills listed yet" description="Skills appear here with the projects that prove them." />
        ) : (
          groups.map(([name, { slug, items }]) => (
            <section key={name} id={`cat-${slug}`} aria-labelledby={`cat-${slug}-title`} className="scroll-mt-28">
              <Reveal className="mb-6 flex items-baseline justify-between gap-4 border-b pb-4">
                <h2 id={`cat-${slug}-title`} className="font-heading text-h2">
                  {name}
                </h2>
                <span className="font-mono text-xs text-muted-foreground">{pluralize(items.length, "skill")}</span>
              </Reveal>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[...items]
                  .sort((a, b) => proofCount(b) - proofCount(a))
                  .map((skill) => (
                    <SkillCard key={skill.id} skill={skill} />
                  ))}
              </div>
            </section>
          ))
        )}
      </div>
    </PortfolioLayout>
  );
};
