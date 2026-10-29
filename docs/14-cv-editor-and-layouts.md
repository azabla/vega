# 14 — CV editor: rich text, layouts on any template, click-to-edit

Builds on [12](12-cv-builder.md). The goal is to make CVs easy to customise in depth: real formatting, a choice of layout for every template, per-section and per-entry control, and a preview you can click.

## What owners can do now

| Area | |
|---|---|
| **Rich text** | Summary, custom sections and entry rewrites use a WYSIWYG editor with bold, italic, bullet lists, links and clear formatting (TipTap). It only offers what the PDF renders, and it stores the same light markup as before, so the backend stays the only place HTML is made. |
| **Rewrite an entry for one CV** | Any job, volunteering role, project, education entry or award can get its own title and text on one CV (e.g. shorter bullets for a one-page CV). The profile and other CVs keep the original. Rewritten entries are marked, and "Use the profile text" resets them. |
| **Layout on any template** | Columns: as the template draws them, one column, or a sidebar on the left or right. Sidebar width (narrow, normal, wide) and colour (tinted, dark, white with a hairline). Section-title style (small caps, ruled, underlined, side bar, filled, large serif). Name and contact block left-aligned or centred. Page margins. |
| **Per section** | Main column or sidebar, two columns (good for skills and languages), start on a new page. Drag the grip to reorder; the arrow buttons still work for keyboard and touch users. |
| **Click to edit** | Hovering the preview outlines each section. A click opens the Content tab with that section expanded and scrolled into view; the header opens the Header panel. |
| **Undo / redo** | Buttons in the save bar, plus Ctrl/⌘+Z and Ctrl/⌘+Shift+Z (or Ctrl+Y) outside text fields. Typing in one field, or dragging the colour picker, counts as one step. |
| **Editor tabs** | Design (template, colour & type, photo), Layout, Content (header, sections, details), Settings (name & sharing). |
| **Two new templates** | **Cards** (a tinted page with each section on a white rounded card) and **Swiss** (heavy accent rule, large name, numbered section titles in a left column). 11 templates in all. |

## How it works

```
backend/portfolio/
  cv_options.py               design: layout, sidebar_width, sidebar_style, header_align, heading_style, margins
                              content.sections[]: column, columns, break; content.overrides
  cv/context.py               sidebar(): where the sidebar goes and how it looks; entry rewrites; section placement
  cv/render.py                render_cv_document() + regions(): where each section sits on each page
  templates/cv/base.html      draws the body (one column, or sidebar + main) and the layout options
  templates/cv/templates/*    each template now only styles, plus its one-column header ({% block header %})
frontend/src/
  dashboard/pages/CVEditorPage.jsx          the editor (lazy-loaded: TipTap only downloads here)
  dashboard/components/RichTextEditor.jsx   TipTap, restricted to the CV markup
  dashboard/lib/richtext.js                 markup ↔ editor HTML/JSON
  dashboard/components/cv/                  SectionList (drag, options, rewrites), LayoutPanel, CvPreview, pickers
  dashboard/lib/useHistory.js               undo/redo for the draft
```

- **Layouts are generic.** The sidebar used to be hard-coded in Modern and Executive. Now `base.html` draws it for any template: a float plus a full-height `@page` gradient, mirrored for the right side. Modern and Executive only set the default (`TEMPLATE_SIDEBAR`). The layout CSS comes after the template's own CSS, so the owner's choices win, and it resets the template's section-level tricks (Compact and Timeline gutters) inside the sidebar.
- **Heading styles** only restyle main-column titles (`.sec-in-main`), so sidebar titles stay small and readable on dark fills.
- **Click-to-edit regions.** Sections are marked `id="cv-<section id>"`. `regions()` walks WeasyPrint's laid-out boxes for those elements and returns their union per page as fractions. The preview endpoint now returns `regions` next to `pages`, and the editor positions buttons over the page images from them. This uses WeasyPrint's `page._page_box`, which is internal, but the version is pinned and `test_preview_marks_where_each_section_is` covers it.
- **The editor stores markup, not HTML.** `docToMarkup` writes `- ` bullets, `**bold**`, `*italic*` and `[label](https://…)`, keeping the markers tight against the text so they always parse back. Pasted rich text is reduced to what the CV supports.

## Checks

- **Backend tests.** 4 new (`CVLayoutTests`), 59 in total:
  - every template × three layout combinations
  - validation of the new options
  - sidebar placement and entry rewrites in the context
  - preview regions
- **Contact sheet.** I rendered a contact sheet of 15 template/layout combinations, including a left dark sidebar on Classic, a right white sidebar on Elegant, a centred header on Creative and two-column skills.
- **Browser run:**
  - Switched to a right dark sidebar with side-bar titles.
  - Clicked Experience in the preview; the Content tab opened with it expanded.
  - Rewrote the first job with bold text and saved. The override was stored and appears in the PDF.
  - Moved skills to the main column in two columns.
  - Dragged Languages above Education, then undid it with Ctrl+Z.
  - No horizontal scroll at 390px.
- **axe-core.** 0 violations on all four editor tabs (with the rich editor and a rewrite open), in light and dark mode.

## Next

- Section-level font/size overrides and custom colours for the sidebar text
- Saved "styles" an owner can reuse across CVs
- English/Amharic content (roadmap step 4)
