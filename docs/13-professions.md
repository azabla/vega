# 13 — Professions and awards & publications

Roadmap step 4, part one. A portfolio built for a developer doesn't fit a photographer or a researcher. Owners now pick a **profession**, and a new **Awards & publications** record holds the evidence many professions lead with.

## Profession (`settings.profession`)

Owners choose one at the top of `/dashboard/appearance`: General, Developer, Designer, Architect, Photographer / artist, Student / graduate or Researcher / academic. Choosing one:

| | What changes |
|---|---|
| Words | Projects nav link and headings (e.g. *Research* / *Research projects*, *Portfolio* / *Selected work*), the awards section title (*Publications & awards*, *Exhibitions & awards*…) |
| Home page | A suggested section order and visibility, hero and projects layout. These go into the unsaved draft, so the owner sees them in the preview and can still change everything before saving |
| CV | The suggested template for a new CV (Researcher → Academic, Designer → Creative…), and default titles for the projects and awards sections |

General keeps today's defaults exactly, so existing portfolios look the same until their owner picks a profession.

| Profession | Projects called | Awards called | Home starts with | CV |
|---|---|---|---|---|
| General | Work / Projects | Awards & publications | About, projects | Classic |
| Developer | Work / Projects | Awards & talks | About, projects | Modern |
| Designer | Work / Selected work | Awards & features | Projects (grid), minimal hero | Creative |
| Architect | Projects | Awards & competitions | Projects, about, experience | Elegant |
| Photographer / artist | Portfolio / Selected work | Exhibitions & awards | Projects (grid); experience and skills hidden | Creative |
| Student / graduate | Projects | Awards & activities | About, **education**, projects | Classic |
| Researcher / academic | Research / Research projects | Publications & awards | About, publications, research (list) | Academic |

Code: `frontend/src/lib/professions.js` (labels, presets, CV titles) and `backend/portfolio/professions.py` (the CV section titles; keep both in sync).

## Awards & publications (`Achievement`)

One model for awards, publications, exhibitions, talks, grants/scholarships and "other": title, kind, issuer ("from / where"), authors (publications), date, link, details and an optional image.

| Where | |
|---|---|
| `GET /api/u/<username>/achievements/`, `/api/me/achievements/` | Public list; owner CRUD |
| `/dashboard/achievements` | "Awards & publications" in the Work group |
| Portfolio | Home section (latest 4), `/achievements` page grouped by kind. The nav link only appears once the owner has at least one entry. Page can be switched off under Appearance → Pages |
| Résumé page and CV | New `achievements` CV section, with entries picked one by one like jobs; the Academic template puts it after education |

## Education on the home page

New `education` home section (the latest three, as a timeline). It is hidden by default and turned on by the Student preset.

## Checks

- 4 new backend tests (`ProfessionTests`), 55 in total: owner API and scoping, settings validation, CV section and profession titles, seed.
- Browser run: switching to Researcher reorders the home page, renames the nav (Research, Publications), and suggests Academic for a new CV. No horizontal scroll at 390px. axe-core: 0 violations on home, `/achievements`, `/resume`, the dashboard Awards page and Appearance, in light and dark.
- Demo persona (`demo.json`) is a Developer with an award, a talk and a publication.

## Next

- English/Amharic content (step 4, part two)
- Profession-specific fields where a record type isn't enough (e.g. a photographer's camera/client per image)
