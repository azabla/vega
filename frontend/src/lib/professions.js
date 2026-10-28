// Professions an owner can pick (settings.profession). Mirrors backend/portfolio/professions.py — keep the
// section titles in sync. A profession renames a few sections and suggests a starting layout and CV template.
import { Building2, Camera, Code2, FlaskConical, GraduationCap, PenTool, UserRound } from "lucide-react";

const ORDER_DEFAULT = ["about", "projects", "experience", "skills", "achievements", "education", "testimonials", "contact"];

export const PROFESSIONS = [
    {
        id: "general",
        name: "General",
        hint: "Works for any field",
        icon: UserRound,
        labels: {},
        layout: { hero: "bento", projects_layout: "showcase", order: ORDER_DEFAULT, hidden: ["education"] },
        cvTemplate: "classic",
    },
    {
        id: "developer",
        name: "Developer",
        hint: "Projects and case studies",
        icon: Code2,
        labels: { achievements: "Awards & talks" },
        layout: { hero: "bento", projects_layout: "showcase", order: ORDER_DEFAULT, hidden: ["education"] },
        cvTemplate: "modern",
    },
    {
        id: "designer",
        name: "Designer",
        hint: "Visual work in a grid",
        icon: PenTool,
        labels: { projectsPage: "Selected work", projectsHome: "Recent work", achievements: "Awards & features" },
        layout: {
            hero: "minimal",
            projects_layout: "grid",
            order: ["projects", "about", "testimonials", "achievements", "experience", "skills", "contact", "education"],
            hidden: ["education"],
        },
        cvTemplate: "creative",
    },
    {
        id: "architect",
        name: "Architect",
        hint: "Built work and competitions",
        icon: Building2,
        labels: { projectsNav: "Projects", projectsPage: "Projects", projectsHome: "Selected projects", achievements: "Awards & competitions" },
        layout: {
            hero: "classic",
            projects_layout: "showcase",
            order: ["projects", "about", "experience", "achievements", "education", "testimonials", "contact", "skills"],
            hidden: ["skills"],
        },
        cvTemplate: "elegant",
    },
    {
        id: "photographer",
        name: "Photographer / artist",
        hint: "Gallery and exhibitions",
        icon: Camera,
        labels: {
            projectsNav: "Portfolio",
            projectsEyebrow: "Portfolio",
            projectsPage: "Selected work",
            projectsHome: "Recent work",
            achievements: "Exhibitions & awards",
            achievementsNav: "Exhibitions",
        },
        layout: {
            hero: "minimal",
            projects_layout: "grid",
            order: ["projects", "about", "achievements", "testimonials", "contact", "experience", "skills", "education"],
            hidden: ["experience", "skills", "education"],
        },
        cvTemplate: "creative",
    },
    {
        id: "student",
        name: "Student / graduate",
        hint: "Education and projects first",
        icon: GraduationCap,
        labels: { projectsNav: "Projects", projectsEyebrow: "Projects", projectsPage: "Projects", projectsHome: "Things I've made", achievements: "Awards & activities" },
        layout: {
            hero: "classic",
            projects_layout: "grid",
            order: ["about", "education", "projects", "experience", "skills", "achievements", "testimonials", "contact"],
            hidden: [],
        },
        cvTemplate: "classic",
    },
    {
        id: "researcher",
        name: "Researcher / academic",
        hint: "Publications and research",
        icon: FlaskConical,
        labels: {
            projectsNav: "Research",
            projectsEyebrow: "Research",
            projectsPage: "Research projects",
            projectsHome: "What I'm working on",
            achievements: "Publications & awards",
            achievementsNav: "Publications",
        },
        layout: {
            hero: "classic",
            projects_layout: "list",
            order: ["about", "achievements", "projects", "education", "experience", "skills", "contact", "testimonials"],
            hidden: ["testimonials"],
        },
        cvTemplate: "academic",
    },
];

export const professionOf = (id) => PROFESSIONS.find((p) => p.id === id) ?? PROFESSIONS[0];

// Words a profession can change. projects*: nav link, home eyebrow, projects page title, home section title;
// achievements*: section/page title and nav link.
const DEFAULT_LABELS = {
    projectsNav: "Work",
    projectsEyebrow: "Selected work",
    projectsPage: "Projects",
    projectsHome: "Things I've built",
    achievements: "Awards & publications",
    achievementsNav: "Awards",
};

/** The words this profession uses, e.g. labelsOf("researcher").projectsNav → "Research". */
export const labelsOf = (profession) => ({ ...DEFAULT_LABELS, ...professionOf(profession).labels });

// CV section titles that differ from CV_SECTIONS; the same as SECTION_TITLES in professions.py
const CV_TITLES = {
    developer: { achievements: "Awards & talks" },
    designer: { projects: "Selected work", achievements: "Awards & features" },
    architect: { achievements: "Awards & competitions" },
    photographer: { projects: "Selected work", achievements: "Exhibitions & awards" },
    student: { achievements: "Awards & activities" },
    researcher: { projects: "Research projects", achievements: "Publications & awards" },
};

/** The title a CV section gets when the owner hasn't renamed it, or undefined for the default. */
export const cvSectionTitle = (profession, section) => CV_TITLES[profession]?.[section];

/** The settings a profession suggests: its section order and visibility, hero and projects layout. */
export const professionPreset = (id) => {
    const { layout } = professionOf(id);
    return {
        profession: id,
        hero: layout.hero,
        projects_layout: layout.projects_layout,
        sections: layout.order.map((s) => ({ id: s, visible: !layout.hidden.includes(s) })),
    };
};
