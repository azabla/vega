import { ArrowLeft, BookOpen, ExternalLink, Lightbulb, Network, Puzzle, Sparkles } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { Link, useParams } from "react-router-dom";
import { PortfolioLayout } from "@/components/PortfolioLayout";
import { portfolioAPI } from "@/services/portfolioAPI";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { usePortfolioPath } from "@/hooks/usePortfolioPath";

const Block = ({ icon, title, children }) => {
  const Icon = icon;
  return (
    <section className="mt-16">
      <h2 className="flex items-center gap-2 text-2xl font-bold">
        <Icon className="h-5 w-5 text-primary" /> {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
};

export const ProjectDetail = () => {
  const { slug } = useParams();
  const base = usePortfolioPath();
  const { data: project, loading, error } = usePortfolioData(portfolioAPI.getProject, slug);

  const back = (
    <Link
      to={`${base}/projects`}
      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
    >
      <ArrowLeft size={16} /> All projects
    </Link>
  );

  if (loading || error) {
    return (
      <PortfolioLayout>
        <div className="container max-w-4xl pt-32 pb-24 px-4">
          {back}
          <p className="mt-10 text-muted-foreground">
            {loading ? "Loading project..." : "Project not found."}
          </p>
        </div>
      </PortfolioLayout>
    );
  }

  return (
    <PortfolioLayout>
      <article className="container max-w-4xl pt-32 pb-24 px-4 text-left">
        {back}

        <header className="mt-6">
          <h1 className="text-4xl md:text-5xl font-bold">{project.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{project.summary}</p>

          <div className="mt-6 flex flex-wrap gap-2">
            {project.skills.map((skill) => (
              <span
                key={skill.id}
                className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium"
              >
                {skill.name}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            {project.live_url && (
              <a href={project.live_url} target="_blank" rel="noreferrer" className="cosmic-button flex items-center gap-2">
                Live site <ExternalLink size={16} />
              </a>
            )}
            {project.github_url && (
              <a
                href={project.github_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-6 py-2 rounded-full border border-primary text-primary hover:bg-primary/10 transition-colors"
              >
                <FaGithub size={16} /> Source code
              </a>
            )}
          </div>
        </header>

        {project.thumbnail && (
          <img src={project.thumbnail} alt={project.title} className="mt-12 w-full rounded-2xl border border-border" />
        )}

        <Block icon={BookOpen} title="Overview">
          <p className="text-muted-foreground leading-7 whitespace-pre-line">{project.overview}</p>
        </Block>

        {project.features.length > 0 && (
          <Block icon={Sparkles} title="Key Features">
            <div className="grid gap-6 md:grid-cols-2">
              {project.features.map((feature) => (
                <div key={feature.id} className="gradient-border p-6">
                  {feature.image && (
                    <img src={feature.image} alt="" className="mb-4 w-full rounded-lg border border-border" />
                  )}
                  <h3 className="font-semibold">{feature.title}</h3>
                  {feature.description && (
                    <p className="mt-2 text-sm text-muted-foreground leading-6">{feature.description}</p>
                  )}
                  <div className="mt-3 flex gap-4 text-sm">
                    {feature.demo_url && (
                      <a href={feature.demo_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        Demo
                      </a>
                    )}
                    {feature.documentation_url && (
                      <a href={feature.documentation_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                        Docs
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Block>
        )}

        {project.architecture && (project.architecture.description || project.architecture.diagram) && (
          <Block icon={Network} title="Architecture">
            {project.architecture.description && (
              <p className="text-muted-foreground leading-7 whitespace-pre-line">{project.architecture.description}</p>
            )}
            {project.architecture.diagram && (
              <img
                src={project.architecture.diagram}
                alt={`${project.title} architecture diagram`}
                className="mt-6 w-full rounded-2xl border border-border bg-card"
              />
            )}
          </Block>
        )}

        {project.challenges.length > 0 && (
          <Block icon={Puzzle} title="Challenges & Solutions">
            <div className="space-y-6">
              {project.challenges.map((c) => (
                <div key={c.id} className="gradient-border p-6">
                  <h3 className="font-semibold">{c.problem}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-6 whitespace-pre-line">{c.solution}</p>
                </div>
              ))}
            </div>
          </Block>
        )}

        {project.lessons.length > 0 && (
          <Block icon={Lightbulb} title="Lessons Learned">
            <ul className="space-y-4">
              {project.lessons.map((lesson) => (
                <li key={lesson.id}>
                  <h3 className="font-semibold">{lesson.title}</h3>
                  {lesson.description && (
                    <p className="mt-1 text-sm text-muted-foreground leading-6">{lesson.description}</p>
                  )}
                </li>
              ))}
            </ul>
          </Block>
        )}

        {project.gallery.length > 0 && (
          <Block icon={Sparkles} title="Gallery">
            <div className="grid gap-6 sm:grid-cols-2">
              {project.gallery.map((img) => (
                <figure key={img.id}>
                  <img src={img.image} alt={img.caption || project.title} className="w-full rounded-xl border border-border" />
                  {img.caption && (
                    <figcaption className="mt-2 text-xs text-muted-foreground">{img.caption}</figcaption>
                  )}
                </figure>
              ))}
            </div>
          </Block>
        )}
      </article>
    </PortfolioLayout>
  );
};
