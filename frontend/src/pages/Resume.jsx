import { Download, FileText, Printer } from "lucide-react";
import { PortfolioLayout } from "@/components/PortfolioLayout";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { useAbout, useCertificates, useEducation, useExperience, useLanguages, useProjects, useSkills } from "@/hooks/usePortfolio";
import { useProfile } from "@/hooks/useProfile";
import { bulletsOf, formatMonthYear, formatYearRange } from "@/lib/format";
import { featuredProjects } from "@/lib/portfolio";
import { resumeFileOf, socialLinksOf } from "@/lib/profile";

const bare = (url) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");

const Block = ({ title, children }) => (
  <section className="break-inside-avoid-page border-t pt-6 print:pt-3">
    <h2 className="eyebrow mb-4 text-primary-ink print:mb-2 print:text-[8pt] print:text-black">{title}</h2>
    <div className="space-y-5 print:space-y-3">{children}</div>
  </section>
);

const Entry = ({ title, org, when, children }) => (
  <article className="break-inside-avoid">
    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
      <h3 className="font-medium">
        {title}
        {org && <span className="font-normal text-muted-foreground print:text-black"> · {org}</span>}
      </h3>
      {when && <p className="font-mono text-xs text-muted-foreground print:text-[8pt]">{when}</p>}
    </div>
    {children}
  </article>
);

const Description = ({ text }) => {
  if (!text) return null;
  const bullets = bulletsOf(text);
  return bullets ? (
    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm leading-6 text-muted-foreground marker:text-border print:text-[9pt] print:leading-snug print:text-black">
      {bullets.map((b, i) => (
        <li key={i}>{b}</li>
      ))}
    </ul>
  ) : (
    <p className="mt-1.5 text-sm leading-6 whitespace-pre-line text-muted-foreground print:text-[9pt] print:leading-snug print:text-black">{text}</p>
  );
};

/** The résumé document: the same data as the site, laid out for reading and printing. */
const ResumeDocument = ({ profile, about, experience, education, projects, skills, certificates, languages }) => {
  const contact = [
    profile.email && { label: profile.email, href: `mailto:${profile.email}` },
    profile.phone && { label: profile.phone, href: `tel:${profile.phone.replace(/\s/g, "")}` },
    profile.location && { label: profile.location },
    ...socialLinksOf(profile).map((s) => ({ label: bare(s.href), href: s.href })),
  ].filter(Boolean);

  const skillsByCategory = skills.reduce((groups, s) => {
    const name = s.category?.name ?? "Other";
    (groups[name] ??= []).push(s.name);
    return groups;
  }, {});
  const work = experience.filter((j) => j.employment_type !== "volunteer");
  const volunteering = experience.filter((j) => j.employment_type === "volunteer");

  return (
    <article className="surface mx-auto max-w-[52rem] space-y-6 p-6 sm:p-10 md:p-14 print:max-w-none print:space-y-3 print:rounded-none print:border-0 print:bg-white print:p-0 print:text-[10pt] print:text-black">
      <header>
        <h1 className="font-heading text-h1 print:text-[24pt]">{profile.name}</h1>
        {profile.title && <p className="mt-1 text-lg text-primary-ink print:text-[12pt] print:text-black">{profile.title}</p>}
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground print:mt-2 print:text-[8.5pt] print:text-black">
          {contact.map((c) => (
            <li key={c.label}>{c.href ? <a href={c.href} className="hover:text-foreground">{c.label}</a> : c.label}</li>
          ))}
        </ul>
      </header>

      {(about?.description || profile.bio) && (
        <Block title="Summary">
          <p className="leading-7 print:text-[9.5pt] print:leading-snug">{about?.description || profile.bio}</p>
        </Block>
      )}

      {work.length > 0 && (
        <Block title="Experience">
          {work.map((j) => (
            <Entry key={j.id} title={j.position} org={[j.company, j.location].filter(Boolean).join(", ")} when={formatYearRange(j.start_date, j.end_date, j.current)}>
              <Description text={j.description} />
            </Entry>
          ))}
        </Block>
      )}

      {projects.length > 0 && (
        <Block title="Selected projects">
          {featuredProjects(projects, 4).map((p) => (
            <Entry key={p.id} title={p.title} org={p.role} when={formatYearRange(p.started_on, p.ended_on, false)}>
              <p className="mt-1 text-sm leading-6 text-muted-foreground print:text-[9pt] print:leading-snug print:text-black">{p.summary}</p>
              {p.skills.length > 0 && (
                <p className="mt-1 font-mono text-xs text-muted-foreground print:text-[8pt]">{p.skills.map((s) => s.name).join(" · ")}</p>
              )}
            </Entry>
          ))}
        </Block>
      )}

      {Object.keys(skillsByCategory).length > 0 && (
        <Block title="Skills">
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[11rem_1fr] print:grid-cols-[9rem_1fr] print:gap-y-1 print:text-[9pt]">
            {Object.entries(skillsByCategory).map(([name, list]) => (
              <div key={name} className="contents">
                <dt className="font-medium">{name}</dt>
                <dd className="text-muted-foreground print:text-black">{list.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </Block>
      )}

      {education.length > 0 && (
        <Block title="Education">
          {education.map((e) => (
            <Entry key={e.id} title={e.field_of_study ? `${e.level_display}, ${e.field_of_study}` : e.level_display} org={e.institution} when={formatYearRange(e.start_date, e.end_date, e.current)}>
              <Description text={[e.grade, e.description].filter(Boolean).join(" · ")} />
            </Entry>
          ))}
        </Block>
      )}

      {volunteering.length > 0 && (
        <Block title="Volunteering">
          {volunteering.map((j) => (
            <Entry key={j.id} title={j.position} org={j.company} when={formatYearRange(j.start_date, j.end_date, j.current)}>
              <Description text={j.description} />
            </Entry>
          ))}
        </Block>
      )}

      {(certificates.length > 0 || languages.length > 0) && (
        <div className="grid gap-6 sm:grid-cols-2 print:grid-cols-2">
          {certificates.length > 0 && (
            <Block title="Certificates">
              <ul className="space-y-1 text-sm print:text-[9pt]">
                {certificates.map((c) => (
                  <li key={c.id}>
                    {c.name} <span className="text-muted-foreground print:text-black">· {c.issuer}{c.issue_date && `, ${formatMonthYear(c.issue_date)}`}</span>
                  </li>
                ))}
              </ul>
            </Block>
          )}
          {languages.length > 0 && (
            <Block title="Languages">
              <ul className="space-y-1 text-sm print:text-[9pt]">
                {languages.map((l) => (
                  <li key={l.id}>
                    {l.name} <span className="text-muted-foreground print:text-black">· {l.proficiency_display}</span>
                  </li>
                ))}
              </ul>
            </Block>
          )}
        </div>
      )}
    </article>
  );
};

export const Resume = () => {
  const { profile, loading } = useProfile();
  const { data: about } = useAbout();
  const data = {
    experience: useExperience(),
    education: useEducation(),
    projects: useProjects(),
    skills: useSkills(),
    certificates: useCertificates(),
    languages: useLanguages(),
  };
  const ready = !loading && Object.values(data).every((d) => !d.loading);
  const file = resumeFileOf(profile, about);

  return (
    <PortfolioLayout title="Résumé" meta={{ description: `Résumé of ${profile?.name ?? ""}` }}>
      <div className="container pt-28 pb-16 md:pt-36 md:pb-24 print:p-0">
        <div className="mx-auto mb-8 flex max-w-[52rem] flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print:hidden">
          <div>
            <p className="eyebrow mb-3">Résumé</p>
            <p className="text-sm text-muted-foreground">Generated from this site, so it's always up to date.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => window.print()} disabled={!ready}>
              <Printer /> Download PDF
            </Button>
            {file && (
              <Button href={file} variant="secondary">
                <Download /> Original file
              </Button>
            )}
          </div>
        </div>

        {!ready ? (
          <div className="surface mx-auto max-w-[52rem] space-y-4 p-10">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-80" />
            <Skeleton className="mt-8 h-40 w-full" />
          </div>
        ) : !profile ? (
          <EmptyState icon={FileText} title="Résumé unavailable" description="This portfolio couldn't be loaded." />
        ) : (
          <ResumeDocument
            profile={profile}
            about={about}
            {...Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.data ?? []]))}
          />
        )}

        <p className="mx-auto mt-6 max-w-[52rem] text-center text-xs text-muted-foreground print:hidden">
          “Download PDF” opens your browser's print dialog. Choose “Save as PDF” as the destination.
        </p>
      </div>
    </PortfolioLayout>
  );
};
