# 16 — More looks, one-click styles and a guided start

The aim: portfolios that are easy to make your own, and a first visit that ends with something worth sharing.

## For owners

| Where | What's new |
|---|---|
| **Appearance → Start from a style** | 8 ready-made looks set theme, accent, fonts, top of page, project layout, corners, cards and navigation in one click: Editorial, Studio, Night shift, Gallery, Botanical, Blush, Scholar, Neon. **Surprise me** picks a random look with a random accent. Everything stays adjustable below, and nothing is public until you save. |
| **Accent colour, any theme** | 11 suggested colours or any colour from the picker; "theme's own" keeps the preset. Text in the accent is darkened (light mode) or lightened (dark mode) until it reaches 4.5:1 on the page and cards. Button text switches between black and white, whichever reads better. |
| **2 new themes** | **Sage** (calm greens) and **Rose** (blush paper), each with a dark mode. AA contrast checked. |
| **2 new font pairings** | **Bold** (Bricolage Grotesque + Inter) and **Elegant** (Playfair Display + Manrope). Amharic still falls back to Noto Ethiopic. |
| **Shape & style** | Corners: theme default, sharp, soft or round. Cards: outline, elevated (soft shadows) or filled (tinted, no borders). Navigation: full-width bar or a floating rounded bar. |
| **2 new tops of page** | **Split**: text beside a tall portrait, with the featured project pinned to it. **Statement**: the name in oversized type, then a slow ribbon of top skills (it stops under reduced motion). |
| **Guided setup** `/dashboard/welcome` | New accounts land here after signup, in four steps: (1) profession, (2) name, headline, location, bio and photo, (3) pick a style, (4) your live link with open and copy buttons, plus next steps (add a job, a project, a CV). Each step saves as you go and can be skipped. The overview offers the setup while the profile has no headline. |

## Code

```
frontend/src/
  lib/settings.js        THEMES (+ each theme's page/card colours), ACCENT_COLORS, FONTS, RADII, SURFACES, NAV_STYLES, HEROES
  lib/colors.js          accentTokens(): a custom accent → --primary, --primary-foreground, --primary-ink per mode
  lib/stylePresets.js    STYLE_PRESETS, presetOf(), surpriseLook()
  hooks/useAppearance.js applies data-radius, data-surface and the accent tokens (inline CSS variables)
  index.html             applies the cached look before first paint, now including those, and per host for
                         portfolios at the root of a subdomain or custom domain
  index.css              sage/rose tokens, bold/elegant pairings, [data-radius], [data-surface]
  components/home/HeroSplit.jsx, HeroStatement.jsx; Navbar (floating)
  dashboard/pages/AppearancePage.jsx (styles, accent, shape & style), WelcomePage.jsx
backend/portfolio/site_settings.py   validates theme, font, hero, accent_color, radius, surface, nav
```

- **Accent tokens are computed in JavaScript**, not in CSS, because `color-mix` can't guarantee a contrast ratio. The cached look stores both the light and the dark token sets, so the first paint is already correct.
- **Card style** rules are unlayered CSS on `[data-surface] .surface`, so they win over the `surface` utility without touching components.
- **Registration lands on `/dashboard/welcome`** (`GuestOnly fallback`); `?next=` still wins.

## Checks

- **Backend.** The settings test now covers the new keys and rejects bad values (colour format, unknown corner, card, nav or hero). 67 tests in total.
- **Contrast.** 180 combinations (6 themes × 2 modes × 15 accents, including pure yellow, white, black and grey) all pass. The worst accent text is 4.5:1, and the worst button text 4.7:1.
- **Browser runs:**
  - Each style applied from the Appearance page and saved, then the portfolio checked.
  - A new account through signup and all four setup steps, ending on a live Sage portfolio with the uploaded photo.
- **axe-core.** 0 violations on Appearance, the guided setup, and portfolios in Statement, Split and custom-accent looks, in light and dark mode.

## Next

- Section-level backgrounds (e.g. a tinted band for Experience)
- Let owners save their own style to reuse it, and share styles between CVs and the site
