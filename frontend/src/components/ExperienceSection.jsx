import { Briefcase, MapPin } from "lucide-react";
import { portfolioAPI } from "@/services/portfolioAPI";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { formatDateRange } from "@/lib/format";

export const ExperienceSection = () => {
  const { data: experience, loading } = usePortfolioData(portfolioAPI.getExperience);

  if (loading || !experience?.length) return null;

  return (
    <section id="experience" className="py-24 px-4 relative">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
          Work <span className="text-primary">Experience</span>
        </h2>
        <p className="text-center text-muted-foreground mb-16">
          Where I have worked and what I was responsible for.
        </p>

        <ol className="relative border-l border-border ml-3 space-y-10">
          {experience.map((job) => (
            <li key={job.id} className="pl-8 relative">
              <span className="absolute -left-[13px] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 ring-4 ring-background">
                {job.company_logo ? (
                  <img src={job.company_logo} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <Briefcase className="h-3 w-3 text-primary" />
                )}
              </span>

              <div className="gradient-border p-6 card-hover text-left">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold">{job.position}</h3>
                    <p className="text-primary font-medium">{job.company}</p>
                  </div>
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDateRange(job.start_date, job.end_date, job.current)}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{job.employment_type_display}</span>
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {job.location}
                    </span>
                  )}
                </div>

                {job.description && (
                  <p className="mt-4 text-sm text-muted-foreground leading-6 whitespace-pre-line">
                    {job.description}
                  </p>
                )}

                {job.skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
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
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
