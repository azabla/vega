import { Award, Briefcase, Compass, GraduationCap, Handshake, Images, Languages as LanguagesIcon, MessageSquareQuote, Sparkles, Tags } from "lucide-react";
import { Tag } from "@/components/ui/Tag";
import { ObjectForm } from "@/dashboard/components/ObjectForm";
import { PageHeader, Panel } from "@/dashboard/components/Page";
import { ResourceManager } from "@/dashboard/components/ResourceManager";
import {
  EDUCATION_LEVELS,
  EMPLOYMENT_TYPES,
  LANGUAGE_LEVELS,
  aboutFields,
  aboutPhotoFields,
  categoryFields,
  certificateFields,
  educationFields,
  experienceFields,
  labelOf,
  principleFields,
  testimonialFields,
  languageFields,
  profileFields,
  serviceFields,
  skillFields,
} from "@/dashboard/fields";
import { useResource } from "@/dashboard/lib/useResource";
import { formatDateRange, formatMonthYear, pluralize } from "@/lib/format";

const byOrder = (key = "order") => (a, b) => (a[key] ?? 0) - (b[key] ?? 0);

export const ProfilePage = () => (
  <>
    <PageHeader title="Profile" description="Your name, headline, photo and contact links: the top of your portfolio." />
    <Panel>
      <ObjectForm endpoint="/me/profile/" fields={profileFields} successTitle="Profile saved" />
    </Panel>
  </>
);

export const AboutPage = () => (
  <>
    <PageHeader title="About & services" description="Tell your story, and list what people can hire you for." />
    <div className="flex flex-col gap-6">
      <Panel title="About">
        <ObjectForm endpoint="/me/about/" fields={aboutFields} successTitle="About section saved" />
      </Panel>
      <Panel title="Services" description="Optional. Shown in your about section.">
        <ResourceManager
          endpoint="/me/services/"
          fields={serviceFields}
          noun="Service"
          emptyIcon={Handshake}
          emptyText="For example: API development, mentoring, technical writing."
          sort={byOrder("display_order")}
          describe={(s) => ({
            title: s.title,
            subtitle: s.description,
            meta: !s.is_active && <Tag>Hidden</Tag>,
          })}
        />
      </Panel>
      <Panel title="How I work" description="Optional principles, shown on your About page.">
        <ResourceManager
          endpoint="/me/principles/"
          fields={principleFields}
          noun="Principle"
          emptyIcon={Compass}
          emptyText="For example: “Talk to users first”, “Leave code better than I found it”."
          sort={byOrder()}
          describe={(p) => ({ title: p.title, subtitle: p.description })}
        />
      </Panel>
      <Panel title="Photos" description="A small photo strip on your About page.">
        <ResourceManager
          endpoint="/me/about-photos/"
          fields={aboutPhotoFields}
          noun="Photo"
          emptyIcon={Images}
          sort={byOrder()}
          describe={(p) => ({ title: p.caption || "Untitled photo", image: p.image })}
        />
      </Panel>
    </div>
  </>
);

export const TestimonialsPage = () => {
  const projects = useResource("/me/projects/");
  return (
    <>
      <PageHeader title="Testimonials" description="What clients and colleagues say about working with you." />
      <ResourceManager
        endpoint="/me/testimonials/"
        fields={testimonialFields(projects.data)}
        noun="Testimonial"
        emptyIcon={MessageSquareQuote}
        emptyText="Ask a past client or manager for two or three sentences, then paste them here."
        sort={byOrder()}
        describe={(t) => ({
          title: t.name,
          subtitle: `“${t.quote}”`,
          image: t.photo ?? null,
          meta: !t.is_active && <Tag>Hidden</Tag>,
        })}
      />
    </>
  );
};

export const SkillsPage = () => {
  const categories = useResource("/me/categories/");
  const skills = useResource("/me/skills/");
  const categoryName = Object.fromEntries((categories.data ?? []).map((c) => [c.id, c.name]));
  const skillCount = (id) => (skills.data ?? []).filter((s) => s.category === id).length;

  return (
    <>
      <PageHeader
        title="Skills"
        description="Group skills into categories. Link them to projects, jobs and certificates so visitors see the evidence."
      />
      <div className="flex flex-col gap-6">
        <Panel title="Categories" description="e.g. Backend, Frontend, Tools.">
          <ResourceManager
            resource={categories}
            endpoint="/me/categories/"
            fields={categoryFields}
            noun="Category"
            emptyIcon={Tags}
            emptyText="Create a category first, then add skills to it."
            sort={byOrder("display_order")}
            // Deleting a category deletes its skills
            onChange={skills.reload}
            describe={(c) => ({
              title: c.name,
              subtitle: pluralize(skillCount(c.id), "skill"),
              meta: !c.is_active && <Tag>Hidden</Tag>,
            })}
          />
        </Panel>
        <Panel title="Skills">
          {categories.data?.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add a category above to start adding skills.</p>
          ) : (
            <ResourceManager
              resource={skills}
              endpoint="/me/skills/"
              fields={skillFields(categories.data)}
              noun="Skill"
              emptyIcon={Sparkles}
              sort={(a, b) =>
                (categoryName[a.category] ?? "").localeCompare(categoryName[b.category] ?? "") ||
                a.display_order - b.display_order ||
                a.name.localeCompare(b.name)
              }
              onChange={categories.reload}
              describe={(s) => ({
                title: s.name,
                subtitle: categoryName[s.category],
                meta: (
                  <>
                    {s.years_of_experience != null && <Tag>{s.years_of_experience}+ yrs</Tag>}
                    {!s.is_active && <Tag>Hidden</Tag>}
                  </>
                ),
              })}
            />
          )}
        </Panel>
      </div>
    </>
  );
};

export const ExperiencePage = () => {
  const skills = useResource("/me/skills/");
  return (
    <>
      <PageHeader title="Experience" description="Jobs, internships, freelance and volunteer work." />
      <ResourceManager
        endpoint="/me/experience/"
        fields={experienceFields(skills.data)}
        noun="Experience"
        emptyIcon={Briefcase}
        emptyText="Students: internships and volunteer roles count too."
        sort={(a, b) => b.current - a.current || (b.start_date ?? "").localeCompare(a.start_date ?? "")}
        describe={(e) => ({
          title: e.position,
          subtitle: `${e.company} · ${formatDateRange(e.start_date, e.end_date, e.current)}`,
          image: e.company_logo,
          meta: <Tag>{labelOf(EMPLOYMENT_TYPES, e.employment_type)}</Tag>,
        })}
      />
    </>
  );
};

export const EducationPage = () => (
  <>
    <PageHeader title="Education" description="Degrees, diplomas, TVET and school." />
    <ResourceManager
      endpoint="/me/education/"
      fields={educationFields}
      noun="Education"
      emptyIcon={GraduationCap}
      sort={byOrder()}
      describe={(e) => ({
        title: e.institution,
        subtitle: [e.field_of_study, formatDateRange(e.start_date, e.end_date, e.current)].filter(Boolean).join(" · "),
        meta: <Tag>{labelOf(EDUCATION_LEVELS, e.level)}</Tag>,
      })}
    />
  </>
);

export const CertificatesPage = () => {
  const skills = useResource("/me/skills/");
  return (
    <>
      <PageHeader title="Certificates" description="Courses and certifications, with a link or file as proof." />
      <ResourceManager
        endpoint="/me/certificates/"
        fields={certificateFields(skills.data)}
        noun="Certificate"
        emptyIcon={Award}
        sort={byOrder()}
        describe={(c) => ({
          title: c.name,
          subtitle: [c.issuer, formatMonthYear(c.issue_date)].filter(Boolean).join(" · "),
          meta: c.skills.length > 0 && <Tag>{pluralize(c.skills.length, "skill")}</Tag>,
        })}
      />
    </>
  );
};

export const LanguagesPage = () => (
  <>
    <PageHeader title="Languages" description="Languages you speak, e.g. Amharic, English, Afaan Oromo." />
    <ResourceManager
      endpoint="/me/languages/"
      fields={languageFields}
      noun="Language"
      emptyIcon={LanguagesIcon}
      sort={byOrder()}
      describe={(l) => ({ title: l.name, subtitle: labelOf(LANGUAGE_LEVELS, l.proficiency) })}
    />
  </>
);
