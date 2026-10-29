"""
CVs generated from the master profile (see docs/11 and docs/12).

    render.py   CV → PDF with WeasyPrint, PDF → preview images, QR codes
    context.py  profile + one CV's choices → template context
    style.py    design options → colours, sizes, fonts
    text.py     plain text → safe HTML (bullets, **bold**, links)
    templates/cv/templates/<template>.html, one per CV template
"""

from .context import date_range
from .render import (
    FONTS_URI,
    _FontsOnlyFetcher,
    cv_context,
    default_cv,
    portfolio_url,
    preview_pages,
    qr_bytes,
    regions,
    render_cv_document,
    render_cv_pdf,
)
from .text import rich

__all__ = [
    "FONTS_URI",
    "_FontsOnlyFetcher",
    "cv_context",
    "date_range",
    "default_cv",
    "portfolio_url",
    "preview_pages",
    "qr_bytes",
    "regions",
    "render_cv_document",
    "render_cv_pdf",
    "rich",
]
