"""
Portfolio.settings: how a portfolio looks and which parts it shows.

Every key is optional; the frontend fills in the defaults below
(see frontend/src/lib/settings.js, which must stay in sync).

    {
      "theme": "warm",               # minimal | warm | midnight | mono
      "accent": "lime",              # midnight only: lime | violet
      "font": "editorial",           # editorial | modern | classic
      "texture": "default",          # default (per theme) | none | grid | noise
      "mode": "system",              # visitors' first view: system | light | dark
      "hero": "bento",               # bento | classic | minimal
      "projects_layout": "showcase", # showcase | grid | list
      "sections": [                  # home page sections, in order
        {"id": "about", "visible": true}, ...
      ],
      "pages": {"skills": true, ...} # false hides a page and its nav link
    }
"""

from django.core.exceptions import ValidationError

CHOICES = {
    "theme": ["minimal", "warm", "midnight", "mono"],
    "accent": ["lime", "violet"],
    "font": ["editorial", "modern", "classic"],
    "texture": ["default", "none", "grid", "noise"],
    "mode": ["system", "light", "dark"],
    "hero": ["bento", "classic", "minimal"],
    "projects_layout": ["showcase", "grid", "list"],
}
HOME_SECTIONS = ["about", "projects", "experience", "skills", "testimonials", "contact"]
PAGES = ["about", "experience", "projects", "skills", "resume", "contact"]


def validate_settings(value):
    if not isinstance(value, dict):
        raise ValidationError("Settings must be an object.")
    unknown = set(value) - set(CHOICES) - {"sections", "pages"}
    if unknown:
        raise ValidationError(f"Unknown settings: {', '.join(sorted(unknown))}.")

    for key, allowed in CHOICES.items():
        if key in value and value[key] not in allowed:
            raise ValidationError(f"{key} must be one of: {', '.join(allowed)}.")

    sections = value.get("sections", [])
    if not isinstance(sections, list):
        raise ValidationError("sections must be a list.")
    seen = set()
    for item in sections:
        if not isinstance(item, dict) or item.get("id") not in HOME_SECTIONS:
            raise ValidationError(f"Each section needs an id from: {', '.join(HOME_SECTIONS)}.")
        if item["id"] in seen:
            raise ValidationError(f"Section {item['id']} is listed twice.")
        if not isinstance(item.get("visible", True), bool):
            raise ValidationError("Section visible must be true or false.")
        seen.add(item["id"])

    pages = value.get("pages", {})
    if not isinstance(pages, dict) or any(k not in PAGES or not isinstance(v, bool) for k, v in pages.items()):
        raise ValidationError(f"pages maps page names ({', '.join(PAGES)}) to true/false.")
