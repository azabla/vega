# 12 — CV builder: versions, templates, design and content

Builds on [11](11-cv-pdf-and-qr.md), which added one fixed CV PDF. Owners can now make as many **CV versions** as they need (for example "General", "Backend roles" or "Scholarship"). Each version picks a template, a design and what goes on it, and they edit it at `/dashboard/cv` with a live preview.

The content still comes from the master profile. A version only **chooses, orders and overrides**, so fixing a job description once fixes it on every CV.

## What an owner can change

| Area | Options |
|---|---|
| Template | 9 layouts: **Classic** (one column, ATS-friendly), **Modern** (tinted sidebar), **Elegant** (centred, serif titles), **Compact** (titles in a left column, fits most on a page), **Creative** (full-width colour band with photo), **Timeline** (dates on a vertical line), **Academic** (formal, education first), **Minimal** (lots of white space), **Executive** (dark sidebar) |
| Colour & type | Any accent colour (10 suggestions + a colour picker); font pairing (Editorial, Modern, Classic, Plain/Inter); text size; spacing; A4 or US Letter |
| Photo | Profile photo, a photo uploaded just for this CV, or none; circle, rounded or square |
| Header | A headline for this CV only; which contact details show |
| Sections | Reorder, rename, hide; choose entries one by one (jobs, projects, education, certificates, volunteering, skills, languages); a summary for this CV only; up to 10 custom sections (publications, awards, references…) |
| Details | Year or month dates; skills by category or as tags; QR code, contact icons, company logos on/off |
| Sharing | Use on my portfolio (the default, always public); anyone with the link (public) or only me (private) |

Text fields accept `- ` bullets, `**bold**`, `*italic*` and `[label](https://…)` links. Everything is escaped first (`portfolio/cv/text.py`), so the only tags in the output are the ones the converter adds.

## API

| Endpoint | |
|---|---|
| `GET/POST /api/me/cvs/`, `GET/PATCH/DELETE /api/me/cvs/<id>/` | The owner's versions. `design`/`content` are validated (`cv_options.py`); `photo` uploads as multipart. The first CV becomes the default. Deleting the default promotes another. |
| `POST /api/me/cvs/<id>/duplicate/` | Copy a version (not the default; same photo) |
| `GET /api/me/cvs/<id>/pdf/` | Download any version, private ones included |
| `POST /api/me/cvs/preview/` | `{id?, template, design, content}` → `{pages: [WebP data URIs], page_count}`. Renders the real PDF and rasterises up to 6 pages with pdfium, so the preview is exact on any device. Throttled to 60/minute (`cv_preview`). |
| `GET /api/u/<username>/cv.pdf` | The default version, or the built-in Classic when the owner has none (as before) |
| `GET /api/u/<username>/cv/<slug>.pdf` | A public version; 404 for private ones |
| `GET /api/u/<username>/cvs/` | Public versions `[{name, slug, template, is_default, updated_at}]`. The Résumé page lists them as "Other versions". |

## Code

```
backend/portfolio/
  cv_options.py           what design/content may contain + defaults (mirrored by frontend/src/lib/cv.js)
  models.py               CV (owner, name, slug, template, design, content, photo, is_default, is_public)
  cv/context.py           profile + one CV → template context (sections, contact, photo, colours)
  cv/style.py             accent → readable shades (contrast-checked), sizes, font pairing
  cv/text.py, icons.py    safe rich text; Lucide contact icons
  cv/render.py            WeasyPrint PDF, pdfium preview pages, QR codes
  templates/cv/base.html  shared CSS; partials/ (contact, photo, QR, section loop); sections/ (one per kind)
  templates/cv/templates/<name>.html   one per template: its CSS and header layout
frontend/src/
  lib/cv.js                         templates, options, section rules
  dashboard/pages/CVPages.jsx       list + editor
  dashboard/lib/useCvPreview.js     debounced live preview
  assets/cv-templates/*.webp        gallery thumbnails (render_cv_thumbnails)
```

How the templates are built:
- WeasyPrint has no `color-mix()`, so `style.py` computes every shade. Accent text is darkened until it reaches 4.5:1 on white, and sidebar fills until they reach 7:1 with white text. Any accent colour stays readable.
- Sidebars are a full-height `@page` background (`linear-gradient` with a hard stop, `no-repeat`, `border-box`) plus a floated `<aside>`. Floats split across pages; CSS grid and flex do not, so section-level layouts (Compact, Timeline) use absolute positioning instead.
- Images (photos, company logos) are read from the owner's own uploads, resized with Pillow and embedded as `data:` URIs. The renderer still loads nothing but the bundled fonts and `data:` URIs.
- Italic body faces are bundled too (Geist, Inter, DM Sans).

Adding a template:
1. Add its id to `TEMPLATES` in `cv_options.py` and to `CV_TEMPLATES` in `lib/cv.js`.
2. Create `templates/cv/templates/<id>.html`, extending `cv/base.html`.
3. Add a migration for the new choice.
4. Run `python manage.py render_cv_thumbnails --owner sample --out ../frontend/src/assets/cv-templates`.

`test_every_template_renders_for_an_empty_profile` covers the new template automatically.

## Seed data

`portfolio/seed/demo.json` now has four versions for the demo persona: General (Modern, default), Product roles (Creative, with a custom "Recognition" section and a renamed section), Academic (private, with a "Research" section) and One page (Compact). `seed_portfolio` replaces a user's CVs when the file has a `cvs` key.

## Checks

- 12 new backend tests (`CVVersionTests`), 51 in total: every template with an empty profile, validation, default switching, private vs public links, duplicating, preview, content choices, rich-text escaping, photo upload, seed.
- The editor was driven in a headless browser on desktop and phone (template/accent change, custom section, save + reload). No horizontal scroll at 390px.
- axe-core: 0 violations on the CV list, the New CV dialog and the editor, in light and dark.

## Next

- Drag-and-drop ordering and entry-level edits (e.g. shorter bullets for one CV)
- Amharic section labels / a bilingual CV
- Cache rendered PDFs until the profile or the CV changes
