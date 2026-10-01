import { AboutSection } from "../components/AboutSection";
import { ContactSection } from "../components/ContactSection";
import { EducationSection } from "../components/EducationSection";
import { ExperienceSection } from "../components/ExperienceSection";
import { HeroSection } from "../components/hero/HeroSection";
import { PortfolioLayout } from "../components/PortfolioLayout";
import { ProjectsSection } from "../components/ProjectsSection";
import { SkillsSection } from "../components/SkillsSection";

export const Home = () => {
    return (
        <PortfolioLayout>
            <HeroSection />
            <AboutSection />
            <SkillsSection />
            <ExperienceSection />
            <ProjectsSection />
            <EducationSection />
            <ContactSection />
        </PortfolioLayout>
    );
};
