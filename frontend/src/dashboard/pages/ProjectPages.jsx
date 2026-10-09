import { ArrowLeft, ExternalLink, FileStack, FolderKanban, Images, Lightbulb, Puzzle, Workflow } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@/auth/context";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge, Tag } from "@/components/ui/Tag";
import { ObjectForm } from "@/dashboard/components/ObjectForm";
import { ListSkeleton, LoadError, PageHeader, Panel } from "@/dashboard/components/Page";
import { ResourceManager } from "@/dashboard/components/ResourceManager";
import {
  PROJECT_STATUS,
  architectureFields,
  challengeFields,
  featureFields,
  galleryFields,
  labelOf,
  lessonFields,
  projectFields,
} from "@/dashboard/fields";
import { useResource } from "@/dashboard/lib/useResource";
import { cn } from "@/lib/utils";

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

export const ProjectsPage = () => {
  const skills = useResource("/me/skills/");
  return (
    <>
      <PageHeader
        title="Projects"
        description="Your case studies. Add the basics here, then open a project to add features, challenges, lessons and screenshots."
      />
      <ResourceManager
        endpoint="/me/projects/"
        fields={projectFields(skills.data)}
        noun="Project"
        emptyIcon={FolderKanban}
        emptyText="Start with the project you're proudest of."
        sort={(a, b) => b.featured - a.featured || a.order - b.order || b.created_at.localeCompare(a.created_at)}
        describe={(p) => ({
          title: p.title,
          subtitle: p.summary,
          image: p.thumbnail,
          meta: (
            <>
              <StatusBadge status={p.status} label={labelOf(PROJECT_STATUS, p.status)} />
              {p.featured && <Tag>Featured</Tag>}
            </>
          ),
        })}
        rowActions={(p) => (
          <Link
            to={`/dashboard/projects/${p.id}`}
            aria-label={`Open the ${p.title} case study`}
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "size-9 sm:w-auto sm:px-3")}
          >
            <FileStack />
            <span className="hidden sm:inline">Case study</span>
          </Link>
        )}
      />
    </>
  );
};

const PROJECT_PARTS = [
  {
    key: "features",
    title: "Key features",
    endpoint: "/me/project-features/",
    fields: featureFields,
    noun: "Feature",
    icon: Puzzle,
    describe: (f) => ({ title: f.title, subtitle: f.description, image: f.image ?? null }),
  },
  {
    key: "challenges",
    title: "Challenges & solutions",
    endpoint: "/me/project-challenges/",
    fields: challengeFields,
    noun: "Challenge",
    icon: Workflow,
    describe: (c) => ({ title: c.problem, subtitle: c.solution }),
  },
  {
    key: "lessons",
    title: "Lessons learned",
    endpoint: "/me/project-lessons/",
    fields: lessonFields,
    noun: "Lesson",
    icon: Lightbulb,
    describe: (l) => ({ title: l.title, subtitle: l.description }),
  },
  {
    key: "gallery",
    title: "Gallery",
    endpoint: "/me/project-images/",
    fields: galleryFields,
    noun: "Image",
    icon: Images,
    describe: (i) => ({ title: i.caption || "Untitled image", image: i.image }),
  },
  {
    key: "architecture",
    title: "Architecture",
    description: "One description and diagram per project.",
    endpoint: "/me/project-architecture/",
    fields: architectureFields,
    noun: "Architecture",
    icon: FileStack,
    max: 1,
    describe: (a) => ({ title: "Architecture overview", subtitle: a.description, image: a.diagram ?? null }),
  },
];

export const ProjectEditorPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const skills = useResource("/me/skills/");
  const project = useResource(`/me/projects/${id}/`);
  const params = { project: Number(id) };

  const back = (
    <Link to="/dashboard/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" /> All projects
    </Link>
  );

  if (project.loading) {
    return (
      <>
        {back}
        <ListSkeleton rows={5} />
      </>
    );
  }
  if (project.error) {
    return (
      <>
        {back}
        <LoadError onRetry={project.error.response?.status === 404 ? undefined : project.reload}>
          {project.error.response?.status === 404 ? "This project doesn't exist." : "Couldn't load this project."}
        </LoadError>
      </>
    );
  }

  return (
    <>
      {back}
      <PageHeader
        title={project.data.title}
        description="Everything on this page appears in the project's case study."
        action={
          <a
            href={`/u/${user.username}/projects/${project.data.slug}`}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "self-start px-3")}
          >
            <ExternalLink /> View case study
          </a>
        }
      />
      <div className="flex flex-col gap-6">
        <Panel title="Basics">
          <ObjectForm
            endpoint={`/me/projects/${id}/`}
            resource={project}
            fields={projectFields(skills.data)}
            successTitle="Project saved"
          />
        </Panel>
        {PROJECT_PARTS.map((part) => (
          <Panel key={part.key} title={part.title} description={part.description}>
            <ResourceManager
              endpoint={part.endpoint}
              params={params}
              fields={part.fields}
              noun={part.noun}
              emptyIcon={part.icon}
              max={part.max}
              sort={part.max ? undefined : byOrder}
              describe={part.describe}
            />
          </Panel>
        ))}
      </div>
    </>
  );
};
