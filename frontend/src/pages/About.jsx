import { ArrowRight, Download, UserRound } from "lucide-react";
import { useState } from "react";
import { ContactCTA } from "@/components/home/ContactCTA";
import { PortfolioLayout } from "@/components/PortfolioLayout";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Img } from "@/components/ui/Img";
import { Lightbox } from "@/components/ui/Lightbox";
import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow, Section, SectionHeader } from "@/components/ui/Section";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppearance } from "@/hooks/useAppearance";
import { useAbout, useExperience } from "@/hooks/usePortfolio";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { useProfile } from "@/hooks/useProfile";
import { initialsOf, linesOf } from "@/lib/format";
import { yearsOfExperience } from "@/lib/portfolio";
import { personJsonLd, resumeFileOf } from "@/lib/profile";

export const About = () => {
  const { data: about, loading } = useAbout();
  const { profile } = useProfile();
  const { data: experience } = useExperience();
  const { settings } = useAppearance();
  const base = usePortfolioPath();
  const [photo, setPhoto] = useState(null);

  const years = about?.experience_years || yearsOfExperience(experience ?? []);
  const interests = linesOf(about?.interests);
  const photos = (about?.photos ?? []).map((p) => ({ src: p.image, caption: p.caption }));
  const resume = resumeFileOf(profile, about);

  return (
    <PortfolioLayout title="About" meta={{ description: about?.description, type: "profile", jsonLd: personJsonLd(profile) }}>
      {loading ? (
        <div className="container pt-36 pb-24">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-6 h-16 w-3/4" />
          <Skeleton className="mt-10 h-48 w-full rounded-2xl" />
        </div>
      ) : !about ? (
        <div className="container pt-36 pb-24">
          <EmptyState icon={UserRound} title="The story is still being written" description="An about section hasn't been added yet." action={<Button href={base || "/"}>Back home</Button>} />
        </div>
      ) : (
        <>
          {/* Intro with portrait */}
          <header className="container grid items-end gap-10 pt-32 md:pt-40 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
            <div className="min-w-0 animate-fade-up">
              <Eyebrow className="mb-4">{about.heading || "About"}</Eyebrow>
              <h1 className="font-heading text-display">{about.title}</h1>
              {years > 0 && (
                <p className="mt-6 font-mono text-sm text-muted-foreground">
                  {years}+ years · {profile?.location || profile?.title}
                </p>
              )}
            </div>
            <Img
              src={profile?.profile_image}
              alt={profile?.name}
              ratio="4 / 5"
              eager
              className="surface w-full max-w-sm animate-fade-up [animation-delay:100ms] lg:max-w-none"
              fallback={
                <div className="flex size-full items-center justify-center bg-accent">
                  <span className="font-heading text-[7rem] leading-none text-primary-ink">{initialsOf(profile?.name)}</span>
                </div>
              }
            />
          </header>

          {/* Story */}
          <Section>
            <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
              <Eyebrow className="lg:pt-2">The story</Eyebrow>
              <Reveal className="prose-width space-y-6 text-[1.15rem] leading-8 text-muted-foreground">
                <p className="font-heading text-2xl leading-snug text-foreground md:text-3xl">{about.description}</p>
                {linesOf(about.description_2).map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
                <div className="flex flex-wrap gap-2 pt-2">
                  {resume && (
                    <Button href={resume} variant="secondary">
                      <Download /> Download CV
                    </Button>
                  )}
                  {settings.pages.experience && (
                    <Button href={`${base}/experience`} variant="ghost">
                      See my experience <ArrowRight />
                    </Button>
                  )}
                </div>
              </Reveal>
            </div>
          </Section>

          {/* What I do */}
          {about.services?.length > 0 && (
            <Section className="pt-0 md:pt-0">
              <SectionHeader eyebrow="What I do" title="Where I'm most useful" />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {about.services.map((s, i) => (
                  <Reveal key={s.id} delay={i * 60} className="surface flex flex-col p-6">
                    <span className="font-mono text-xs text-primary-ink">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="font-heading mt-6 text-2xl leading-tight">{s.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">{s.description}</p>
                  </Reveal>
                ))}
              </div>
            </Section>
          )}

          {/* How I work */}
          {about.principles?.length > 0 && (
            <Section className="pt-0 md:pt-0">
              <div className="grid gap-10 lg:grid-cols-[1fr_2fr] lg:gap-16">
                <SectionHeader eyebrow="How I work" title="Principles I keep coming back to" className="md:flex-col md:items-start lg:sticky lg:top-28 lg:self-start" />
                <ol className="divide-y border-y">
                  {about.principles.map((p, i) => (
                    <Reveal as="li" key={p.id} className="grid grid-cols-[3rem_1fr] gap-4 py-6">
                      <span className="font-heading text-3xl text-primary-ink">{i + 1}</span>
                      <div>
                        <h3 className="text-lg font-medium">{p.title}</h3>
                        {p.description && <p className="mt-1.5 leading-7 text-muted-foreground">{p.description}</p>}
                      </div>
                    </Reveal>
                  ))}
                </ol>
              </div>
            </Section>
          )}

          {/* Interests */}
          {interests.length > 0 && (
            <Section className="pt-0 md:pt-0">
              <SectionHeader eyebrow="Off the clock" title="A few things about me" />
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {interests.map((item, i) => (
                  <Reveal as="li" key={i} delay={(i % 3) * 60} className="surface flex items-start gap-4 p-5">
                    <span className="font-heading text-2xl leading-none text-primary-ink" aria-hidden>
                      ✦
                    </span>
                    <span className="leading-7">{item}</span>
                  </Reveal>
                ))}
              </ul>
            </Section>
          )}

          {/* Photo strip */}
          {photos.length > 0 && (
            <section aria-label="Photos" className="pb-16 md:pb-28">
              <ul className="scrollbar-none flex snap-x gap-3 overflow-x-auto px-4 md:px-[max(2rem,calc((100vw-72rem)/2+2rem))]">
                {photos.map((p, i) => (
                  <li key={p.src} className="w-64 shrink-0 snap-start md:w-80">
                    <button type="button" onClick={() => setPhoto(i)} className="block w-full overflow-hidden rounded-2xl border" aria-label={`Open photo${p.caption ? `: ${p.caption}` : ""}`}>
                      <Img src={p.src} alt={p.caption} ratio={i % 2 ? "4 / 5" : "1 / 1"} className="transition-transform duration-500 hover:scale-[1.03]" />
                    </button>
                  </li>
                ))}
              </ul>
              <Lightbox images={photos} index={photo} onIndexChange={setPhoto} title="Photos" />
            </section>
          )}

          <ContactCTA />
        </>
      )}
    </PortfolioLayout>
  );
};
