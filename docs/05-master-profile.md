# 05 — Master profile v1

The first step toward the [product vision](00-product-vision.md): the portfolio's data is now a structured professional profile, and skills are backed by evidence.

## Data model changes

| Change | Why |
|--------|-----|
| **`Technology` merged into `Skill`** | They described the same thing twice. Projects, experience and certificates now all link to one skill list. |
| `Project.skills`, `Experience.skills`, `Certificate.skills` | Each link is evidence for the skill |
| `Skill.years_of_experience` (optional) | Shown as "2+ yrs" |
| **`Education`** (new) | Institution, `level` (High school, **TVET**, Certificate, **Diploma**, Bachelor's, Master's, PhD, Other), field of study, dates, grade (e.g. CGPA), description |
| **`Certificate`** (new) | Name, issuer, issue/expiry dates, credential ID/URL, uploaded file, skills |
| `Experience` | `comap_logo` renamed to **`company_logo`**. Added `employment_type` (Full-time, Part-time, Contract, Freelance, **Internship**, **Volunteer**) and `location`. `description` has no 220-character limit any more. Current jobs are listed first. |

### Migrations

| Migration | What it does |
|-----------|--------------|
| `0015_rename_experience_comap_logo` | Renames the field and keeps existing logos |
| `0016_master_profile_…` | New fields and the `Education` and `Certificate` models |
| `0017_copy_technologies_to_skills` | Each technology becomes a skill (reusing a skill with the same name, case-insensitive) and project links are copied |
| `0018_remove_technology` | Drops `Technology` and `Project.technologies` |

`import_portfolio` still accepts old exports: `technology` rows become skills, and `technologies` / `comap_logo` fields are mapped to their new names.

## API changes

**Public** (`/api/u/<username>/`):

| Endpoint | Change |
|----------|--------|
| `skills/` | Each skill now includes `years_of_experience` and `evidence: {projects: [{title, slug}], experience: [{position, company}], certificates: [{name, issuer}]}` |
| `projects/…` | `technologies` → **`skills`** |
| `experience/` | Adds `employment_type`, `employment_type_display`, `location`, `skills`, `company_logo` |
| `education/` | **New.** Includes `level_display`. |
| `certificates/` | **New.** Includes `skills`. |

**Owner** (`/api/me/`): `technologies/` is removed. Use `skills/` and send `skills: [ids]` on projects, experience and certificates. New: `education/` and `certificates/` (CRUD). Linking another user's skill returns `400`.

## Frontend

| Area | What's new |
|------|-----------|
| Skills | Cards show evidence ("3 projects · 1 job · 2+ yrs"). Click a card to list the projects (links to case studies), jobs and certificates. |
| Experience | New timeline section: role, company, dates, type, location, skills |
| Education & Certifications | New section. Hidden when empty. |
| Projects | Shared `ProjectCard`. "View Case Study" opens the project page. "View Project Archive" opens the archive. Shows an icon when there's no thumbnail (the old placeholder service no longer exists). |
| `/projects` and `/projects/:slug` (also under `/u/:username/`) | **New pages:** an archive with search and skill filter, and a case study with overview, features, architecture, challenges, lessons and gallery |
| Navbar and footer | Show the profile's name instead of the template's "PedroTech". The Experience link was added. Navbar scroll detection is fixed (`scrollY`, not `screenY`). |
| About | Hidden when the owner has no about section (it used to show "Loading…" forever) |
| `usePortfolioData(fetcher, ...args)` | Shared fetch hook: `{data, loading, error}` for the current username |

## Filling in your portfolio

Use the admin (`/admin/`) or the owner API. The suggested order, since later items link to earlier ones:

1. Profile and About (+ services)
2. Categories → Skills
3. Experience, Education, Certificates (attach skills)
4. Projects (attach skills), then features, challenges, lessons, architecture and gallery images

The `demo` account in the local database is filled with sample data. Open `/u/demo` to see every section.
