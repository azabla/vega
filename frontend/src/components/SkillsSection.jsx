import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { portfolioAPI } from "@/services/portfolioAPI";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";
import { pluralize } from "@/lib/format";

// "3 projects · 1 job · 2 yrs" — proof instead of star ratings
const evidenceSummary = (skill) => {
  const { projects, experience, certificates } = skill.evidence;
  return [
    projects.length && pluralize(projects.length, "project"),
    experience.length && pluralize(experience.length, "job"),
    certificates.length && pluralize(certificates.length, "certificate"),
    skill.years_of_experience && `${skill.years_of_experience}+ yrs`,
  ]
    .filter(Boolean)
    .join(" · ");
};
import { usePortfolioUsername } from "@/hooks/usePortfolioUsername";

export const SkillsSection = () => {
  const username = usePortfolioUsername();
  const [skills, setSkills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [openSkill, setOpenSkill] = useState(null);
  const base = usePortfolioPath();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const [skillsRes, categoriesRes] = await Promise.all([
          portfolioAPI.getSkills(username),
          portfolioAPI.getCategories(username),
        ]);
        setSkills(skillsRes.data);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error("Failed to fetch skills:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkills();
  }, [username]);

  const filteredSkills = useMemo(() => {
    if (activeCategory === "all") {
      return skills;
    }
    return skills.filter((skill) => skill.category?.slug === activeCategory);
  }, [skills, activeCategory]);

  return (
    <section id="skills" className="relative py-24 px-4 overflow-hidden bg-background">
      {/* Subtle decorative background elements using your custom utilities */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-[10%] w-1.5 h-1.5 star animate-float" />
        <div className="absolute top-40 right-[15%] w-1 h-1 star animate-pulse-subtle" />
        <div className="absolute bottom-32 left-[20%] w-1 h-1 star animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute -top-20 right-1/4 w-[1px] h-[120px] meteor animate-meteor opacity-20" />
      </div>

      <div className="container relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
            My <span className="text-primary text-glow">Skills</span>
          </h2>
          <p className="mx-auto max-w-2xl text-foreground/70 text-lg leading-relaxed">
            Technologies I use to design, build, and deploy scalable web applications 
            with a focus on performance, maintainability, and exceptional user experience.
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-16 animate-fade-in-delay-1">
          <button
            onClick={() => setActiveCategory("all")}
            className={cn(
              "rounded-full border px-6 py-2 text-sm font-medium transition-all duration-300",
              activeCategory === "all"
                ? "cosmic-button border-transparent"
                : "border-border bg-card text-foreground/80 hover:border-primary/50 hover:bg-primary/5 hover:text-primary hover:scale-105"
            )}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.slug)}
              className={cn(
                "rounded-full border px-6 py-2 text-sm font-medium transition-all duration-300",
                activeCategory === category.slug
                  ? "cosmic-button border-transparent"
                  : "border-border bg-card text-foreground/80 hover:border-primary/50 hover:bg-primary/5 hover:text-primary hover:scale-105"
              )}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Skills Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="gradient-border border-border bg-card p-6 rounded-2xl h-32 animate-pulse-subtle"
              >
                <div className="h-3 bg-border/50 rounded w-1/3 mb-4" />
                <div className="h-5 bg-border/50 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in-delay-2">
            {filteredSkills.map((skill, index) => {
              const summary = evidenceSummary(skill);
              const isOpen = openSkill === skill.id;
              const { projects, experience, certificates } = skill.evidence;
              return (
                <div
                  key={skill.id}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  className={cn(
                    "group relative gradient-border border-border card-hover bg-card p-6 rounded-2xl text-left cursor-pointer",
                    "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background"
                  )}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => setOpenSkill(isOpen ? null : skill.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpenSkill(isOpen ? null : skill.id);
                    }
                  }}
                >
                  {/* Subtle inner glow on hover */}
                  <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="relative flex items-start justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-primary/70 mb-2 uppercase tracking-wider">
                        {skill.category?.name || "Technology"}
                      </span>
                      <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors duration-300">
                        {skill.name}
                      </h3>
                      {summary && (
                        <span className="mt-1 text-xs text-muted-foreground">{summary}</span>
                      )}
                    </div>
                    <ArrowUpRight
                      className={cn(
                        "h-5 w-5 text-primary transition-all duration-300",
                        isOpen
                          ? "opacity-100 rotate-90"
                          : "opacity-0 translate-y-2 -translate-x-2 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0"
                      )}
                    />
                  </div>

                  {isOpen && (
                    <div className="relative mt-4 space-y-2 border-t border-border pt-4 text-xs">
                      {!summary && <p className="text-muted-foreground">No evidence linked yet.</p>}
                      {projects.map((project) => (
                        <Link
                          key={project.slug}
                          to={`${base}/projects/${project.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="block text-primary hover:underline"
                        >
                          {project.title} →
                        </Link>
                      ))}
                      {experience.map((job) => (
                        <p key={`${job.position}-${job.company}`} className="text-muted-foreground">
                          {job.position} · {job.company}
                        </p>
                      ))}
                      {certificates.map((cert) => (
                        <p key={`${cert.name}-${cert.issuer}`} className="text-muted-foreground">
                          {cert.name} · {cert.issuer}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State Fallback */}
        {!loading && filteredSkills.length === 0 && (
          <div className="col-span-full text-center py-12 text-foreground/50 animate-fade-in">
            <p>No skills found in this category.</p>
          </div>
        )}
      </div>
    </section>
  );
};