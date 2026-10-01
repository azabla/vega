import { ArrowRight, Download, Globe, MapPin } from "lucide-react";
import { FaGithub, FaLinkedin, FaTelegram } from "react-icons/fa";
import { portfolioAPI } from "@/services/portfolioAPI";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { useProfile } from "@/hooks/useProfile";
import { yearOf } from "@/lib/format";
import { HeroSkeleton } from "./HeroSkeleton";
import { ProfileCard } from "./ProfileCard";

// skills with the most proof first
const evidenceCount = (s) =>
  s.evidence.projects.length + s.evidence.experience.length + s.evidence.certificates.length;

export const HeroSection = () => {
  const { profile, loading, error } = useProfile();
  const { data: projects } = usePortfolioData(portfolioAPI.getProjects);
  const { data: skills } = usePortfolioData(portfolioAPI.getSkills);

  const topSkills = [...(skills ?? [])].sort((a, b) => evidenceCount(b) - evidenceCount(a)).slice(0, 5);
  const firstYear = Math.min(...(projects ?? []).map((p) => yearOf(p.started_on) ?? Infinity));
  const stats = [
    projects?.length && { value: projects.length, label: "Projects" },
    skills?.length && { value: skills.length, label: "Skills" },
    Number.isFinite(firstYear) && { value: firstYear, label: "Building since" },
  ].filter(Boolean);

  const socials = profile
    ? [
        profile.github && { icon: FaGithub, label: "GitHub", href: profile.github },
        profile.linkedin && { icon: FaLinkedin, label: "LinkedIn", href: profile.linkedin },
        profile.telegram && { icon: FaTelegram, label: "Telegram", href: profile.telegram },
        profile.website && { icon: Globe, label: "Website", href: profile.website },
      ].filter(Boolean)
    : [];

  return (
    <section id="hero" className="relative overflow-hidden pt-32 pb-12 md:pt-40 md:pb-16">
      <div aria-hidden className="bg-grid pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[880px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "var(--glow)" }}
      />

      <div className="container relative">
        {loading ? (
          <HeroSkeleton />
        ) : error || !profile ? (
          <p className="py-24 text-center text-muted-foreground">This portfolio couldn't be loaded.</p>
        ) : (
          <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_1fr]">
            <div className="animate-fade-up">
              {profile.location && (
                <span className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                  </span>
                  <MapPin className="size-3" /> {profile.location}
                </span>
              )}

              <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
                {profile.name}
              </h1>
              <p className="text-gradient mt-3 text-2xl font-semibold tracking-tight md:text-3xl">{profile.title}</p>
              {profile.bio && (
                <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">{profile.bio}</p>
              )}

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <a
                  href="#projects"
                  className="group inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground shadow-[0_8px_24px_-8px_var(--primary)] transition hover:brightness-110"
                >
                  View my work
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </a>
                <a
                  href="#contact"
                  className="inline-flex h-11 items-center rounded-full border bg-card px-6 text-sm font-medium transition hover:bg-secondary"
                >
                  Get in touch
                </a>
                {profile.resume && (
                  <a
                    href={profile.resume}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium text-muted-foreground transition hover:text-foreground"
                  >
                    <Download className="size-4" /> CV
                  </a>
                )}
                {socials.length > 0 && <span className="mx-1 hidden h-6 w-px bg-border sm:block" />}
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.label}
                    className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                  >
                    <s.icon className="size-5" />
                  </a>
                ))}
              </div>

              {stats.length > 0 && (
                <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-4">
                  {stats.map((stat) => (
                    <div key={stat.label}>
                      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{stat.label}</dt>
                      <dd className="mt-1 text-3xl font-semibold tracking-tight">{stat.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            <div className="hidden animate-fade-up [animation-delay:150ms] lg:block">
              {profile.profile_image ? (
                <img
                  src={profile.profile_image}
                  alt={profile.name}
                  className="surface aspect-square w-full object-cover"
                />
              ) : (
                <ProfileCard profile={profile} skills={topSkills} />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
