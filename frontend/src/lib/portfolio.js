import { formatYearRange } from "@/lib/format";

// Derived facts shared by several sections

export const proofCount = (skill) =>
    skill.evidence.projects.length + skill.evidence.experience.length + skill.evidence.certificates.length;

// Skills with the most evidence first
export const strongestSkills = (skills = []) => [...skills].sort((a, b) => proofCount(b) - proofCount(a));

// Featured projects, or the first few when none are marked
export const featuredProjects = (projects = [], count = 3) => {
    const featured = projects.filter((p) => p.featured);
    return (featured.length ? featured : projects).slice(0, count);
};

const isWork = (job) => job.employment_type !== "volunteer";

export const currentRole = (experience = []) => experience.find((job) => job.current && isWork(job)) ?? null;

// Earliest start date across jobs → whole years of experience
export const yearsOfExperience = (experience = []) => {
    const starts = experience.filter(isWork).map((job) => new Date(job.start_date).getTime());
    if (!starts.length) return 0;
    return Math.max(1, Math.floor((Date.now() - Math.min(...starts)) / (365.25 * 24 * 3600 * 1000)));
};

// "4 projects · 2 roles · 3 yrs"
export const evidenceSummary = (skill) => {
    const { projects, experience, certificates } = skill.evidence;
    return [
        projects.length && `${projects.length} project${projects.length === 1 ? "" : "s"}`,
        experience.length && `${experience.length} role${experience.length === 1 ? "" : "s"}`,
        certificates.length && `${certificates.length} cert${certificates.length === 1 ? "" : "s"}`,
        skill.years_of_experience && `${skill.years_of_experience} yr${skill.years_of_experience === 1 ? "" : "s"}`,
    ]
        .filter(Boolean)
        .join(" · ");
};

// "2023 – 2024", "2024 – Present" for work still in progress
export const projectYears = (p) =>
    formatYearRange(p.started_on, p.ended_on, Boolean(p.started_on && !p.ended_on && p.status === "in_progress"));

// Experience and education share one timeline shape
export const timelineFromExperience = (job) => ({
    key: `work-${job.id}`,
    kind: job.employment_type === "volunteer" ? "volunteering" : "work",
    title: job.position,
    org: job.company,
    logo: job.company_logo,
    badge: job.employment_type_display,
    location: job.location,
    start: job.start_date,
    end: job.end_date,
    current: job.current,
    description: job.description,
    skills: job.skills ?? [],
});

export const timelineFromEducation = (item) => ({
    key: `edu-${item.id}`,
    kind: "education",
    title: item.field_of_study || item.level_display,
    org: item.institution,
    badge: item.level_display,
    start: item.start_date,
    end: item.end_date,
    current: item.current,
    description: [item.grade, item.description].filter(Boolean).join("\n"),
    skills: [],
});
