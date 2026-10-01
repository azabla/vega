import { ArrowDown, Download, Server } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa";
import { useProfile } from "@/hooks/useProfile";
import { HeroSkeleton } from "./HeroSkeleton";

export const HeroSection = () => {
  const { profile, loading, error } = useProfile();

  if (loading) return <HeroSkeleton />;

  if (error || !profile) {
    return (
      <section className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">
          Failed to load profile.
        </p>
      </section>
    );
  }

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden"
    >
      <div className="container max-w-5xl mx-auto text-center z-10">
        <div className="space-y-8">

          {/* Role */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary animate-fade-in">
            <Server className="h-4 w-4" />
            <span>{profile.title}</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight animate-fade-in-delay-1">
            Building{" "}
            <span className="text-primary">
              scalable backend systems
            </span>{" "}
            with modern technologies
          </h1>


          {/* Description */}
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground animate-fade-in-delay-2">
            {profile.bio}
          </p>


          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-6 animate-fade-in-delay-3">

            <a href="#projects" className="cosmic-button">
              View My Work
            </a>

            {profile.resume && (
              <a
                href={profile.resume}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-2 rounded-full border border-primary text-primary hover:bg-primary/10 transition"
              >
                <Download className="h-4 w-4" />
                Download CV
              </a>
            )}

          </div>


          {/* Social */}
          <div className="flex justify-center gap-6 pt-4">

            {profile.github && (
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition"
              >
                <FaGithub className="h-6 w-6" />
              </a>
            )}

            {profile.linkedin && (
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition"
              >
                <FaLinkedin className="h-6 w-6" />
              </a>
            )}

          </div>

        </div>
      </div>


      {/* Scroll */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce">
        <span className="text-sm text-muted-foreground mb-2">
          Scroll
        </span>

        <ArrowDown className="h-5 w-5 text-primary" />
      </div>

    </section>
  );
};