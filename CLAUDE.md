# Vega — conventions for working in this repo

Vega is a portfolio SaaS. One structured **master profile** per user (Django) drives every page (React).
**Never hardcode personal content in the frontend**: everything comes from the API, and every section must
work for any user, including one with no data. Product direction: [docs/00-product-vision.md](docs/00-product-vision.md).

- `backend/` — Django REST. Public read API `/api/u/<username>/…`, owner API `/api/me/…`.
- `frontend/` — React 19 + Vite + Tailwind v4 (CSS-first config in `src/index.css`) + Base UI primitives + Lucide icons.
- Docs, one per piece of work: [docs/README.md](docs/README.md). The UI system is described in [docs/08-ui-design-system.md](docs/08-ui-design-system.md).

## Running

```bash
cd backend && venv/bin/python manage.py runserver 127.0.0.1:8001     # 8000 is taken locally
cd frontend && VITE_API_URL=http://127.0.0.1:8001/api VITE_PORTFOLIO_USERNAME=vega npx vite --port 5173
venv/bin/python manage.py test portfolio accounts                      # backend tests
npx eslint src && npx vite build                                        # frontend checks
```

Sample data: `seed_portfolio portfolio/seed/vega.json --owner vega` (the owner's real résumé — only add facts to it)
and `portfolio/seed/demo.json --owner sample` (a fictional persona that uses every feature; use it to judge layouts).

## Design system: "The Living Résumé"

Calm, editorial, content-first. Hairline borders instead of shadows, one accent colour, a display serif for headings,
small mono "eyebrow" labels, generous whitespace.

### Theme tokens (`src/index.css`)

`<html data-theme data-accent data-font data-texture class="dark?">` selects the look. Each preset defines only:

| Token | Use |
|---|---|
| `--background`, `--card`, `--foreground`, `--muted-foreground`, `--border` | Page, surfaces, text |
| `--primary` / `--primary-foreground` | Accent as a **fill** (buttons, dots) and the text on it |
| `--primary-ink` | Accent as **text, icons, focus ring** — AA on background and card |

Everything else (`secondary`, `accent` tint, `input`, `ring`, `grid-line`, `glow`) is derived with `color-mix`.
Presets: **warm** (default), **minimal**, **midnight** (+ `data-accent="violet"`), **mono**; each has light and dark.

Rules:
- Use Tailwind token classes: `bg-card`, `text-muted-foreground`, `text-primary-ink`, `bg-accent`, `border`. **Never** raw hex or Tailwind palette colours (`text-emerald-500`) in components.
- Accent text is `text-primary-ink`, never `text-primary` (lime/orange fills fail contrast as text).
- Status colours: `text-success`, `text-warning`, `text-destructive` (AA in light and dark).
- New preset or colour change → re-check contrast (text ≥ 4.5:1, inputs ≥ 3:1) in light and dark, and keep `THEMES` in `src/lib/settings.js` in sync.

### Type, spacing, shape

- Fonts: `font-heading` (display face + its weight/tracking per pairing), `font-sans` body, `font-mono` labels/dates/tags. Pairings: editorial (Instrument Serif + Geist), modern (Space Grotesk + Inter), classic (Fraunces + DM Sans); all fall back to Noto Ethiopic for Amharic.
- Fluid sizes: `text-display` (hero/page titles), `text-h1`, `text-h2` (section titles). Eyebrow: the `eyebrow` utility.
- Layout: `container` (72rem, 16px gutters on phones), `prose-width` (42rem). Sections use `<Section>` (64px → 112px vertical padding).
- Cards: `surface` (rounded-2xl, 1px border, `bg-card`); add `surface-hover` when the whole card is clickable.
- Radius: chips/buttons `rounded-full`, inputs `rounded-xl`, cards `rounded-2xl`.

### Motion

`<Reveal>` for fade-up on scroll, `animate-fade-up` for above-the-fold, `surface-hover` for lift + glow, `<Counter>`
for numbers, `animate-page-in` on route change. Everything collapses under `prefers-reduced-motion` (global rule in `index.css`) — don't add motion that bypasses it.

## Component conventions

- **Primitives** live in `src/components/ui/`: `Button` (`href` turns it into a router/external link), `Section`/`SectionHeader`/`PageHeader`/`Eyebrow`, `Tag`/`TagList` (with "+N"), `StatusBadge`, `Img` (fixed ratio, lazy, fallback), `ProjectCover`/`GeneratedCover`, `Avatar` (initials fallback), `AvailabilityPill`, `EmptyState`, `CopyButton`, `Counter`, `Lightbox`, `Reveal`, `Skeleton`.
- **Data**: use the hooks in `hooks/usePortfolio.js` (`useProjects`, `useSkills`, …) and `useProfile()`. Each endpoint is fetched once per page load and shared. Lists are `null` while loading, then an array.
- **Derived facts** go in `lib/` (`lib/portfolio.js`, `lib/profile.js`, `lib/format.js`), not inside components. Component files export only components (react-refresh lint rule).
- **Every section** renders a skeleton while loading and **returns `null` on the home page when it has no data**; full pages show an `<EmptyState>` instead.
- **Robustness**: long names/titles use `truncate`, `line-clamp-*` or `break-words` + `min-w-0`; tag lists go through `TagList`; images go through `Img` so a missing image never breaks layout.
- **Accessibility**: semantic landmarks and headings in order (h1 per page, sr-only h2 if a list follows directly), visible focus (global `:focus-visible`), keyboard-operable dialogs via Base UI, `aria-pressed` on filter chips. Run axe after UI changes (see docs/08).
- **Icons**: Lucide only. Brand logos (GitHub, LinkedIn, Telegram) come from `lib/profile.js` (`socialLinksOf`) — the only place `react-icons` is used.
- ESLint has no React plugin: a destructured component prop used only in JSX looks unused. Write `const Icon = icon;` or use `<item.icon />`.

## Owner settings (`Portfolio.settings`)

JSON validated by `backend/portfolio/site_settings.py`, resolved with defaults by `src/lib/settings.js` (keep both in sync):
`theme`, `accent`, `font`, `texture`, `mode`, `hero` (bento | classic | minimal), `projects_layout` (showcase | grid | list),
`sections` (home order + visibility), `pages` (switch whole pages off → nav link gone, route 404s).
Read them with `useAppearance()`; never read `profile.settings` directly. Add `?customize` (or `?theme=midnight&font=modern`) to any URL to preview looks without saving.
Owners edit them at `/dashboard/appearance`, which previews the unsaved draft in an iframe via `postMessage` (`PREVIEW_MESSAGE` in `useAppearance.js`); a new setting needs a control there too.
Dashboard and login pages use `useAppLook()` (plain Minimal look, `data-app` on `<html>`), never the owner's look.

## Backend rules

- Additive changes only for presentation needs: new nullable fields/models + migration + public serializer + owner (`/api/me/`) serializer/viewset + admin + seed support + a test.
- Every queryset is scoped to the owner from the URL (`PortfolioOwnerMixin`) or `request.user` (`OwnedViewSet`).
