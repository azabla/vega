import { ArrowRight, MapPin } from "lucide-react";
import { AvailabilityPill } from "@/components/ui/AvailabilityPill";
import { Button } from "@/components/ui/button";
import { Counter } from "@/components/ui/Counter";
import { Img } from "@/components/ui/Img";
import { useNavItems } from "@/hooks/useNavItems";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { initialsOf } from "@/lib/format";
import { yearsOfExperience } from "@/lib/portfolio";
import { socialLinksOf } from "@/lib/profile";

/** Two columns: introduction and buttons, portrait (or a monogram) on the right. */
export const HeroClassic = ({ profile, projects, experience, skills }) => {
  const base = usePortfolioPath();
  const { contact } = useNavItems();
  const years = yearsOfExperience(experience);
  const stats = [
    projects.length > 0 && { value: String(projects.length), label: "Projects" },
    years > 0 && { value: `${years}+`, label: "Years" },
    skills.length > 0 && { value: String(skills.length), label: "Skills" },
  ].filter(Boolean);

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[1.25fr_1fr]">
      <div className="min-w-0 animate-fade-up">
        <div className="flex flex-wrap items-center gap-3">
          <AvailabilityPill profile={profile} />
          {profile.location && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5" /> {profile.location}
            </span>
          )}
        </div>
        <h1 className="font-heading mt-6 text-display">{profile.name}</h1>
        {profile.title && <p className="mt-3 text-xl text-primary-ink md:text-2xl">{profile.title}</p>}
        {profile.bio && <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">{profile.bio}</p>}
        <div className="mt-8 flex flex-wrap gap-2">
          <Button href={`${base}/projects`} size="lg">
            View my work <ArrowRight />
          </Button>
          {contact && (
            <Button href={contact.href} size="lg" variant="secondary">
              Get in touch
            </Button>
          )}
        </div>
        {stats.length > 0 && (
          <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4 border-t pt-6">
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="eyebrow text-muted-foreground">{s.label}</dt>
                <dd className="font-heading mt-1 text-4xl">
                  <Counter value={s.value} />
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>

      <div className="animate-fade-up [animation-delay:120ms]">
        <Img
          src={profile.profile_image}
          alt={profile.name}
          ratio="4 / 5"
          eager
          className="surface mx-auto max-w-sm lg:max-w-none"
          fallback={
            <div className="flex size-full items-center justify-center bg-accent">
              <span className="font-heading text-[8rem] leading-none text-primary-ink">{initialsOf(profile.name)}</span>
            </div>
          }
        />
        {socialLinksOf(profile).length > 0 && (
          <div className="mt-4 flex justify-center gap-1 lg:justify-start">
            {socialLinksOf(profile).map((s) => (
              <a key={s.id} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                <s.icon className="size-[1.1rem]" />
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
