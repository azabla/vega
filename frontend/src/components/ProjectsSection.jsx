import { ArrowRight, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { FaGithub } from "react-icons/fa";
import { portfolioAPI } from "../services/portfolioAPI";
import { usePortfolioUsername } from "@/hooks/usePortfolioUsername";



export const ProjectsSection = () => {

  const username = usePortfolioUsername();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(()=>{
    const fetchProjects = async () => {
      try {
        const response = await portfolioAPI.getFeaturedProjects(username);
        setProjects(response.data);
      }catch(error){
        console.error("Failed to load featured projects: ", error);
      }finally{
        setLoading(false);
      }
    }

    fetchProjects();
  }, [username])

  if (loading) {
    return (
      <section id="projects" className="py-24 px-4">
        <div className="container max-w-6xl">
          <div className="text-center">
            <h2 className="text-4xl font-bold mb-4">
              Featured Projects
            </h2>
            <p className="text-muted-foreground">
              Loading projects...
            </p>
          </div>
        </div>
      </section>
    );
  }

  {
    projects.length === 0 && (
      <p className="text-center text-muted-foreground">
        No featured projects available.
      </p>
    );
  }
  
  return (
    <section id="projects" className="py-24 px-4 relative">
      <div className="container max-w-6xl">

        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-primary font-medium mb-3">
            Selected Work
          </p>

          <h2 className="text-4xl font-bold">
            Featured Projects
          </h2>

          <p className="mt-5 text-muted-foreground leading-7">
            A selection of projects that demonstrate my experience building
            scalable backend systems, APIs, SaaS platforms, and modern web
            applications.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">

        {projects.map((project) => (
        <article
          key={project.id}
          className="group gradient-border overflow-hidden bg-card card-hover flex flex-col"
        >
          <div className="relative overflow-hidden">
            <img
              src={
                project.thumbnail ||
                "https://via.placeholder.com/800x500?text=Project"
              }
              alt={project.title}
              className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {project.featured && (
              <div className="absolute left-4 top-4 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium px-3 py-1">
                Featured
              </div>
            )}
          </div>

          <div className="flex flex-col flex-1 p-6">
            <h3 className="text-xl font-semibold mb-3">
              {project.title}
            </h3>

            <p className="text-muted-foreground text-sm leading-6 flex-1">
              {project.summary}
            </p>

            <div className="flex flex-wrap gap-2 mt-6">
              {project.technologies.map((tech) => (
                <span
                  key={tech.id}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium"
                >
                  {tech.name}
                </span>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button className="flex items-center gap-2 text-primary font-medium group/link">
                View Case Study
                <ArrowRight
                  size={16}
                  className="transition-transform duration-300 group-hover/link:translate-x-1"
                />
              </button>

              <div className="flex gap-4">
                {project.github_url && (
                  <a
                    href={project.github_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <FaGithub size={18} />
                  </a>
                )}

                {project.live_url && (
                  <a
                    href={project.live_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <ExternalLink size={18} />
                  </a>
                )}
              </div>
            </div>
          </div>
        </article>
      ))}

        </div>

        <div className="mt-16 flex justify-center">

          <button className="cosmic-button flex items-center gap-2">

            View Project Archive

            <ArrowRight size={16} />

          </button>

        </div>

      </div>
    </section>
  );
};