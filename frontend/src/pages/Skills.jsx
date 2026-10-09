import { ArrowUpRight, Award, Briefcase, ChevronDown, FolderGit2, Wrench } from "lucide-react";
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { PortfolioLayout } from "@/components/PortfolioLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import { Reveal } from "@/components/ui/Reveal";
import { PageHeader } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/skeleton";
import { useSkills } from "@/hooks/usePortfolio";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { pluralize } from "@/lib/format";
import { evidenceSummary, proofCount } from "@/lib/portfolio";

// Proof, not ratings: a compact row that opens to the projects, roles and
// certificates behind the skill. #<slug> in the URL opens and highlights it.
const SkillRow = ({ skill }) => {
  const base = usePortfolioPath();
  const { hash } = useLocation();
  const { projects, experience, certificates } = skill.evidence;
  const proof = proofCount(skill);
  const summary = evidenceSummary(skill) || "No linked work yet";

  if (!proof) {
    return (
      <li id={skill.slug} className="flex min-h-14 items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <span className="min-w-0 truncate font-medium">{skill.name}</span>
        <span className="shrink-0 font-mono text-[0.7rem] text-muted-foreground">{summary}</span>
      </li>
    );
  }

  return (
    <li id={skill.slug} className="scroll-mt-28">
      <details open={hash === `#${skill.slug}` || undefined} className="group/skill target:bg-accent">
        <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3 transition hover:bg-secondary/60 sm:px-5 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 flex-1 truncate font-medium">{skill.name}</span>
          <span className="shrink-0 font-mono text-[0.7rem] text-muted-foreground">{summary}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open/skill:rotate-180" aria-hidden />
        </summary>
        <div className="space-y-3 px-4 pb-4 sm:px-5">
          {projects.length > 0 && (
            <ul className="space-y-0.5">
              {projects.map((p) => (
                <li key={p.slug}>
                  <Link to={`${base}/projects/${p.slug}`} className="group -mx-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-secondary">
                    <FolderGit2 className="size-3.5 shrink-0 text-primary-ink" aria-hidden />
                    <span className="min-w-0 flex-1 truncate">{p.title}</span>
                    <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground group-hover:text-primary-ink" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {experience.length > 0 && (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {experience.map((e) => (
                <li key={`${e.position}-${e.company}`} className="flex min-w-0 items-center gap-2">
                  <Briefcase className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">
                    {e.position} · {e.company}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {certificates.length > 0 && (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {certificates.map((c) => (
                <li key={`${c.name}-${c.issuer}`} className="flex min-w-0 items-center gap-2">
                  <Award className="size-3.5 shrink-0" aria-hidden />
                  <span className="truncate">
                    {c.name} · {c.issuer}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </details>
    </li>
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

      <div className="container grid items-start gap-12 pb-16 md:pb-24 lg:grid-cols-2 lg:gap-x-10 lg:gap-y-16">
        {loading ? (
          <div className="space-y-2" role="status" aria-label="Loading">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-2xl" />
            ))}
          </div>
        ) : !skills.length ? (
          <EmptyState icon={Wrench} title="No skills listed yet" description="Skills appear here with the projects that prove them." />
        ) : (
          groups.map(([name, { slug, items }]) => (
            <section key={name} id={`cat-${slug}`} aria-labelledby={`cat-${slug}-title`} className="scroll-mt-28">
              <Reveal className="mb-4 flex items-baseline justify-between gap-4">
                <h2 id={`cat-${slug}-title`} className="font-heading text-3xl">
                  {name}
                </h2>
                <span className="font-mono text-xs text-muted-foreground">{pluralize(items.length, "skill")}</span>
              </Reveal>
              <ul className="surface divide-y overflow-hidden">
                {[...items]
                  .sort((a, b) => proofCount(b) - proofCount(a))
                  .map((skill) => (
                    <SkillRow key={skill.id} skill={skill} />
                  ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </PortfolioLayout>
  );
};
