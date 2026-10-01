import { Award, ExternalLink, GraduationCap, Languages } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Tag } from "@/components/ui/Tag";
import { portfolioAPI } from "@/services/portfolioAPI";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { formatMonthYear, formatYearRange } from "@/lib/format";

const Column = ({ icon, title, children }) => {
  const Icon = icon;
  return (
    <div>
      <h3 className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Icon className="size-4 text-primary" /> {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </div>
  );
};

export const EducationSection = () => {
  const { data: education } = usePortfolioData(portfolioAPI.getEducation);
  const { data: certificates } = usePortfolioData(portfolioAPI.getCertificates);
  const { data: languages } = usePortfolioData(portfolioAPI.getLanguages);

  if (!education?.length && !certificates?.length && !languages?.length) return null;

  return (
    <Section id="education" className="bg-secondary/30">
      <SectionHeader
        eyebrow="Education"
        title={certificates?.length ? "Education & certifications" : "Education & languages"}
      />

      <div className="grid gap-10 md:grid-cols-2">
        {education?.length > 0 && (
          <Column icon={GraduationCap} title="Education">
            {education.map((item, i) => (
              <Reveal key={item.id} delay={i * 60} className="surface p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-primary">{item.level_display}</p>
                <h4 className="mt-2 font-semibold">{item.field_of_study || item.level_display}</h4>
                <p className="text-sm">{item.institution}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatYearRange(item.start_date, item.end_date, item.current)}
                  {item.grade && ` · ${item.grade}`}
                </p>
                {item.description && (
                  <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{item.description}</p>
                )}
              </Reveal>
            ))}
          </Column>
        )}

        <div className="space-y-10">
        {certificates?.length > 0 && (
          <Column icon={Award} title="Certifications">
            {certificates.map((cert, i) => {
              const link = cert.credential_url || cert.file;
              return (
                <Reveal key={cert.id} delay={i * 60} className="surface p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-semibold">{cert.name}</h4>
                      <p className="text-sm">{cert.issuer}</p>
                    </div>
                    {link && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`View ${cert.name} credential`}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {cert.issue_date && `Issued ${formatMonthYear(cert.issue_date)}`}
                    {cert.credential_id && ` · ID ${cert.credential_id}`}
                  </p>
                  {cert.skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {cert.skills.map((s) => (
                        <Tag key={s.id}>{s.name}</Tag>
                      ))}
                    </div>
                  )}
                </Reveal>
              );
            })}
          </Column>
        )}

        {languages?.length > 0 && (
          <Column icon={Languages} title="Languages">
            <Reveal className="surface divide-y">
              {languages.map((lang) => (
                <div key={lang.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <span className="font-medium">{lang.name}</span>
                  <span className="text-sm text-muted-foreground">{lang.proficiency_display}</span>
                </div>
              ))}
            </Reveal>
          </Column>
        )}
        </div>
      </div>
    </Section>
  );
};
