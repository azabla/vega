import { MapPin } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHeader } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/skeleton";
import { Tag } from "@/components/ui/Tag";
import { portfolioAPI } from "@/services/portfolioAPI";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { formatDateRange } from "@/lib/format";

export const ExperienceSection = () => {
  const { data: experience, loading } = usePortfolioData(portfolioAPI.getExperience);

  if (!loading && !experience?.length) return null;

  return (
    <Section id="experience">
      <SectionHeader eyebrow="Experience" title="Where I've worked" />

      <ol className="relative space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-px before:bg-border md:before:left-[calc(12rem+7px)]">
        {loading
          ? Array.from({ length: 2 }).map((_, i) => (
              <li key={i} className="pl-8 md:pl-[calc(12rem+2rem)]">
                <Skeleton className="h-36 rounded-2xl" />
              </li>
            ))
          : experience.map((job, i) => (
              <Reveal as="li" key={job.id} delay={i * 80} className="relative pl-8 md:grid md:grid-cols-[12rem_1fr] md:gap-8 md:pl-0">
                <span className="absolute top-2 left-0 size-[15px] rounded-full border-4 border-background bg-primary md:left-[12rem]" />
                <p className="mb-2 pt-1 text-sm text-muted-foreground md:mb-0 md:pr-6 md:text-right">
                  {formatDateRange(job.start_date, job.end_date, job.current)}
                </p>
                <div className="surface p-6 md:ml-8">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {job.company_logo && (
                        <img src={job.company_logo} alt="" className="size-10 rounded-lg border object-cover" />
                      )}
                      <div>
                        <h3 className="font-semibold">{job.position}</h3>
                        <p className="text-sm text-primary">{job.company}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <Tag>{job.employment_type_display}</Tag>
                      {job.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" />
                          {job.location}
                        </span>
                      )}
                    </div>
                  </div>
                  {job.description && (
                    <p className="mt-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">{job.description}</p>
                  )}
                  {job.skills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {job.skills.map((s) => (
                        <Tag key={s.id}>{s.name}</Tag>
                      ))}
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
      </ol>
    </Section>
  );
};
