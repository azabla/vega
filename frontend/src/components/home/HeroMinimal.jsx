import { ArrowRight } from "lucide-react";
import { AvailabilityPill } from "@/components/ui/AvailabilityPill";
import { Button } from "@/components/ui/button";
import { useNavItems } from "@/hooks/useNavItems";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { socialLinksOf } from "@/lib/profile";

/** One editorial statement: name, title, bio, links. */
export const HeroMinimal = ({ profile }) => {
  const base = usePortfolioPath();
  const { contact } = useNavItems();
  return (
    <div className="mx-auto max-w-4xl animate-fade-up py-8 text-center md:py-16">
      <AvailabilityPill profile={profile} />
      <h1 className="font-heading mt-8 text-display">
        {profile.name}
        {profile.title && <span className="block text-primary-ink italic">{profile.title}</span>}
      </h1>
      {profile.location && <p className="mt-5 font-mono text-xs uppercase tracking-widest text-muted-foreground">Based in {profile.location}</p>}
      {profile.bio && <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-muted-foreground">{profile.bio}</p>}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
        <Button href={`${base}/projects`} size="lg">
          View my work <ArrowRight />
        </Button>
        {contact && (
          <Button href={contact.href} size="lg" variant="secondary">
            Get in touch
          </Button>
        )}
      </div>
      <div className="mt-6 flex justify-center gap-1">
        {socialLinksOf(profile).map((s) => (
          <a key={s.id} href={s.href} target="_blank" rel="noreferrer" aria-label={s.label} className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground">
            <s.icon className="size-[1.1rem]" />
          </a>
        ))}
      </div>
    </div>
  );
};
