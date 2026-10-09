# 08 — UI redesign: "The Living Résumé"

A full presentation-layer redesign: four themeable presets, a bento home page, a command palette, case-study project pages, an evidence-based skills page, a printable résumé and new About, Experience and Contact pages. Conventions for future work are in [CLAUDE.md](../CLAUDE.md); this doc records what was built and why.

## Data added (backend)

New fields and models only, so nothing existing changed. They're in migration `0022_design_system_content`.

| Where | Added | Used for |
|---|---|---|
| `Portfolio` | `availability` (open / freelance / busy / unavailable), `availability_note` | Availability pill: "Busy · Booked until March" |
| | `timezone` (IANA name) | Local-time tile on the home page and contact page |
| | `currently_learning`, `booking_url` | Bento tile; "Book a call" link |
| | `settings` (JSON, validated by `site_settings.py`) | Theme, fonts, texture, default mode, hero and project layouts, section order and visibility, page toggles |
| `About` | `interests` (one per line), `Principle` model, `AboutPhoto` model | About page: fun facts, "how I work", photo strip |
| `Project` | `category`, `problem`, `results`, `team_size`, `ended_on`, `ProjectMetric` model | Case study: problem, results with metric cards, team, timeline; category filter |
| new | `Testimonial` (optional link to a project) | Testimonials on home; matching quote on the case study |

APIs:
- **Public:** `GET /api/u/<username>/testimonials/`. The new fields also appear on the profile, about and project endpoints.
- **Owner:** `/api/me/testimonials/`, `/api/me/project-metrics/`, `/api/me/principles/`, `/api/me/about-photos/`.

All of these are editable in the Django admin. Tests are in `DesignContentTests`.

### Seeds

- `vega.json` only got facts: the time zone, the look (Warm + Editorial, bento, showcase) and a category per project. Availability, metrics and testimonials are left for the owner to fill in. Inventing them on a real portfolio would be misleading.
- `demo.json` is a **fictional** persona (Hana Girma, Product Engineer) that uses every feature. It includes stress cases: a 75-character project title, a 90-character company name, a project with 12 skills, no images anywhere, a volunteer role and an internship. Seed it into a throwaway user:

```bash
venv/bin/python manage.py shell -c "from django.contrib.auth import get_user_model as g; g().objects.create_user('sample', 'sample@example.com')"
venv/bin/python manage.py seed_portfolio portfolio/seed/demo.json --owner sample
```

Category skills in a seed can now be `{"name": "Python", "years": 6}` to set years of experience.

## Theming

The palette for each preset:

| Preset | Light: bg / text / accent | Dark: bg / text / accent |
|---|---|---|
| Warm (default) | `#F7F1E8` / `#3B2A20` / `#A84B2A` | `#1C1512` / `#F2E8DD` / `#E58E68` |
| Minimal | `#FFFFFF` / `#111113` / `#2350D8` | `#0B0B0D` / `#EDEDEF` / `#7091FF` |
| Midnight (lime / violet) | `#F4F6FB` / `#0F1630` / lime fill + `#4A6E00` text, or `#6D3FE0` | `#0B1020` / `#E6E9F2` / `#C6F432` or `#A78BFA` |
| Mono | `#FFFFFF` / `#0A0A0A` / `#FF4F00` fill + `#B23700` text | `#0A0A0A` / `#F5F5F5` / `#FF5A1F` |

**Accent fill vs accent text.** Lime and orange look good as fills but aren't readable as text on light backgrounds. So each preset has a separate `--primary-ink` for accent text, icons and the focus ring. Every pair was checked numerically, and then with axe-core on all 9 pages, in all four presets, in light and dark (plus Midnight violet). That found and fixed:
- low-contrast status colours
- avatar initials on too strong a tint
- heading-order gaps
- invalid list markup in the metric cards
- unlabelled loading skeletons

**How the look is chosen.** There are three layers, strongest last:
1. the owner's `settings`
2. a preview from the theme menu (this tab only)
3. the visitor's light/dark choice

`index.html` applies the cached look before first paint, so there's no flash of the wrong theme. A previewed theme brings its own default mode, so Midnight previews in dark.

**Previewing.** Add `?customize` to any portfolio URL to get the preset, accent and font pickers in the palette menu. You can also link to a look directly: `?theme=midnight&accent=violet&font=modern`. Neither changes saved settings. In development the pickers are always shown.

## Pages

| Route (also under `/u/:username`) | Notes |
|---|---|
| `/` | Hero in three layouts (**bento**, classic, minimal), then sections in the owner's order: about, featured projects (showcase / grid / list), experience preview, skills preview, testimonials, contact CTA. Empty sections hide themselves. |
| `/projects` | Search, type chips, tech chips (by usage, "+N more"), grid/list toggle, filtered and empty states |
| `/projects/:slug` | Case study: hero facts (role, timeline + duration, team, status), stack chips, links, cover in a browser frame, sticky "On this page" with the current section highlighted, overview → problem → role → process → features → challenges → results (animated metric cards) → lessons → gallery with lightbox → linked testimonial → next project |
| `/experience` | One timeline for work, education and volunteering, with filters. Logo or initials, duration worked out automatically (whole years for résumé dates stored as 1 Jan – 31 Dec), long highlight lists expand. Certificates and languages in a sticky sidebar. |
| `/skills` | Grouped by category, sorted by evidence. Each card links to the projects that prove the skill, with roles, certificates and years. No progress bars. `#<skill-slug>` anchors are highlighted. |
| `/about` | Title + portrait (monogram fallback), story, what I do, principles, interests, photo strip with lightbox, contact CTA |
| `/resume` | Single column, generated from the same data. "Download PDF" = print → Save as PDF. The print stylesheet forces an ink-friendly palette and A4 margins and hides the site chrome. Offers the uploaded file too, if there is one. |
| `/contact` | Email with copy button, booking card, phone/location/local time, social links, form with a success state |
| anything else | 404 ("This page went on a coffee break") with home and search |

Switching a page off in `settings.pages` removes its nav link, and the route returns the 404 page.

**Global UI:**
- Sticky navbar with a mobile menu sheet.
- Command palette (⌘K / Ctrl K, the navbar button, or the floating button on phones). It covers pages, projects and actions: copy email, résumé, light/dark, theme previews, socials. It's keyboard-only friendly, using the combobox + listbox pattern.
- Theme menu, footer, skip link.
- Per-page `<title>`, description, canonical, Open Graph/Twitter tags, and JSON-LD: `Person` on home and about, `CreativeWork` on projects.

## Performance

- Fonts are self-hosted with `@fontsource`. The browser only downloads the faces and subsets a page actually uses.
- Every page except Home is its own lazily loaded chunk.
- Images are lazy, decoded asynchronously, and sit in fixed-ratio boxes so the layout doesn't shift.
- Motion is CSS-only, apart from the counters.

## Known limits

- **Open Graph tags are set in the browser.** Crawlers that don't run JavaScript (most link-preview bots) only see `index.html`. Proper per-project share images need the server to inject meta tags, which is a backend/nginx task.
- **No dashboard yet.** Settings, availability, testimonials and metrics are edited in the Django admin or through the `/api/me/` endpoints.
- **The blog is not built.** It's left out by decision.

## Checking the UI

Run both servers (see [CLAUDE.md](../CLAUDE.md)) and open:

- `/u/sample` — every feature, fictional data
- `/u/sample?customize` — try the 4 presets × 3 font pairings × light/dark
- `/u/vega` — the real portfolio
- `/u/sample/projects/tena-booking` — the fullest case study
- `/u/sample/resume` → Download PDF
