"""
CV.design and CV.content: how one CV looks and what it shows.

Every key is optional; resolve_design()/resolve_content() fill in the defaults.
frontend/src/lib/cv.js mirrors these choices and must stay in sync.

    design = {
      "accent": "#1f3a5f",        # any #rrggbb; tints and a readable text shade are derived
      "font": "editorial",        # editorial | modern | classic | plain
      "size": "medium",           # small | medium | large
      "spacing": "normal",        # compact | normal | relaxed
      "paper": "a4",              # a4 | letter
      "photo": "profile",         # none | profile (the profile photo) | upload (CV.photo)
      "photo_shape": "circle",    # circle | rounded | square
      "dates": "year",            # year ("2022 – 2024") | month ("Jan 2022 – Mar 2024")
      "skills_style": "list",     # list (by category) | tags
      "qr": true,                 # QR code to the portfolio
      "logos": false,             # company logos next to jobs
      "icons": true,              # small icons next to contact details
    }

    content = {
      "headline": "",             # replaces the profile title on this CV
      "summary": "",              # replaces the about text on this CV
      "sections": [               # order and visibility; custom sections have a body
        {"id": "summary", "visible": true, "title": ""},
        {"id": "custom-a1", "visible": true, "title": "Publications", "body": "- ..."},
      ],
      "items": {"projects": [3, 5]},  # only these entries; a missing key = the default choice
      "hide_contact": ["phone"],
    }

Text fields accept "- bullet" lines, **bold**, *italic* and [links](https://...).
"""

import re

from django.core.exceptions import ValidationError

TEMPLATES = ["classic", "modern", "elegant", "compact", "creative", "timeline", "academic", "minimal", "executive"]

DESIGN_CHOICES = {
    "font": ["editorial", "modern", "classic", "plain"],
    "size": ["small", "medium", "large"],
    "spacing": ["compact", "normal", "relaxed"],
    "paper": ["a4", "letter"],
    "photo": ["none", "profile", "upload"],
    "photo_shape": ["circle", "rounded", "square"],
    "dates": ["year", "month"],
    "skills_style": ["list", "tags"],
}
DESIGN_FLAGS = ["qr", "logos", "icons"]
DEFAULT_DESIGN = {
    "accent": "#1f3a5f",
    "font": "editorial",
    "size": "medium",
    "spacing": "normal",
    "paper": "a4",
    "photo": "profile",
    "photo_shape": "circle",
    "dates": "year",
    "skills_style": "list",
    "qr": True,
    "logos": False,
    "icons": True,
}
HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")

SECTIONS = {
    "summary": "Summary",
    "experience": "Experience",
    "projects": "Selected projects",
    "skills": "Skills",
    "education": "Education",
    "volunteering": "Volunteering",
    "certificates": "Certificates",
    "languages": "Languages",
}
DEFAULT_ORDER = list(SECTIONS)
# Research and student CVs lead with education
TEMPLATE_ORDER = {
    "academic": ["summary", "education", "experience", "projects", "certificates", "skills", "languages", "volunteering"],
}
CUSTOM_ID = re.compile(r"^custom-[a-z0-9]{1,16}$")
MAX_CUSTOM = 10
ITEM_KINDS = ["experience", "projects", "education", "volunteering", "certificates", "skills", "languages"]
CONTACT_FIELDS = ["email", "phone", "location", "github", "linkedin", "telegram", "website"]
LIMITS = {"headline": 220, "summary": 4000, "title": 80, "body": 6000}


def _fail(message):
    raise ValidationError(message)


def validate_design(value):
    if not isinstance(value, dict):
        _fail("Design must be an object.")
    unknown = set(value) - set(DEFAULT_DESIGN)
    if unknown:
        _fail(f"Unknown design options: {', '.join(sorted(unknown))}.")
    for key, allowed in DESIGN_CHOICES.items():
        if key in value and value[key] not in allowed:
            _fail(f"{key} must be one of: {', '.join(allowed)}.")
    for key in DESIGN_FLAGS:
        if key in value and not isinstance(value[key], bool):
            _fail(f"{key} must be true or false.")
    if "accent" in value and not (isinstance(value["accent"], str) and HEX_COLOR.match(value["accent"])):
        _fail("accent must be a colour like #1f3a5f.")


def _text(value, key, limit):
    if not isinstance(value, str) or len(value) > limit:
        _fail(f"{key} must be text of at most {limit} characters.")


def validate_content(value):
    if not isinstance(value, dict):
        _fail("Content must be an object.")
    unknown = set(value) - {"headline", "summary", "sections", "items", "hide_contact"}
    if unknown:
        _fail(f"Unknown content options: {', '.join(sorted(unknown))}.")
    for key in ("headline", "summary"):
        if key in value:
            _text(value[key], key, LIMITS[key])

    sections = value.get("sections", [])
    if not isinstance(sections, list):
        _fail("sections must be a list.")
    seen = set()
    for item in sections:
        if not isinstance(item, dict) or not isinstance(item.get("id"), str):
            _fail("Each section needs an id.")
        sid = item["id"]
        custom = bool(CUSTOM_ID.match(sid))
        if sid not in SECTIONS and not custom:
            _fail(f"Unknown section {sid}.")
        if sid in seen:
            _fail(f"Section {sid} is listed twice.")
        seen.add(sid)
        allowed = {"id", "visible", "title"} | ({"body"} if custom else set())
        if set(item) - allowed:
            _fail(f"Section {sid} has unknown keys.")
        if not isinstance(item.get("visible", True), bool):
            _fail("Section visible must be true or false.")
        _text(item.get("title", ""), "Section title", LIMITS["title"])
        if custom:
            _text(item.get("body", ""), "Section text", LIMITS["body"])
    if sum(1 for s in seen if s.startswith("custom-")) > MAX_CUSTOM:
        _fail(f"At most {MAX_CUSTOM} custom sections.")

    items = value.get("items", {})
    if not isinstance(items, dict) or set(items) - set(ITEM_KINDS):
        _fail(f"items maps {', '.join(ITEM_KINDS)} to lists of ids.")
    for ids in items.values():
        if not isinstance(ids, list) or len(ids) > 200 or not all(isinstance(i, int) and not isinstance(i, bool) for i in ids):
            _fail("items lists must contain ids.")

    hidden = value.get("hide_contact", [])
    if not isinstance(hidden, list) or any(h not in CONTACT_FIELDS for h in hidden):
        _fail(f"hide_contact lists fields from: {', '.join(CONTACT_FIELDS)}.")


def resolve_design(design):
    return {**DEFAULT_DESIGN, **(design or {})}


def resolve_sections(template, sections):
    """Saved order with every built-in section present (new ones appended, visible)."""
    sections = [dict(s) for s in (sections or [])]
    listed = {s["id"] for s in sections}
    if not sections:
        sections = [{"id": sid} for sid in TEMPLATE_ORDER.get(template, DEFAULT_ORDER)]
    else:
        sections += [{"id": sid} for sid in DEFAULT_ORDER if sid not in listed]
    for s in sections:
        s.setdefault("visible", True)
        s.setdefault("title", "")
    return sections
