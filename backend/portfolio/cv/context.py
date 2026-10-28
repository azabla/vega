"""
Profile + one CV's choices → everything a CV template needs.

Sections without content are dropped, so any template works for an empty profile.
"""

import base64
import re
from io import BytesIO

from django.utils.dateformat import format as format_date
from PIL import Image, ImageOps, UnidentifiedImageError

from ..cv_options import SECTIONS, resolve_design, resolve_sections
from ..models import About, Experience, Project, Skill
from ..professions import profession_of, section_title
from . import style
from .icons import icon
from .text import plain_inline, rich

FEATURED_PROJECTS = 4
# Sections that move to the sidebar in two-column templates
SIDEBAR_TEMPLATES = {"modern", "executive"}
SIDEBAR_SECTIONS = {"skills", "languages", "certificates"}


def bare_url(url):
    return re.sub(r"^https?://(www\.)?", "", url).rstrip("/")


def image_data_uri(field_file, max_px):
    """A stored image as a small data: URI, or None when it is missing or unreadable."""
    if not field_file:
        return None
    try:
        with field_file.open("rb") as f:
            image = ImageOps.exif_transpose(Image.open(f))
            image.thumbnail((max_px, max_px))
            has_alpha = image.mode in ("RGBA", "LA", "P")
            image = image.convert("RGBA" if has_alpha else "RGB")
            buffer = BytesIO()
            image.save(buffer, "PNG" if has_alpha else "JPEG", quality=88)
    except (OSError, ValueError, UnidentifiedImageError):
        return None
    mime = "image/png" if has_alpha else "image/jpeg"
    return f"data:{mime};base64,{base64.b64encode(buffer.getvalue()).decode()}"


def date_range(start, end, current=False, months=False):
    """ "2022 – Present" or "Jan 2022 – Mar 2024"; same years collapse to one."""

    def fmt(d):
        return format_date(d, "M Y") if months else str(d.year)

    first = fmt(start) if start else ""
    last = "Present" if current else (fmt(end) if end else "")
    if first and last and first != last:
        return f"{first} – {last}"
    return first or last


def pick(items, kind, objects, default=None):
    """The entries chosen for this CV, in profile order; `default` decides when nothing was chosen."""
    ids = items.get(kind)
    if ids is None:
        return default(objects) if default else objects
    chosen = set(ids)
    return [o for o in objects if o.pk in chosen]


def contact_items(portfolio, hidden):
    phone = portfolio.phone
    items = [
        ("email", portfolio.email, f"mailto:{portfolio.email}"),
        ("phone", phone, "tel:" + re.sub(r"\s", "", phone)),
        ("location", portfolio.location, None),
        ("website", portfolio.website, portfolio.website),
        ("github", portfolio.github, portfolio.github),
        ("linkedin", portfolio.linkedin, portfolio.linkedin),
        ("telegram", portfolio.telegram, portfolio.telegram),
    ]
    return [
        {
            "kind": kind,
            "label": bare_url(value) if href and href.startswith("http") else value,
            "href": href,
            "icon": icon(kind),
        }
        for kind, value, href in items
        if value and kind not in hidden
    ]


def build_context(portfolio, cv, url, qr_uri):
    owner = portfolio.owner
    design = resolve_design(cv.design)
    content = cv.content or {}
    items = content.get("items", {})
    months = design["dates"] == "month"

    def job(j):
        return {
            "title": j.position,
            "org": ", ".join(filter(None, [j.company, j.location])),
            "when": date_range(j.start_date, j.end_date, j.current, months),
            "body": rich(j.description),
            "logo": image_data_uri(j.company_logo, 120) if design["logos"] else None,
        }

    jobs = list(Experience.objects.filter(owner=owner))
    volunteer = Experience.EmploymentType.VOLUNTEER
    work = pick(items, "experience", [j for j in jobs if j.employment_type != volunteer])
    volunteering = pick(items, "volunteering", [j for j in jobs if j.employment_type == volunteer])

    projects = pick(
        items,
        "projects",
        list(Project.objects.filter(owner=owner).prefetch_related("skills")),
        default=lambda ps: ([p for p in ps if p.featured] or ps)[:FEATURED_PROJECTS],
    )

    skills = pick(
        items,
        "skills",
        list(
            Skill.objects.filter(owner=owner, is_active=True)
            .select_related("category")
            .order_by("category__display_order", "display_order")
        ),
    )
    skill_groups = {}
    for skill in skills:
        skill_groups.setdefault(skill.category.name, []).append(skill.name)

    about = About.objects.filter(owner=owner, is_active=True).order_by("-updated_at").first()
    summary = content.get("summary") or (about and about.description) or portfolio.bio

    data = {
        "summary": rich(summary),
        "experience": [job(j) for j in work],
        "volunteering": [job(j) for j in volunteering],
        "projects": [
            {
                "title": p.title,
                "org": p.role,
                "when": date_range(p.started_on, p.ended_on, False, months),
                "body": rich(p.summary),
                "skills": [s.name for s in p.skills.all()],
                "link": p.live_url or p.github_url,
                "link_label": bare_url(p.live_url or p.github_url),
            }
            for p in projects
        ],
        "skills": {"groups": skill_groups, "all": [s.name for s in skills]} if skills else None,
        "education": [
            {
                "title": ", ".join(filter(None, [e.get_level_display(), e.field_of_study])),
                "org": e.institution,
                "when": date_range(e.start_date, e.end_date, e.current, months),
                "body": rich("\n\n".join(filter(None, [e.grade, e.description]))),
            }
            for e in pick(items, "education", list(owner.education.all()))
        ],
        "certificates": [
            {
                "name": c.name,
                "issuer": c.issuer,
                "when": format_date(c.issue_date, "M Y") if c.issue_date else "",
                "link": c.credential_url,
            }
            for c in pick(items, "certificates", list(owner.certificates.all()))
        ],
        "achievements": [
            {
                "title": a.title,
                "org": a.issuer,
                "when": format_date(a.date, "M Y" if months else "Y") if a.date else "",
                "authors": a.authors,
                "body": rich(a.description),
                "link": a.url,
                "link_label": bare_url(a.url),
            }
            for a in pick(items, "achievements", list(owner.achievements.all()))
        ],
        "languages": [
            {"name": lang.name, "level": lang.get_proficiency_display()}
            for lang in pick(items, "languages", list(owner.languages.all()))
        ],
    }

    profession = profession_of(portfolio)
    sections = []
    for s in resolve_sections(cv.template, content.get("sections")):
        if not s["visible"]:
            continue
        sid = s["id"]
        if sid in SECTIONS:
            if not data[sid]:
                continue
            kind, body = sid, data[sid]
            title = s["title"] or section_title(profession, sid, SECTIONS[sid])
        else:
            body = rich(s.get("body", ""))
            if not body:
                continue
            kind, title = "custom", s["title"] or "More"
        sections.append({"id": sid, "kind": kind, "title": title, "data": body, "partial": f"cv/sections/{kind}.html"})

    sidebar = cv.template in SIDEBAR_TEMPLATES
    photo_field = {"profile": portfolio.profile_image, "upload": cv.photo}.get(design["photo"])

    return {
        "template": cv.template,
        "design": design,
        "name": portfolio.name,
        "headline": plain_inline(content.get("headline") or portfolio.title),
        "contact": contact_items(portfolio, set(content.get("hide_contact", []))),
        "photo": image_data_uri(photo_field, 600),
        "sections": sections,
        "main_sections": [s for s in sections if not (sidebar and s["kind"] in SIDEBAR_SECTIONS)],
        "side_sections": [s for s in sections if sidebar and s["kind"] in SIDEBAR_SECTIONS],
        "url": url,
        "url_label": bare_url(url),
        "qr": qr_uri if design["qr"] else None,
        "colors": style.palette(design["accent"]),
        "m": style.metrics(design),
        "fonts": style.fonts(design),
        "paper": style.PAPER[design["paper"]],
    }
