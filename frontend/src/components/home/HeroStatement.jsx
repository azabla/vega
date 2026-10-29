import { ArrowRight, MapPin } from "lucide-react";
import { AvailabilityPill } from "@/components/ui/AvailabilityPill";
import { Button } from "@/components/ui/button";
import { useNavItems } from "@/hooks/useNavItems";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { strongestSkills } from "@/lib/portfolio";
import { socialLinksOf } from "@/lib/profile";

const SkillRun = ({ names, hidden }) => (
  <ul className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={hidden || undefined}>
    {names.map((name) => (
      <li key={name} className="font-heading flex items-center gap-8 text-2xl whitespace-nowrap text-muted-foreground md:text-3xl">
        {name}
        <span className="size-1.5 rounded-full bg-primary" aria-hidden />
      </li>
    ))}
  </ul>
);

/** Oversized type: the name across the page, then a slow ribbon of skills. */
export const HeroStatement = ({ profile, skills }) => {
  const base = usePortfolioPath();
  const { contact } = useNavItems();
  const names = strongestSkills(skills).slice(0, 12).map((s) => s.name);

  return (
    <div className="animate-fade-up py-4 md:py-10">
      <div className="flex flex-wrap items-center gap-3">
        <AvailabilityPill profile={profile} />
        {profile.location && (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5" /> {profile.location}
          </span>
        )}
      </div>
      <h1 className="font-heading mt-8 text-[clamp(3rem,10.5vw,9.5rem)] leading-[0.92] break-words">{profile.name}</h1>
      {profile.title && <p className="font-heading mt-4 text-[clamp(1.5rem,3.6vw,3rem)] leading-tight text-primary-ink">{profile.title}</p>}
      <div className="mt-10 grid gap-8 border-t pt-8 md:grid-cols-[1.5fr_1fr] md:items-end">
        {profile.bio ? <p className="max-w-2xl text-lg leading-8 text-muted-foreground">{profile.bio}</p> : <span />}
        <div className="flex flex-wrap items-center gap-2 md:justify-end">
          <Button href={`${base}/projects`} size="lg">
            View my work <ArrowRight />
          </Button>
          {contact && (
            <Button href={contact.href} size="lg" variant="secondary">
              Get in touch
            </Button>
          )}
          {socialLinksOf(profile).map((s) => (
            <a key={s.id} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground">
              <s.icon className="size-[1.1rem]" />
            </a>
          ))}
        </div>
      </div>
      {names.length > 2 && (
        <div className="marquee-mask mt-12 flex overflow-hidden border-y py-5" role="group" aria-label={`Skills: ${names.join(", ")}`}>
          <div className="flex animate-marquee">
            <SkillRun names={names} hidden />
            <SkillRun names={names} hidden />
          </div>
        </div>
      )}
    </div>
  );
};
