"""
The CV as a PDF, generated from the master profile: /api/u/<username>/cv.pdf

Same content as the /resume page (frontend/src/pages/Resume.jsx), rendered on
the server with WeasyPrint, so it has a stable link that works on any phone,
real selectable text that ATS parsers can read, and a QR code back to the
portfolio. Fonts are bundled in cv_fonts/ (SIL OFL) so the output never depends
on what is installed on the server.
"""

import re
from collections import OrderedDict
from io import BytesIO
from pathlib import Path

import segno
from django.conf import settings
from django.template.loader import render_to_string
from weasyprint import HTML
from weasyprint.urls import URLFetcher, URLFetchingError

from .models import About, Experience, Project, Skill

FONTS_DIR = Path(__file__).resolve().parent / "cv_fonts"
FONTS_URI = FONTS_DIR.as_uri() + "/"

# Heading face, its weight and tracking, and body face per settings["font"].
# Mirrors [data-font] in frontend/src/index.css; Ethiopic falls back to Noto.
FONT_PAIRINGS = {
    "editorial": ("instrument-serif-latin-400-normal.woff2", 400, "-0.01em", "geist-latin-wght-normal.woff2"),
    "modern": ("space-grotesk-latin-wght-normal.woff2", 600, "-0.035em", "inter-latin-wght-normal.woff2"),
    "classic": ("fraunces-latin-wght-normal.woff2", 500, "-0.02em", "dm-sans-latin-wght-normal.woff2"),
}

# Same rule as bulletsOf() in frontend/src/lib/format.js
BULLET = re.compile(r"^\s*(?:[•·▪◦‣*-]|\d+[.)])\s+")
FEATURED_PROJECTS = 4


class _FontsOnlyFetcher(URLFetcher):
    """The CV may load its bundled fonts and data: URIs (the QR code), nothing else."""

    def fetch(self, url, headers=None):
        if not (url.startswith("data:") or (url.startswith(FONTS_URI) and ".." not in url)):
            raise URLFetchingError(f"The CV may not load {url}")
        return super().fetch(url, headers)


def portfolio_url(request, username):
    """Public portfolio link: SITE_URL in production, the API's own host otherwise."""
    base = settings.SITE_URL or request.build_absolute_uri("/")
    return f"{base.rstrip('/')}/u/{username}"


def bare_url(url):
    return re.sub(r"^https?://(www\.)?", "", url).rstrip("/")


def qr_code(url):
    return segno.make(url, error="m")


def qr_bytes(url, kind):
    buffer = BytesIO()
    qr_code(url).save(buffer, kind=kind, scale=10 if kind == "png" else 4, border=2, dark="#111111", light="#ffffff")
    return buffer.getvalue()


def text_block(text):
    """{"bullets": [...]} for "• Did X" lines, {"text": ...} for a paragraph, None when empty."""
    lines = [line.strip() for line in (text or "").split("\n") if line.strip()]
    if not lines:
        return None
    if len(lines) >= 2 and all(BULLET.match(line) for line in lines):
        return {"bullets": [BULLET.sub("", line) for line in lines]}
    return {"text": "\n".join(lines)}


def year_range(start, end, current=False):
    """ "2022 – 2024", "2025 – Present"; same as formatYearRange() in the frontend."""
    first = start.year if start else None
    last = "Present" if current else (end.year if end else None)
    if first and last and first != last:
        return f"{first} – {last}"
    return str(first or last or "")


def _job(job):
    org = ", ".join(filter(None, [job.company, job.location]))
    return {
        "title": job.position,
        "org": org,
        "when": year_range(job.start_date, job.end_date, job.current),
        "body": text_block(job.description),
    }


def cv_context(portfolio, url):
    owner = portfolio.owner
    about = About.objects.filter(owner=owner, is_active=True).order_by("-updated_at").first()

    jobs = list(Experience.objects.filter(owner=owner))
    work = [_job(j) for j in jobs if j.employment_type != Experience.EmploymentType.VOLUNTEER]
    volunteering = [_job(j) for j in jobs if j.employment_type == Experience.EmploymentType.VOLUNTEER]

    projects = list(Project.objects.filter(owner=owner).prefetch_related("skills"))
    projects = ([p for p in projects if p.featured] or projects)[:FEATURED_PROJECTS]

    skills = OrderedDict()
    for skill in (
        Skill.objects.filter(owner=owner, is_active=True)
        .select_related("category")
        .order_by("category__display_order", "display_order")
    ):
        skills.setdefault(skill.category.name, []).append(skill.name)

    links = [portfolio.github, portfolio.linkedin, portfolio.telegram, portfolio.website]
    contact = [
        portfolio.email and {"label": portfolio.email, "href": f"mailto:{portfolio.email}"},
        portfolio.phone and {"label": portfolio.phone, "href": "tel:" + re.sub(r"\s", "", portfolio.phone)},
        portfolio.location and {"label": portfolio.location},
        *({"label": bare_url(link), "href": link} for link in links if link),
    ]

    heading_font, heading_weight, heading_tracking, body_font = FONT_PAIRINGS.get(
        portfolio.settings.get("font"), FONT_PAIRINGS["editorial"]
    )

    return {
        "profile": portfolio,
        "contact": [c for c in contact if c],
        "summary": (about and about.description) or portfolio.bio,
        "work": work,
        "projects": [
            {
                "title": p.title,
                "org": p.role,
                "when": year_range(p.started_on, p.ended_on),
                "summary": p.summary,
                "skills": " · ".join(s.name for s in p.skills.all()),
            }
            for p in projects
        ],
        "skills": skills,
        "education": [
            {
                "title": ", ".join(filter(None, [e.get_level_display(), e.field_of_study])),
                "org": e.institution,
                "when": year_range(e.start_date, e.end_date, e.current),
                "body": text_block(" · ".join(filter(None, [e.grade, e.description]))),
            }
            for e in owner.education.all()
        ],
        "volunteering": volunteering,
        "certificates": owner.certificates.all(),
        "languages": owner.languages.all(),
        "url": url,
        "url_label": bare_url(url),
        "qr": qr_code(url).svg_data_uri(dark="#111111", border=0),
        "fonts": {
            "heading": heading_font,
            "heading_weight": heading_weight,
            "heading_tracking": heading_tracking,
            "body": body_font,
        },
    }


def render_cv_pdf(portfolio, url):
    html = render_to_string("cv/classic.html", cv_context(portfolio, url))
    return HTML(string=html, base_url=FONTS_URI, url_fetcher=_FontsOnlyFetcher()).write_pdf()
