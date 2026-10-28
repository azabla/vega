// CV versions: templates and options. Mirrors backend/portfolio/cv_options.py — keep both in sync.

const thumbnails = import.meta.glob("@/assets/cv-templates/*.webp", { eager: true, import: "default" });
const thumbnailOf = (id) => Object.entries(thumbnails).find(([path]) => path.endsWith(`/${id}.webp`))?.[1];

export const CV_TEMPLATES = [
    { id: "classic", name: "Classic", hint: "One column, ATS-friendly" },
    { id: "modern", name: "Modern", hint: "Tinted sidebar with photo and skills" },
    { id: "elegant", name: "Elegant", hint: "Centred, refined, serif titles" },
    { id: "compact", name: "Compact", hint: "Dense; fits the most on a page" },
    { id: "creative", name: "Creative", hint: "Bold colour band with photo" },
    { id: "timeline", name: "Timeline", hint: "Dates on a vertical line" },
    { id: "academic", name: "Academic", hint: "Formal; education first" },
    { id: "minimal", name: "Minimal", hint: "Lots of white space" },
    { id: "executive", name: "Executive", hint: "Dark sidebar, strong headings" },
].map((t) => ({ ...t, thumbnail: thumbnailOf(t.id) }));

export const templateOf = (id) => CV_TEMPLATES.find((t) => t.id === id) ?? CV_TEMPLATES[0];

// Suggested accents; any colour works (the PDF derives readable shades)
export const CV_ACCENTS = [
    { name: "Navy", color: "#1f3a5f" },
    { name: "Teal", color: "#0f766e" },
    { name: "Blue", color: "#1d4ed8" },
    { name: "Violet", color: "#6d28d9" },
    { name: "Plum", color: "#86198f" },
    { name: "Rust", color: "#c2410c" },
    { name: "Brick", color: "#7c2d12" },
    { name: "Gold", color: "#b45309" },
    { name: "Forest", color: "#166534" },
    { name: "Graphite", color: "#1f2937" },
];

export const CV_FONTS = [
    { id: "editorial", name: "Editorial", sample: "Instrument Serif + Geist", family: '"Instrument Serif", serif' },
    { id: "modern", name: "Modern", sample: "Space Grotesk + Inter", family: '"Space Grotesk Variable", sans-serif' },
    { id: "classic", name: "Classic", sample: "Fraunces + DM Sans", family: '"Fraunces Variable", serif' },
    { id: "plain", name: "Plain", sample: "Inter only, safest for ATS", family: '"Inter Variable", sans-serif' },
];

export const CV_OPTIONS = {
    size: [
        { id: "small", name: "Small" },
        { id: "medium", name: "Medium" },
        { id: "large", name: "Large" },
    ],
    spacing: [
        { id: "compact", name: "Compact" },
        { id: "normal", name: "Normal" },
        { id: "relaxed", name: "Relaxed" },
    ],
    paper: [
        { id: "a4", name: "A4" },
        { id: "letter", name: "US Letter" },
    ],
    photo: [
        { id: "profile", name: "Profile photo" },
        { id: "upload", name: "Another photo" },
        { id: "none", name: "No photo" },
    ],
    photo_shape: [
        { id: "circle", name: "Circle" },
        { id: "rounded", name: "Rounded" },
        { id: "square", name: "Square" },
    ],
    dates: [
        { id: "year", name: "2022 – 2024" },
        { id: "month", name: "Jan 2022 – Mar 2024" },
    ],
    skills_style: [
        { id: "list", name: "By category" },
        { id: "tags", name: "Tags" },
    ],
};

export const CV_FLAGS = [
    { id: "qr", label: "QR code to your portfolio" },
    { id: "icons", label: "Icons next to contact details" },
    { id: "logos", label: "Company logos next to jobs" },
];

export const DEFAULT_DESIGN = {
    accent: "#1f3a5f",
    font: "editorial",
    size: "medium",
    spacing: "normal",
    paper: "a4",
    photo: "profile",
    photo_shape: "circle",
    dates: "year",
    skills_style: "list",
    qr: true,
    logos: false,
    icons: true,
};

export const resolveDesign = (design) => ({ ...DEFAULT_DESIGN, ...(design ?? {}) });

export const CV_SECTIONS = {
    summary: "Summary",
    experience: "Experience",
    projects: "Selected projects",
    skills: "Skills",
    education: "Education",
    volunteering: "Volunteering",
    certificates: "Certificates",
    achievements: "Awards & publications",
    languages: "Languages",
};
const DEFAULT_ORDER = Object.keys(CV_SECTIONS);
const TEMPLATE_ORDER = {
    academic: ["summary", "education", "achievements", "experience", "projects", "certificates", "skills", "languages", "volunteering"],
};
export const MAX_CUSTOM_SECTIONS = 10;

export const isCustomSection = (id) => id.startsWith("custom-");

/** Saved order with every built-in section present; same rule as resolve_sections() in Python. */
export const resolveSections = (template, sections) => {
    if (!sections?.length) return (TEMPLATE_ORDER[template] ?? DEFAULT_ORDER).map((id) => ({ id, visible: true, title: "" }));
    const listed = new Set(sections.map((s) => s.id));
    return [...sections, ...DEFAULT_ORDER.filter((id) => !listed.has(id)).map((id) => ({ id }))].map((s) => ({
        visible: true,
        title: "",
        ...s,
    }));
};

export const newCustomSectionId = () => `custom-${Math.random().toString(36).slice(2, 10)}`;

// Sections whose entries can be picked one by one: section id → how to list the owner's records
export const CV_ITEM_SOURCES = {
    experience: { endpoint: "/me/experience/", filter: (j) => j.employment_type !== "volunteer", label: (j) => `${j.position} · ${j.company}` },
    volunteering: { endpoint: "/me/experience/", filter: (j) => j.employment_type === "volunteer", label: (j) => `${j.position} · ${j.company}` },
    projects: { endpoint: "/me/projects/", label: (p) => p.title, featuredByDefault: true },
    education: { endpoint: "/me/education/", label: (e) => [e.field_of_study, e.institution].filter(Boolean).join(" · ") },
    certificates: { endpoint: "/me/certificates/", label: (c) => c.name },
    achievements: { endpoint: "/me/achievements/", label: (a) => [a.title, a.issuer].filter(Boolean).join(" · ") },
    skills: { endpoint: "/me/skills/", filter: (s) => s.is_active !== false, label: (s) => s.name },
    languages: { endpoint: "/me/languages/", label: (l) => l.name },
};

// Entries shown when nothing was picked: projects → featured (or the first 4), others → all
export const defaultItemIds = (kind, records) => {
    if (!CV_ITEM_SOURCES[kind].featuredByDefault) return records.map((r) => r.id);
    const featured = records.filter((r) => r.featured);
    return (featured.length ? featured : records).slice(0, 4).map((r) => r.id);
};

export const CONTACT_FIELDS = [
    { id: "email", label: "Email" },
    { id: "phone", label: "Phone" },
    { id: "location", label: "Location" },
    { id: "website", label: "Website" },
    { id: "github", label: "GitHub" },
    { id: "linkedin", label: "LinkedIn" },
    { id: "telegram", label: "Telegram" },
];

export const FORMATTING_HINT = "Start lines with “- ” for bullets. **bold**, *italic*, [link](https://…)";
