# 06 — Frontend redesign & seed data

## Seed data: `seed_portfolio`

`backend/portfolio/seed/vega.json` describes my real projects. It was written from each repo's code, dependencies and git history (start dates come from the first commit). It covers the profile, the about section and services, skills grouped by category, and 9 projects with features, architecture, challenges and lessons.

```bash
cd backend
venv/bin/python manage.py seed_portfolio portfolio/seed/vega.json --owner vega          # update in place
venv/bin/python manage.py seed_portfolio portfolio/seed/vega.json --owner vega --reset  # wipe content first
```

| Section | Behaviour |
|---------|-----------|
| `profile`, `about` | Updated in place (fields not in the file are left alone, e.g. phone) |
| `categories[].skills` | Matched by name, case-insensitive; created if missing |
| `projects` | Matched by `slug`. Features, challenges, lessons and architecture are **replaced** with the file's version. Projects not in the file are kept. |
| `experience`, `education`, `certificates` | Replaced only when the file contains the key |

Running it twice gives the same result (tested in `SeedPortfolioTests`). To change the content, edit the JSON and re-run.

New project fields used by the seed and the UI: **`status`** (completed / in progress / archived), **`role`** and **`started_on`**. Projects are ordered featured first, then by `order`.

> Experience and education are not in the seed because I don't have reliable data for them. Add them in the admin (or in the JSON) and they appear automatically.

## Design system

Everything is driven by CSS variables in `src/index.css`, with light values on `:root` and dark values on `.dark`, mapped to Tailwind colors in `@theme inline`:

| Token | Use |
|-------|-----|
| `background`, `foreground` | Page |
| `card`, `border` | Surfaces (`surface` utility: rounded-2xl + hairline border + soft shadow) |
| `muted`, `muted-foreground`, `secondary` | Quiet backgrounds and secondary text |
| `primary`, `accent` | Teal brand color and its soft tint (icons, highlights) |
| `ring`, `input` | Focus rings and form fields |
| `glow`, `grid-line` | Hero background effects |

Typography: **Geist** for UI and the system monospace for eyebrows and code. Utilities: `container` (72rem), `surface`, `surface-hover`, `bg-grid`, `text-gradient`.

**Theme:** `index.html` applies the saved theme (or the system preference) before first paint, so there is no flash. `useTheme()` toggles it and saves it to `localStorage`.

**Motion:** `<Reveal>` fades content in once when it scrolls into view. Hero content uses `animate-fade-up`. Everything is disabled under `prefers-reduced-motion`.

## Components

| Component | Notes |
|-----------|-------|
| `ui/Section`, `SectionHeader` | Consistent spacing, eyebrow, title, description, optional action |
| `ui/Tag`, `StatusBadge` | Skill chips; status badge colors per project status |
| `ui/ProjectCover` | Uses the thumbnail, otherwise a generated gradient cover (stable hue per title, kept in the theme's teal→violet range) with the project's initials |
| `ui/Reveal` | Scroll-reveal wrapper |
| `Navbar` | Sticky, blurs on scroll, highlights the section in view (`useActiveSection`), mobile menu, theme toggle |
| `hero/HeroSection` | Name, title, bio, buttons, socials, stats (projects, skills, first project year). Shows `profile_image` if set, otherwise a code-style `ProfileCard` listing the skills with the most evidence. |
| `SkillsSection` | Skills grouped by category with evidence counts. Selecting one opens an evidence panel linking to projects, roles and certificates. |
| `ProjectCard` | Whole card is clickable. Status, year, top 4 skills (+N), source/live links. |
| `pages/ProjectDetail` | Cover, sticky sidebar (role, start date, stack, "on this page"), problem/solution cards, previous/next project |
| `pages/ProjectArchive` | Search, status filter, skill filter (sorted by usage), empty state |

Every data section has a **skeleton** matching its layout while loading. Sections with no data hide themselves (experience, education, about).

## Data fetching

`usePortfolioData(fetcher, ...args)` caches per page load: each endpoint is requested once and shared, so the navbar, hero, contact and footer use a single profile request. Results are available instantly when you navigate back to a page.

## Checking the UI

Run both servers (see [README](README.md)) and open:

- `/u/vega` — home page (light/dark via the toggle)
- `/u/vega/projects` — archive
- `/u/vega/projects/ethiopia-classifieds-marketplace` — a case study
