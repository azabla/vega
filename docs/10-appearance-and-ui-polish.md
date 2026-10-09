# 10 — Appearance settings and UI polish

Branch `frontend/ui-improve`. Two goals: finish wiring the design system from [08-ui-design-system](08-ui-design-system.md) into the live site, and let owners choose their look from the dashboard.

## What was wrong

Only half of the design system had reached `main`. The new pages and home sections were there, but nothing routed to them, and the shared building blocks were still the older versions:
- routes, `Home`, `Navbar`, `Footer`, `PortfolioLayout`
- `Button`, `Tag`, `Section`, `ProjectCard`, `ProjectCover`, `lib/format`
- `index.css` and the `index.html` pre-paint script

So the live site showed the old one-page layout. Its skill "evidence" rows also overflowed the card on phones.

## Restored and rebuilt

| Area | Now |
|---|---|
| `index.css` | Four presets (Warm, Minimal, Midnight + violet accent, Mono) in light and dark. `--primary` is the accent as a fill and `--primary-ink` the accent as text; the other tokens are derived with `color-mix`. Also: success/warning colours, three font pairings, grid and paper-grain textures, and the `font-heading`, `text-display/h1/h2`, `eyebrow`, `prose-width`, `link-underline`, `scrollbar-none` and `animate-page-in` utilities. Motion is off under `prefers-reduced-motion`. |
| Fonts | Self-hosted with `@fontsource`: Instrument Serif, Geist, Space Grotesk, Inter, Fraunces, DM Sans, plus Noto Sans Ethiopic for Amharic. |
| `index.html` | Applies the cached look (theme, accent, font, texture, light/dark) before React loads, so there's no flash. Dashboard and login pages get the plain app look (`data-app`). |
| Routes | `/`, `/projects`, `/projects/:slug`, `/experience`, `/skills`, `/about`, `/resume`, `/contact`, each also under `/u/:username`. Each page is lazily loaded, and a page the owner switched off returns the 404 page (`PageGate`). |
| Home | The hero in the owner's layout (bento, classic, minimal), then the sections in the owner's order. Hidden or empty sections don't render. |
| Navbar | Page links, search (⌘K command palette), theme menu, contact button, and a full-screen menu on phones. |
| Primitives | `Button href`, `TagList` ("+N"), `PageHeader`, `Eyebrow`, `ProjectShowcase`/`ProjectRow`/`ProjectCard`, `GeneratedCover`, format helpers (`formatDuration`, `bulletsOf`, `initialsOf`, …) |
| Projects page | Search by name or skill, type chips, skill chips (top 8, then "+N more"), grid/list toggle, and clear filtered and empty states |
| Case study | Big title, facts strip (role, timeline + duration, team, status), cover in a browser frame, numbered sections, sticky "On this page" on desktop: overview → problem → what I built → architecture → challenges → results (animated metrics) → lessons → gallery (lightbox) → linked testimonial → next project |
| Skills page | Each skill is a compact row ("5 projects · 1 role") that opens to list its evidence. On a phone the page went from about 12,600px to 5,300px, and nothing overflows. |
| 404 | "This page went on a coffee break", with Home and Search |

Old components that nothing uses any more were deleted: `*Section.jsx`, `hero/*`, `useTheme`, `useActiveSection`.

## Dashboard: Appearance (`/dashboard/appearance`)

Owners choose:
- theme and accent
- fonts
- hero layout and project layout (with small wireframes)
- the order and visibility of home sections
- which pages are switched on
- the background texture
- whether first-time visitors see light, dark or their device's setting

**Live preview.** The page embeds the real portfolio in an iframe. Each change is posted to it as a draft (`postMessage`, same origin only, type `vega:appearance-draft`). `useAppearance` inside the iframe treats the draft as the owner's settings. Visitors see nothing until **Save**, which sends `PATCH /api/me/profile/ {settings}`.

**Preview controls.** The preview has phone and desktop sizes (the desktop one is scaled to fit) and a light/dark toggle.

**Saving.** A sticky save bar shows when there are unsaved changes, with Discard and Save. The browser warns before leaving with unsaved changes. "Restore the default look" sets the defaults back.

**Phones.** Settings and Preview are tabs.

The overview checklist has a new step, "Choose your look".

### New content in the dashboard

These fields and models were already in the backend (0022) but couldn't be edited outside the admin:

| Page | Added |
|---|---|
| Profile | Availability + note, time zone (with suggestions), booking link, currently learning |
| About | Interests; "How I work" principles; photo strip |
| Projects | Type (category), problem, results, team size, finished date; **Results in numbers** (metrics) in the case-study editor |
| Testimonials (new) | Quote, name, role, company, link, photo, optional project (also shown on that case study) |

## Checks

- `npx eslint src` and `npx vite build` pass. The backend didn't change; its tests pass.
- **Playwright:**
  - Every public page at 390px in light and dark: no horizontal page scroll.
  - Appearance flow: the preview follows theme, accent, font, hero, project layout, section order and visibility, pages and light/dark before saving. After saving, the public site uses the look, a switched-off page leaves the menu and returns 404, and the look is applied before first paint. Discard works.
  - New editors: a testimonial and a metric show on the case study; availability and the local-time tile show on the home page.
  - The dashboard flow from [08](08-dashboard.md) still passes.
- **axe-core** (WCAG 2 A/AA + best practice): no violations on all 8 public pages in Warm/light, Midnight/dark, Mono/light and Minimal/dark.

## Not done

- Drag-and-drop for sections (the up/down buttons are keyboard- and touch-friendly)
- Custom accent colours. Presets keep every pair AA-checked; a free colour picker would need a contrast check before saving.
- Server-rendered Open Graph tags (see 08's known limits)
