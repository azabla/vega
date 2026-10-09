import { PortfolioLayout } from "@/components/PortfolioLayout";
import { AboutTeaser } from "@/components/home/AboutTeaser";
import { ContactCTA } from "@/components/home/ContactCTA";
import { ExperiencePreview } from "@/components/home/ExperiencePreview";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { Hero } from "@/components/home/Hero";
import { SkillsPreview } from "@/components/home/SkillsPreview";
import { Testimonials } from "@/components/home/Testimonials";
import { useAppearance } from "@/hooks/useAppearance";
import { useProfile } from "@/hooks/useProfile";
import { personJsonLd } from "@/lib/profile";

const SECTIONS = {
  about: AboutTeaser,
  projects: FeaturedProjects,
  experience: ExperiencePreview,
  skills: SkillsPreview,
  testimonials: Testimonials,
  contact: ContactCTA,
};

/** Hero, then the sections in the owner's order. Empty sections hide themselves. */
export const Home = () => {
  const { settings, ready } = useAppearance();
  const { profile } = useProfile();

  return (
    <PortfolioLayout meta={{ type: "profile", jsonLd: personJsonLd(profile) }}>
      <Hero />
      {ready &&
        settings.sections
          .filter((s) => s.visible && SECTIONS[s.id])
          .map((s) => {
            const Component = SECTIONS[s.id];
            return <Component key={s.id} />;
          })}
    </PortfolioLayout>
  );
};
