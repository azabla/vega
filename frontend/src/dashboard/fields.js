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

export const AVAILABILITY = [
    { value: "open", label: "Open to work" },
    { value: "freelance", label: "Available for freelance" },
    { value: "busy", label: "Busy" },
    { value: "unavailable", label: "Not available" },
];

// Every IANA zone the browser knows, for the time-zone suggestions
const TIME_ZONES = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["Africa/Addis_Ababa"];

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
    { name: "availability", label: "Availability", type: "select", options: AVAILABILITY, emptyLabel: "Don't show", help: "A small status pill at the top of your site." },
    { name: "availability_note", label: "Availability note", maxLength: 120, placeholder: "e.g. Booked until March" },
    {
        name: "timezone",
        label: "Time zone",
        maxLength: 64,
        placeholder: "e.g. Africa/Addis_Ababa",
        suggestions: TIME_ZONES,
        help: "Shows your local time to visitors.",
    },
    { name: "booking_url", label: "Booking link", type: "url", placeholder: "https://calendly.com/…", help: "Adds a “Book a call” button." },
    { name: "currently_learning", label: "Currently learning", maxLength: 200, wide: true, placeholder: "e.g. Rust and distributed systems" },
];

export const aboutFields = [
    { name: "heading", label: "Section heading", required: true, placeholder: "About me" },
    { name: "title", label: "Title", required: true, placeholder: "e.g. I build reliable backends" },
    { name: "experience_years", label: "Years of experience", type: "number", default: 0 },
    { name: "description", label: "Description", type: "textarea", required: true, rows: 6 },
    { name: "description_2", label: "Second paragraph", type: "textarea", rows: 4 },
    { name: "interests", label: "Interests & fun facts", type: "textarea", rows: 4, help: "One per line." },
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
    { name: "overview", label: "Overview", type: "textarea", required: true, rows: 6, help: "The full story in a few paragraphs." },
    { name: "problem", label: "The problem", type: "textarea", rows: 4, help: "What was wrong, and for whom." },
    { name: "results", label: "Results", type: "textarea", rows: 4, help: "What changed. Add the numbers as metrics in the case-study editor." },
    { name: "category", label: "Type", maxLength: 60, placeholder: "e.g. SaaS, API, Website", help: "Used as a filter on your projects page." },
    { name: "thumbnail", label: "Cover image", type: "image" },
    { name: "status", label: "Status", type: "select", required: true, default: "completed", options: PROJECT_STATUS },
    { name: "role", label: "Your role", maxLength: 120, placeholder: "e.g. Solo full-stack" },
    { name: "team_size", label: "Team size", type: "number", min: 1, help: "1 shows as “Solo”." },
    { name: "started_on", label: "Started", type: "date" },
    { name: "ended_on", label: "Finished", type: "date" },
    { name: "live_url", label: "Live URL", type: "url", placeholder: "https://" },
    { name: "github_url", label: "Source code URL", type: "url", placeholder: "https://github.com/…" },
    skillsField(skills, "Each linked skill shows this project as evidence."),
    { name: "featured", label: "Featured", type: "checkbox", help: "Featured projects are shown first on your home page." },
    order(),
    { name: "slug", label: "URL slug", help: "Optional. Generated from the title when empty.", placeholder: "my-project" },
];

export const metricFields = [
    { name: "value", label: "Number", required: true, maxLength: 20, placeholder: "+40%, 3x, 120ms" },
    { name: "label", label: "What it measures", required: true, maxLength: 80, placeholder: "e.g. completed bookings" },
    { name: "description", label: "Context", maxLength: 200, wide: true, placeholder: "e.g. after the new flow shipped" },
    order(),
];

export const testimonialFields = (projects) => [
    { name: "quote", label: "Quote", type: "textarea", required: true, rows: 4 },
    { name: "name", label: "Name", required: true, maxLength: 120 },
    { name: "role", label: "Role", maxLength: 160, placeholder: "e.g. CTO" },
    { name: "company", label: "Company", maxLength: 160 },
    { name: "url", label: "Link to them", type: "url", placeholder: "https://linkedin.com/in/…" },
    {
        name: "project",
        label: "About project",
        type: "select",
        nullable: true,
        emptyLabel: "None",
        options: (projects ?? []).map((p) => ({ value: p.id, label: p.title })),
        help: "Also shown on that project's case study.",
    },
    { name: "photo", label: "Photo", type: "image" },
    order(),
    { name: "is_active", label: "Visible", type: "checkbox", default: true },
];

export const principleFields = [
    { name: "title", label: "Principle", required: true, maxLength: 120, placeholder: "e.g. Ship small, ship often" },
    { name: "description", label: "Details", type: "textarea", rows: 3 },
    order(),
];

export const aboutPhotoFields = [
    { name: "image", label: "Photo", type: "image", required: true },
    { name: "caption", label: "Caption", maxLength: 200 },
    order(),
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
