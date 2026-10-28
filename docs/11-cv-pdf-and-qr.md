# 11 — CV PDF and QR code

Roadmap step 3, first slice: a real PDF generated from the master profile, plus a QR code that opens the portfolio.

Before this, `/resume` only had a "Download PDF" button that opened the browser's print dialog. That doesn't give you a link you can send, it's awkward on phones, and how it looks depends on the browser.

## What's new

| Where | What |
|---|---|
| `GET /api/u/<username>/cv.pdf` | The CV as an A4 PDF, built when it's requested. `?download=1` sends it as an attachment named `<name>-cv.pdf`. Returns 404 when the owner has switched the Résumé page off. Throttled to 20/minute per visitor (`cv` scope), because rendering takes about 0.5 s. |
| `GET /api/u/<username>/qr.svg`, `qr.png` | QR code that opens `SITE_URL/u/<username>`: black on white, so it scans on dark screens too. `?download=1` sends it as an attachment. |
| `/resume` | "Download PDF" now gets the server PDF. "Print" keeps the old browser print. |
| Dashboard overview | The "Your portfolio" card adds a **CV (PDF)** button and the QR code with PNG/SVG downloads. |

## How the PDF is made

- `portfolio/cv.py` collects the same content as `Resume.jsx`: summary, work experience, up to 4 featured projects (or the first 4 when none is featured), skills grouped by category, education, volunteering, certificates and languages. Empty sections are left out, so a brand-new account still gets a valid one-page PDF.
- `templates/cv/classic.html` is rendered by **WeasyPrint** (HTML/CSS → PDF). It is one column of real, selectable text in reading order, so ATS parsers can read it. The QR code sits top right, with the name and "Page x of y" in the footer.
- **Fonts are bundled** in `portfolio/cv_fonts/` (woff2, SIL OFL, licences next to the files) and follow the owner's font pairing (editorial/modern/classic). Noto Sans Ethiopic covers Amharic. The PDF never depends on the fonts installed on the server.
- The renderer may only load those fonts and `data:` URIs (`_FontsOnlyFetcher`). Profile text can't make it read local files or fetch URLs.
- QR codes come from **segno** (pure Python).

## Setup

- `SITE_URL`: the public frontend origin, used for the QR/CV link. Production compose sets it to `https://${DOMAIN}`; local `.env.example` uses `http://localhost:5173`. When empty, the API's own host is used.
- The backend image installs Pango/HarfBuzz (`libpango-1.0-0 libpangoft2-1.0-0 libharfbuzz-subset0`) and `fonts-dejavu-core` as a last-resort glyph fallback. Locally you need Pango (it's preinstalled on most Linux desktops; `brew install pango` on macOS).

## Next

> Templates and owner controls have since been built: see [12 — CV builder](12-cv-builder.md).

- More templates: academic (publications, research first) and a one-page variant, with a `?template=` switch.
- Owner controls: pick which projects, sections and order go on the CV; job-specific versions.
- Amharic CV (needs Amharic section labels and content).
- Cache the PDF until the profile changes.
