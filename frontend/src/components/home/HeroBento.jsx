import { ArrowRight, ArrowUpRight, Briefcase, Mail, MapPin, Moon, Sparkles, Sun } from "lucide-react";
import { Link } from "react-router-dom";
import { AvailabilityPill } from "@/components/ui/AvailabilityPill";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/CopyButton";
import { Counter } from "@/components/ui/Counter";
import { Img } from "@/components/ui/Img";
import { ProjectCover } from "@/components/ui/ProjectCover";
import { useLocalTime } from "@/hooks/useLocalTime";
import { useNavItems } from "@/hooks/useNavItems";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { formatDuration } from "@/lib/format";
import { currentRole, evidenceSummary, featuredProjects, strongestSkills, yearsOfExperience } from "@/lib/portfolio";
import { availabilityOf, socialLinksOf } from "@/lib/profile";
import { cn } from "@/lib/utils";

// One bento tile. `to` makes the whole tile a link (with a visible arrow).
const Tile = ({ label, icon: Icon, to, className, children, delay = 0 }) => (
  <div
    className={cn("group surface relative flex min-w-0 flex-col p-5 animate-fade-up md:p-6", to && "surface-hover", className)}
    style={{ animationDelay: `${delay}ms` }}
  >
    {label && (
      <p className="eyebrow mb-4 flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="size-3.5" aria-hidden />}
        {label}
      </p>
    )}
    {children}
    {to && (
      <Link to={to} className="absolute inset-0 rounded-2xl" aria-label={typeof label === "string" ? label : undefined}>
        <ArrowUpRight className="absolute top-5 right-5 size-4 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary-ink" aria-hidden />
      </Link>
    )}
  </div>
);

export const HeroBento = ({ profile, projects, experience, skills }) => {
  const base = usePortfolioPath();
  const { contact } = useNavItems();
  const role = currentRole(experience);
  const featured = featuredProjects(projects, 1)[0];
  const top = strongestSkills(skills).slice(0, 5);
  const clock = useLocalTime(profile.timezone);
  const availability = availabilityOf(profile);
  const socials = socialLinksOf(profile);
  const years = yearsOfExperience(experience);

  const stats = [
    projects.length > 0 && { value: String(projects.length), label: "projects shipped" },
    years > 0 && { value: `${years}+`, label: "years building" },
    skills.length > 0 && { value: String(skills.length), label: "skills with proof" },
  ].filter(Boolean);

  return (
    <div className="grid grid-flow-dense auto-rows-[minmax(10.5rem,auto)] grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
      {/* Intro */}
      <Tile className="justify-between md:col-span-2 lg:row-span-2 lg:p-8">
        <div>
          <AvailabilityPill profile={profile} />
          <h1 className="font-heading mt-6 text-display">{profile.name}</h1>
          {profile.title && <p className="mt-3 text-xl text-primary-ink md:text-2xl">{profile.title}</p>}
          {profile.bio && <p className="mt-5 line-clamp-4 max-w-xl leading-7 text-muted-foreground">{profile.bio}</p>}
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Button href={`${base}/projects`}>
            View my work <ArrowRight />
          </Button>
          {contact && (
            <Button href={contact.href} variant="secondary">
              Get in touch
            </Button>
          )}
          {socials.length > 0 && (
            <div className="flex items-center sm:ml-2">
              {socials.map((s) => (
                <a key={s.id} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                  <s.icon className="size-[1.1rem]" />
                </a>
              ))}
            </div>
          )}
        </div>
      </Tile>

      {/* Portrait */}
      {profile.profile_image && (
        <div className="surface overflow-hidden animate-fade-up lg:row-span-2" style={{ animationDelay: "60ms" }}>
          <Img src={profile.profile_image} alt={profile.name} className="size-full min-h-72" eager />
        </div>
      )}

      {/* Current role */}
      {role && (
        <Tile label="Now" icon={Briefcase} to={`${base}/experience`} delay={80}>
          <p className="font-heading text-2xl leading-tight">{role.position}</p>
          <p className="mt-1 truncate text-sm text-muted-foreground">at {role.company}</p>
          <p className="mt-auto pt-4 font-mono text-xs text-muted-foreground">{formatDuration(role.start_date)} so far</p>
        </Tile>
      )}

      {/* Location + local time */}
      {(profile.location || clock) && (
        <Tile label="Based in" icon={MapPin} delay={120}>
          <p className="font-heading text-2xl leading-tight">{profile.location || "—"}</p>
          {clock && (
            <div className="mt-auto flex items-end justify-between gap-3 pt-4">
              <div>
                <p className="flex items-center gap-2 text-3xl tabular-nums">
                  {clock.isDay ? <Sun className="size-5 text-warning" aria-hidden /> : <Moon className="size-5 text-primary-ink" aria-hidden />}
                  {clock.time}
                </p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {clock.offset} · {clock.relative}
                </p>
              </div>
            </div>
          )}
        </Tile>
      )}

      {/* Featured project */}
      {featured && (
        <div className="group surface surface-hover relative grid min-w-0 overflow-hidden animate-fade-up sm:grid-cols-[1fr_1.1fr] md:col-span-2" style={{ animationDelay: "160ms" }}>
          <ProjectCover project={featured} ratio={null} className="h-48 border-b sm:h-full sm:border-r sm:border-b-0" />
          <div className="flex min-w-0 flex-col p-5 md:p-6">
            <p className="eyebrow mb-4 flex items-center gap-2 text-muted-foreground">
              <Sparkles className="size-3.5" aria-hidden /> Featured project
            </p>
            <h2 className="font-heading text-2xl leading-tight">
              <Link to={`${base}/projects/${featured.slug}`} className="after:absolute after:inset-0">
                {featured.title}
              </Link>
            </h2>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{featured.summary}</p>
            <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-primary-ink">
              Case study <ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      )}

      {/* Currently learning */}
      {profile.currently_learning && (
        <Tile label="Currently learning" icon={Sparkles} delay={200}>
          <p className="font-heading text-2xl leading-snug">{profile.currently_learning}</p>
        </Tile>
      )}

      {/* Numbers */}
      {stats.length > 0 && (
        <Tile label="In numbers" delay={240} className="justify-between">
          <dl className="space-y-3">
            {stats.map((s) => (
              <div key={s.label} className="flex items-baseline justify-between gap-3 border-b border-dashed pb-2 last:border-0 last:pb-0">
                <dt className="text-sm text-muted-foreground">{s.label}</dt>
                <dd className="font-heading text-3xl leading-none">
                  <Counter value={s.value} />
                </dd>
              </div>
            ))}
          </dl>
        </Tile>
      )}

      {/* Strongest skills, when there's no "learning" tile to pair with */}
      {!profile.currently_learning && top.length > 0 && (
        <Tile label="Strongest skills" to={`${base}/skills`} delay={200}>
          <ul className="space-y-2">
            {top.slice(0, 4).map((s) => (
              <li key={s.id} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium">{s.name}</span>
                <span className="shrink-0 font-mono text-[0.7rem] text-muted-foreground">{evidenceSummary(s).split(" · ")[0]}</span>
              </li>
            ))}
          </ul>
        </Tile>
      )}

      {/* Contact + availability */}
      {(profile.email || contact) && (
        <Tile label="Say hello" icon={Mail} delay={280} className="bg-accent lg:col-span-2">
          <p className="font-heading text-2xl leading-tight">
            {availability?.tone === "success" ? "Let's build something together." : "Always happy to talk."}
          </p>
          <div className="mt-auto flex flex-wrap gap-2 pt-4">
            {profile.email && <CopyButton value={profile.email} label="Copy email" className="bg-card" />}
            {contact && (
              <Button href={contact.href} size="sm" variant="ghost" className="text-foreground">
                Message <ArrowRight />
              </Button>
            )}
          </div>
        </Tile>
      )}
    </div>
  );
};
