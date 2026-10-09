import { Award, Briefcase, ExternalLink, Languages } from "lucide-react";
import { useMemo, useState } from "react";
import { PortfolioLayout } from "@/components/PortfolioLayout";
import { TimelineItem } from "@/components/Timeline";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/skeleton";
import { useCertificates, useEducation, useExperience, useLanguages } from "@/hooks/usePortfolio";
import { formatMonthYear } from "@/lib/format";
import { timelineFromEducation, timelineFromExperience, yearsOfExperience } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

const FILTERS = [
  { id: "all", label: "Everything" },
  { id: "work", label: "Work" },
  { id: "education", label: "Education" },
  { id: "volunteering", label: "Volunteering" },
];

// current first, then most recent end (or start) date
const recency = (item) => (item.current ? Infinity : new Date(item.end || item.start || 0).getTime());

const Aside = ({ icon, title, children }) => {
  const Icon = icon;
  return (
    <section className="surface p-5 md:p-6">
      <h2 className="eyebrow mb-4 flex items-center gap-2 text-muted-foreground">
        <Icon className="size-3.5" aria-hidden /> {title}
      </h2>
      {children}
    </section>
  );
};

export const Experience = () => {
  const { data: experience, loading: l1 } = useExperience();
  const { data: education, loading: l2 } = useEducation();
  const { data: certificates } = useCertificates();
  const { data: languages } = useLanguages();
  const [filter, setFilter] = useState("all");
  const loading = l1 || l2;

  const items = useMemo(
    () =>
      [...(experience ?? []).map(timelineFromExperience), ...(education ?? []).map(timelineFromEducation)].sort(
        (a, b) => recency(b) - recency(a) || new Date(b.start || 0) - new Date(a.start || 0)
      ),
    [experience, education]
  );
  const counts = Object.fromEntries(FILTERS.map((f) => [f.id, f.id === "all" ? items.length : items.filter((i) => i.kind === f.id).length]));
  const visible = filter === "all" ? items : items.filter((i) => i.kind === filter);
  const years = yearsOfExperience(experience ?? []);

  return (
    <PortfolioLayout title="Experience" meta={{ description: "Work history, education and volunteering." }}>
      <PageHeader
        eyebrow="Experience"
        title="The road so far"
        description={years ? `${years}+ years of building, learning and teaching, newest first.` : "Work, education and volunteering, newest first."}
      />

      <div className="container grid gap-12 pb-16 md:pb-24 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
        <div className="min-w-0">
          {items.length > 0 && (
            <div className="scrollbar-none -mx-4 mb-10 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="Filter timeline">
              {FILTERS.filter((f) => counts[f.id] > 0).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition",
                    filter === f.id ? "border-foreground bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label} <span className="font-mono text-[0.7rem] opacity-60">{counts[f.id]}</span>
                </button>
              ))}
            </div>
          )}

          <h2 id="timeline-title" className="sr-only">Timeline</h2>
          {loading ? (
            <div className="space-y-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-5">
                  <Skeleton className="size-12 rounded-xl" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-7 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState icon={Briefcase} title="Nothing here yet" description="Jobs, studies and volunteering will show up on this timeline." />
          ) : (
            <ol key={filter} aria-labelledby="timeline-title">
              {visible.map((item, i) => (
                <TimelineItem key={item.key} item={item} index={i} last={i === visible.length - 1} headingLevel={3} />
              ))}
            </ol>
          )}
        </div>

        {(certificates?.length > 0 || languages?.length > 0) && (
          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            {certificates?.length > 0 && (
              <Aside icon={Award} title="Certificates">
                <ul className="space-y-4">
                  {certificates.map((c) => {
                    const link = c.credential_url || c.file;
                    return (
                      <li key={c.id} className="min-w-0">
                        <p className="text-sm font-medium">
                          {link ? (
                            <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 hover:text-primary-ink">
                              {c.name} <ExternalLink className="mt-1 size-3 shrink-0" aria-label="(opens credential)" />
                            </a>
                          ) : (
                            c.name
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.issuer}
                          {c.issue_date && ` · ${formatMonthYear(c.issue_date)}`}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </Aside>
            )}
            {languages?.length > 0 && (
              <Aside icon={Languages} title="Languages">
                <ul className="divide-y">
                  {languages.map((l) => (
                    <li key={l.id} className="flex items-baseline justify-between gap-3 py-2 first:pt-0 last:pb-0">
                      <span className="text-sm font-medium">{l.name}</span>
                      <span className="text-right text-xs text-muted-foreground">{l.proficiency_display}</span>
                    </li>
                  ))}
                </ul>
              </Aside>
            )}
          </aside>
        )}
      </div>
    </PortfolioLayout>
  );
};
