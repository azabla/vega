import { Award, BadgeCheck, BriefcaseBusiness, FolderKanban, GraduationCap, Languages, Sparkles, UserRound } from "lucide-react";
import { ACHIEVEMENT_KINDS, EDUCATION_LEVELS, EMPLOYMENT_TYPES, LANGUAGE_LEVELS } from "@/dashboard/fields";

export const IMPORT_API = "/me/portfolio-import/";
export const MAX_CV_SIZE = 5 * 1024 * 1024;
export const MAX_RECORDS = 20;
export const MAX_SKILLS = 60;

export const PROFILE_IMPORT_FIELDS = [
  { name: "name", label: "Full name", maxLength: 220 },
  { name: "title", label: "Headline", maxLength: 220 },
  { name: "bio", label: "Bio", type: "textarea", rows: 4, maxLength: 4000 },
  { name: "location", label: "Public location", maxLength: 100, placeholder: "City or region" },
];

const start = { name: "start_date", label: "Start date", type: "date" };
const end = { name: "end_date", label: "End date", type: "date", show: (values) => !values.current };
const description = { name: "description", label: "Description", type: "textarea", rows: 4, maxLength: 4000 };

export const IMPORT_GROUPS = [
  {
    key: "projects", label: "Projects", singular: "project", icon: FolderKanban, href: "/dashboard/projects",
    fields: [
      { name: "title", label: "Project title", required: true, maxLength: 220 },
      { name: "role", label: "Your role", maxLength: 120 },
      description,
      { name: "live_url", label: "Live link", type: "url", maxLength: 200, placeholder: "https://" },
      { name: "github_url", label: "Repository link", type: "url", maxLength: 200, placeholder: "https://" },
      { name: "skills", label: "Skills used", type: "textarea", rows: 2, maxLength: 3030, help: "One per line. Vega links skills already on your portfolio or included in this import." },
    ],
  },
  {
    key: "experience", label: "Experience", singular: "experience", icon: BriefcaseBusiness, href: "/dashboard/experience",
    fields: [
      { name: "position", label: "Role", required: true, maxLength: 220 },
      { name: "company", label: "Organization", required: true, maxLength: 220 },
      { name: "employment_type", label: "Employment type", type: "select", options: EMPLOYMENT_TYPES, required: true },
      { name: "location", label: "Location", maxLength: 120 },
      { ...start, required: true, help: "Use a verified date. You can leave this entry out if the CV gives only a month or year." }, end,
      { name: "current", label: "I currently work here", type: "checkbox" },
      description,
    ],
  },
  {
    key: "education", label: "Education", singular: "education entry", icon: GraduationCap, href: "/dashboard/education",
    fields: [
      { name: "institution", label: "Institution", required: true, maxLength: 220 },
      { name: "level", label: "Qualification", type: "select", options: EDUCATION_LEVELS, required: true, default: "other" },
      { name: "field_of_study", label: "Field of study", maxLength: 220 },
      { name: "grade", label: "Grade or GPA", maxLength: 50 },
      start, end,
      { name: "current", label: "I currently study here", type: "checkbox" },
      description,
    ],
  },
  { key: "skills", label: "Skills", singular: "skill", icon: Sparkles, href: "/dashboard/skills", fields: [] },
  {
    key: "certificates", label: "Certificates", singular: "certificate", icon: BadgeCheck, href: "/dashboard/certificates",
    fields: [
      { name: "name", label: "Certificate name", required: true, maxLength: 220 },
      { name: "issuer", label: "Issuer", required: true, maxLength: 220 },
      { name: "issue_date", label: "Issue date", type: "date" },
      { name: "expiry_date", label: "Expiry date", type: "date" },
      { name: "credential_url", label: "Verification link", type: "url", maxLength: 200, placeholder: "https://", wide: true },
    ],
  },
  {
    key: "languages", label: "Languages", singular: "language", icon: Languages, href: "/dashboard/languages",
    fields: [
      { name: "name", label: "Language", required: true, maxLength: 60 },
      { name: "proficiency", label: "Proficiency", required: true, type: "select", options: LANGUAGE_LEVELS },
    ],
  },
  {
    key: "achievements", label: "Achievements", singular: "achievement", icon: Award, href: "/dashboard/achievements",
    fields: [
      { name: "title", label: "Title", required: true, maxLength: 300 },
      { name: "kind", label: "Type", type: "select", options: ACHIEVEMENT_KINDS, required: true, default: "other" },
      { name: "issuer", label: "Issuer or venue", maxLength: 220 },
      { name: "date", label: "Date", type: "date" },
      { name: "authors", label: "Authors", maxLength: 300, wide: true },
      { name: "url", label: "Public link", type: "url", maxLength: 200, placeholder: "https://", wide: true },
      description,
    ],
  },
];

export const REVIEW_SECTIONS = [
  { key: "profile", label: "Profile", icon: UserRound },
  ...IMPORT_GROUPS,
];

export const importNames = (text) => [...new Set(text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean))];

export const newImportRow = (group, values = {}, id = globalThis.crypto.randomUUID()) => ({
  id,
  included: true,
  values: Object.fromEntries(group.fields.map((field) => [
    field.name,
    (field.name === "skills" ? values.skills?.join("\n") : values[field.name]) ?? field.default ?? (field.type === "checkbox" ? false : ""),
  ])),
});

export const prepareImportReview = (proposal, profile, username) => ({
  profile: Object.fromEntries(PROFILE_IMPORT_FIELDS.map(({ name }) => {
    const value = proposal[name] ?? "";
    const current = profile[name] ?? "";
    const placeholder = name === "name" && current === username;
    return [name, { value, included: Boolean(value.trim()) && (!current.trim() || placeholder) }];
  })),
  entries: Object.fromEntries(IMPORT_GROUPS.map((group) => [
    group.key,
    (proposal[group.key] ?? []).map((entry, index) => group.key === "skills"
      ? { id: `skill-${index}`, included: true, values: { name: entry } }
      : newImportRow(group, entry, `${group.key}-${index}`)),
  ])),
});

const isWebUrl = (value) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
};

export const entryErrors = (group, values) => {
  const errors = {};
  if (group.key === "skills") {
    return !values.name.trim() || values.name.trim().length > 100 ? { name: "Use a skill name between 1 and 100 characters." } : errors;
  }
  for (const field of group.fields) {
    const value = values[field.name];
    if (field.required && !String(value ?? "").trim()) errors[field.name] = `Add ${field.label.toLowerCase()}.`;
    if (field.type === "url" && value && !isWebUrl(value.trim())) errors[field.name] = "Use a full https:// or http:// address.";
  }
  if (values.start_date && values.end_date && values.end_date < values.start_date) {
    errors.end_date = "End date must follow the start date.";
  }
  if (values.issue_date && values.expiry_date && values.expiry_date < values.issue_date) {
    errors.expiry_date = "Expiry date must follow the issue date.";
  }
  if (typeof values.skills === "string" && importNames(values.skills).some((name, index) => index >= 30 || name.length > 100)) {
    errors.skills = "Enter up to 30 skill names, each up to 100 characters.";
  }
  return errors;
};

export const groupSummary = (group, rows) => {
  const ready = rows.filter((row) => Object.keys(entryErrors(group, row.values)).length === 0);
  return { total: rows.length, ready: ready.length, selected: ready.filter((row) => row.included).length };
};

export const profileChanges = (review, current) => PROFILE_IMPORT_FIELDS.filter(({ name }) => {
  const entry = review.profile[name];
  const value = entry.value.trim();
  return entry.included && value && value !== (current[name] ?? "").trim();
});

export const importPayload = (review, current) => {
  const changed = new Set(profileChanges(review, current).map(({ name }) => name));
  const payload = Object.fromEntries(PROFILE_IMPORT_FIELDS.map(({ name }) => [name, changed.has(name) ? review.profile[name].value.trim() : ""]));
  payload.expected_profile = Object.fromEntries([...changed].map((name) => [name, current[name] ?? ""]));
  for (const group of IMPORT_GROUPS) {
    const rows = review.entries[group.key].filter((row) => row.included && !Object.keys(entryErrors(group, row.values)).length);
    payload[group.key] = rows.map(({ values }) => group.key === "skills"
      ? values.name.trim()
      : Object.fromEntries(group.fields.map((field) => {
        const value = values[field.name];
        if (field.name === "skills") return [field.name, importNames(value)];
        if (field.type === "date") return [field.name, value || null];
        return [field.name, typeof value === "string" ? value.trim() : value];
      })),
    );
  }
  return payload;
};
