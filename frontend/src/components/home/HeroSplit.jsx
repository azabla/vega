import { ArrowRight, ArrowUpRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { AvailabilityPill } from "@/components/ui/AvailabilityPill";
import { Button } from "@/components/ui/button";
import { Img } from "@/components/ui/Img";
import { useNavItems } from "@/hooks/useNavItems";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { initialsOf } from "@/lib/format";
import { currentRole, featuredProjects } from "@/lib/portfolio";
import { socialLinksOf } from "@/lib/profile";

/** Half text, half a tall portrait with the featured project pinned to it. */
export const HeroSplit = ({ profile, projects, experience }) => {
  const base = usePortfolioPath();
  const { contact } = useNavItems();
  const role = currentRole(experience);
  const featured = featuredProjects(projects, 1)[0];
  const socials = socialLinksOf(profile);

  return (
    <div className="grid gap-6 lg:min-h-[min(44rem,78dvh)] lg:grid-cols-2 lg:gap-8">
      <div className="flex min-w-0 animate-fade-up flex-col justify-between gap-10 py-2 lg:py-6">
        <div className="flex flex-wrap items-center gap-3">
          <AvailabilityPill profile={profile} />
          {profile.location && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="size-3.5" /> {profile.location}
            </span>
          )}
        </div>
        <div>
          {role && (
            <p className="eyebrow mb-5 text-muted-foreground">
              Now · {role.position} at {role.company}
            </p>
          )}
          <h1 className="font-heading text-display break-words">{profile.name}</h1>
          {profile.title && <p className="mt-3 text-xl text-primary-ink md:text-2xl">{profile.title}</p>}
          {profile.bio && <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">{profile.bio}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button href={`${base}/projects`} size="lg">
            View my work <ArrowRight />
          </Button>
          {contact && (
            <Button href={contact.href} size="lg" variant="secondary">
              Get in touch
            </Button>
          )}
          {socials.length > 0 && (
            <span className="ml-1 flex gap-1">
              {socials.map((s) => (
                <a key={s.id} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                  <s.icon className="size-[1.1rem]" />
                </a>
              ))}
            </span>
          )}
        </div>
      </div>

      <div className="relative min-h-[24rem] animate-fade-up [animation-delay:120ms] sm:min-h-[30rem]">
        <Img
          src={profile.profile_image}
          alt={profile.name}
          eager
          className="surface absolute inset-0"
          fallback={
            <div className="flex size-full items-center justify-center bg-accent">
              <span className="font-heading text-[9rem] leading-none text-primary-ink">{initialsOf(profile.name)}</span>
            </div>
          }
        />
        {featured && (
          <Link
            to={`${base}/projects/${featured.slug}`}
            className="group surface absolute inset-x-3 bottom-3 flex items-center gap-4 bg-background/85 p-4 backdrop-blur-md transition hover:bg-background sm:inset-x-4 sm:bottom-4"
          >
            <span className="min-w-0 flex-1">
              <span className="eyebrow block text-muted-foreground">Featured work</span>
              <span className="mt-1 block truncate font-medium">{featured.title}</span>
              {featured.summary && <span className="block truncate text-sm text-muted-foreground">{featured.summary}</span>}
            </span>
            <ArrowUpRight className="size-5 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary-ink" aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
};
