"""
Portfolio.settings: how a portfolio looks and which parts it shows.

Every key is optional; the frontend fills in the defaults below
(see frontend/src/lib/settings.js, which must stay in sync).

    {
      "theme": "warm",               # minimal | warm | midnight | mono | sage | rose
      "accent": "lime",              # midnight only: lime | violet
      "accent_color": "",            # any theme: "" (the theme's own) or "#rrggbb"
      "font": "editorial",           # editorial | modern | classic | bold | elegant
      "texture": "default",          # default (per theme) | none | grid | noise
      "mode": "system",              # visitors' first view: system | light | dark
      "hero": "bento",               # bento | classic | minimal | split | statement
      "radius": "default",           # default (per theme) | sharp | soft | round
      "surface": "outline",          # cards: outline | elevated | filled
      "nav": "bar",                  # bar | floating
      "projects_layout": "showcase", # showcase | grid | list
      "profession": "general",       # general | developer | designer | architect | photographer | student | researcher
      "sections": [                  # home page sections, in order
        {"id": "about", "visible": true}, ...
      ],
      "pages": {"skills": true, ...} # false hides a page and its nav link
    }
"""

import re

from django.core.exceptions import ValidationError

from .professions import PROFESSIONS

CHOICES = {
    "theme": ["minimal", "warm", "midnight", "mono", "sage", "rose"],
    "accent": ["lime", "violet"],
    "font": ["editorial", "modern", "classic", "bold", "elegant"],
    "texture": ["default", "none", "grid", "noise"],
    "mode": ["system", "light", "dark"],
    "hero": ["bento", "classic", "minimal", "split", "statement"],
    "radius": ["default", "sharp", "soft", "round"],
    "surface": ["outline", "elevated", "filled"],
    "nav": ["bar", "floating"],
    "projects_layout": ["showcase", "grid", "list"],
    "profession": list(PROFESSIONS),
}
HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")
HOME_SECTIONS = ["about", "projects", "experience", "education", "skills", "achievements", "testimonials", "contact"]
PAGES = ["about", "experience", "projects", "skills", "achievements", "resume", "contact"]


def validate_settings(value):
    if not isinstance(value, dict):
        raise ValidationError("Settings must be an object.")
    unknown = set(value) - set(CHOICES) - {"sections", "pages", "accent_color"}
    if unknown:
        raise ValidationError(f"Unknown settings: {', '.join(sorted(unknown))}.")

    for key, allowed in CHOICES.items():
        if key in value and value[key] not in allowed:
            raise ValidationError(f"{key} must be one of: {', '.join(allowed)}.")

    color = value.get("accent_color", "")
    if not isinstance(color, str) or (color and not HEX_COLOR.match(color)):
        raise ValidationError("accent_color must be empty or a colour like #2350d8.")

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
