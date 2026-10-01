import { Award, ExternalLink, GraduationCap } from "lucide-react";
import { portfolioAPI } from "@/services/portfolioAPI";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { formatDateRange, formatMonthYear } from "@/lib/format";

export const EducationSection = () => {
  const { data: education } = usePortfolioData(portfolioAPI.getEducation);
  const { data: certificates } = usePortfolioData(portfolioAPI.getCertificates);

  if (!education?.length && !certificates?.length) return null;

  return (
    <section id="education" className="py-24 px-4 relative bg-secondary/30">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">
          Education & <span className="text-primary">Certifications</span>
        </h2>

        <div className="grid gap-12 md:grid-cols-2">
          {education?.length > 0 && (
            <div className="space-y-6">
              <h3 className="flex items-center gap-2 text-xl font-semibold">
                <GraduationCap className="h-5 w-5 text-primary" /> Education
              </h3>
              {education.map((item) => (
                <div key={item.id} className="gradient-border p-6 card-hover text-left">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">
                    {item.level_display}
                  </p>
                  <h4 className="mt-1 text-lg font-semibold">
                    {item.field_of_study || item.level_display}
                  </h4>
                  <p className="text-primary font-medium">{item.institution}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                    <span>{formatDateRange(item.start_date, item.end_date, item.current)}</span>
                    {item.grade && <span>{item.grade}</span>}
                  </div>
                  {item.description && (
                    <p className="mt-3 text-sm text-muted-foreground leading-6 whitespace-pre-line">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {certificates?.length > 0 && (
            <div className="space-y-6">
              <h3 className="flex items-center gap-2 text-xl font-semibold">
                <Award className="h-5 w-5 text-primary" /> Certifications
              </h3>
              {certificates.map((cert) => {
                const link = cert.credential_url || cert.file;
                return (
                  <div key={cert.id} className="gradient-border p-6 card-hover text-left">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-semibold">{cert.name}</h4>
                        <p className="text-primary font-medium">{cert.issuer}</p>
                      </div>
                      {link && (
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`View ${cert.name} credential`}
                          className="text-muted-foreground hover:text-primary transition-colors"
                        >
                          <ExternalLink size={18} />
                        </a>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {cert.issue_date && `Issued ${formatMonthYear(cert.issue_date)}`}
                      {cert.credential_id && ` · ID ${cert.credential_id}`}
                    </p>
                    {cert.skills.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {cert.skills.map((skill) => (
                          <span
                            key={skill.id}
                            className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium"
                          >
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
