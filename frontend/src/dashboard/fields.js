// Form definitions for every owner API resource. Field names match the
// serializers in backend/portfolio/manage_serializers.py.

export const PROJECT_STATUS = [
    { value: "completed", label: "Completed" },
    { value: "in_progress", label: "In progress" },
    { value: "archived", label: "Archived" },
];

export const EMPLOYMENT_TYPES = [
    { value: "full_time", label: "Full-time" },
    { value: "part_time", label: "Part-time" },
    { value: "contract", label: "Contract" },
    { value: "freelance", label: "Freelance" },
    { value: "internship", label: "Internship" },
    { value: "volunteer", label: "Volunteer" },
];

export const EDUCATION_LEVELS = [
    { value: "high_school", label: "High school" },
    { value: "tvet", label: "TVET" },
    { value: "certificate", label: "Certificate" },
    { value: "diploma", label: "Diploma" },
    { value: "bachelor", label: "Bachelor's (BSc/BA)" },
    { value: "master", label: "Master's (MSc/MA)" },
    { value: "doctorate", label: "Doctorate (PhD)" },
    { value: "other", label: "Other" },
];

export const LANGUAGE_LEVELS = [
    { value: "native", label: "Native" },
    { value: "fluent", label: "Fluent" },
    { value: "professional", label: "Professional working proficiency" },
    { value: "intermediate", label: "Intermediate" },
    { value: "basic", label: "Basic" },
];

export const labelOf = (options, value) => options.find((o) => o.value === value)?.label ?? value;

const order = (label = "Display order") => ({
    name: "order",
    label,
    type: "number",
    default: 0,
    help: "Lower numbers are shown first.",
});

const notCurrent = (values) => !values.current;

const skillsField = (skills, help) => ({
    name: "skills",
    label: "Skills",
    type: "multiselect",
    options: (skills ?? []).map((s) => ({ value: s.id, label: s.name })),
    emptyText: "Add skills on the Skills page first, then link them here.",
    help,
});

export const profileFields = [
    { name: "name", label: "Full name", required: true, autoComplete: "name" },
    { name: "title", label: "Headline", placeholder: "e.g. Backend Developer", help: "Shown under your name." },
    { name: "bio", label: "Short bio", type: "textarea", rows: 3, help: "One or two sentences for the top of your page." },
    { name: "profile_image", label: "Profile photo", type: "image" },
    { name: "location", label: "Location", placeholder: "e.g. Addis Ababa, Ethiopia" },
    { name: "email", label: "Public email", type: "email", autoComplete: "email" },
    { name: "phone", label: "Phone", type: "tel", maxLength: 20, autoComplete: "tel" },
    { name: "website", label: "Website", type: "url", placeholder: "https://" },
    { name: "github", label: "GitHub", type: "url", placeholder: "https://github.com/…" },
    { name: "linkedin", label: "LinkedIn", type: "url", placeholder: "https://linkedin.com/in/…" },
    { name: "telegram", label: "Telegram", type: "url", placeholder: "https://t.me/…" },
    { name: "resume", label: "Resume / CV", type: "file", accept: ".pdf,.doc,.docx", help: "PDF recommended." },
];

export const aboutFields = [
    { name: "heading", label: "Section heading", required: true, placeholder: "About me" },
    { name: "title", label: "Title", required: true, placeholder: "e.g. I build reliable backends" },
    { name: "experience_years", label: "Years of experience", type: "number", default: 0 },
    { name: "description", label: "Description", type: "textarea", required: true, rows: 6 },
    { name: "description_2", label: "Second paragraph", type: "textarea", rows: 4 },
    { name: "cv_file", label: "CV file", type: "file", accept: ".pdf,.doc,.docx" },
    { name: "is_active", label: "Show the about section", type: "checkbox", default: true },
];

export const serviceFields = [
    { name: "title", label: "Service", required: true, maxLength: 100, placeholder: "e.g. API development" },
    { name: "description", label: "Description", type: "textarea", required: true, rows: 3 },
    { name: "display_order", label: "Display order", type: "number", default: 0 },
    { name: "is_active", label: "Visible", type: "checkbox", default: true },
];

export const categoryFields = [
    { name: "name", label: "Name", required: true, maxLength: 100, placeholder: "e.g. Backend" },
    { name: "display_order", label: "Display order", type: "number", default: 0, help: "Lower numbers are shown first." },
    { name: "is_active", label: "Visible", type: "checkbox", default: true },
];

export const skillFields = (categories) => [
    { name: "name", label: "Skill", required: true, maxLength: 100, placeholder: "e.g. Django" },
    {
        name: "category",
        label: "Category",
        type: "select",
        required: true,
        options: (categories ?? []).map((c) => ({ value: c.id, label: c.name })),
    },
    {
        name: "years_of_experience",
        label: "Years of experience",
        type: "number",
        help: "Optional. Shown as “2+ yrs”.",
    },
    { name: "display_order", label: "Display order", type: "number", default: 0 },
    { name: "is_active", label: "Visible", type: "checkbox", default: true },
];

export const projectFields = (skills) => [
    { name: "title", label: "Title", required: true, maxLength: 220 },
    { name: "summary", label: "Summary", required: true, maxLength: 300, wide: true, help: "One line, shown on project cards." },
    { name: "overview", label: "Overview", type: "textarea", required: true, rows: 6, help: "The full story: problem, what you built, results." },
    { name: "thumbnail", label: "Cover image", type: "image" },
    { name: "status", label: "Status", type: "select", required: true, default: "completed", options: PROJECT_STATUS },
    { name: "role", label: "Your role", maxLength: 120, placeholder: "e.g. Solo full-stack" },
    { name: "started_on", label: "Started", type: "date" },
    { name: "live_url", label: "Live URL", type: "url", placeholder: "https://" },
    { name: "github_url", label: "Source code URL", type: "url", placeholder: "https://github.com/…" },
    skillsField(skills, "Each linked skill shows this project as evidence."),
    { name: "featured", label: "Featured", type: "checkbox", help: "Featured projects are shown first on your home page." },
    order(),
    { name: "slug", label: "URL slug", help: "Optional. Generated from the title when empty.", placeholder: "my-project" },
];

export const featureFields = [
    { name: "title", label: "Feature", required: true, maxLength: 200 },
    { name: "description", label: "Description", type: "textarea", rows: 3 },
    { name: "image", label: "Screenshot", type: "image" },
    { name: "demo_url", label: "Demo URL", type: "url" },
    { name: "documentation_url", label: "Docs URL", type: "url" },
    order(),
];

export const challengeFields = [
    { name: "problem", label: "Problem", required: true, maxLength: 300, wide: true },
    { name: "solution", label: "Solution", type: "textarea", required: true, rows: 4 },
    order(),
];

export const lessonFields = [
    { name: "title", label: "Lesson", required: true, maxLength: 200, wide: true },
    { name: "description", label: "Details", type: "textarea", rows: 3 },
    order(),
];

export const galleryFields = [
    { name: "image", label: "Image", type: "image", required: true },
    { name: "caption", label: "Caption", maxLength: 200 },
    order(),
];

export const architectureFields = [
    { name: "description", label: "Description", type: "textarea", rows: 5 },
    { name: "diagram", label: "Diagram", type: "image" },
];

export const experienceFields = (skills) => [
    { name: "position", label: "Position", required: true, placeholder: "e.g. Backend Developer" },
    { name: "company", label: "Company / organization", required: true },
    { name: "employment_type", label: "Type", type: "select", required: true, default: "full_time", options: EMPLOYMENT_TYPES },
    { name: "location", label: "Location", maxLength: 120, placeholder: "e.g. Addis Ababa · Remote" },
    { name: "start_date", label: "Start date", type: "date", required: true },
    { name: "end_date", label: "End date", type: "date", show: notCurrent },
    { name: "current", label: "I currently work here", type: "checkbox" },
    { name: "description", label: "What you did", type: "textarea", rows: 5, help: "One achievement per line works well." },
    skillsField(skills, "Skills you used in this role."),
    { name: "company_logo", label: "Company logo", type: "image" },
];

export const educationFields = [
    { name: "institution", label: "Institution", required: true, placeholder: "e.g. Bahir Dar University" },
    { name: "level", label: "Level", type: "select", required: true, default: "bachelor", options: EDUCATION_LEVELS },
    { name: "field_of_study", label: "Field of study", placeholder: "e.g. Computer Engineering" },
    { name: "grade", label: "Grade", maxLength: 50, placeholder: "e.g. CGPA 3.8/4.0" },
    { name: "start_date", label: "Start date", type: "date" },
    { name: "end_date", label: "End date", type: "date", show: notCurrent },
    { name: "current", label: "I'm studying here now", type: "checkbox" },
    { name: "description", label: "Details", type: "textarea", rows: 3, help: "Thesis, final project, activities, honors." },
    order(),
];

export const certificateFields = (skills) => [
    { name: "name", label: "Certificate", required: true },
    { name: "issuer", label: "Issued by", required: true, placeholder: "e.g. Google, Coursera, ALX" },
    { name: "issue_date", label: "Issue date", type: "date" },
    { name: "expiry_date", label: "Expiry date", type: "date" },
    { name: "credential_id", label: "Credential ID", maxLength: 120 },
    { name: "credential_url", label: "Credential URL", type: "url", placeholder: "https://" },
    { name: "file", label: "Certificate file", type: "file", accept: ".pdf,image/*" },
    skillsField(skills, "Skills this certificate proves."),
    order(),
];

export const languageFields = [
    { name: "name", label: "Language", required: true, maxLength: 60, placeholder: "e.g. Amharic" },
    { name: "proficiency", label: "Proficiency", type: "select", required: true, default: "professional", options: LANGUAGE_LEVELS },
    order(),
];
