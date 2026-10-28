"""
CV → PDF (WeasyPrint) and PDF → preview images (pdfium).

Fonts are bundled in portfolio/cv_fonts/ (SIL OFL) so the output never depends
on what is installed on the server. Images arrive as data: URIs built from the
owner's own uploads, and the renderer may load nothing else.
"""

import base64
from io import BytesIO
from pathlib import Path

import pypdfium2
import segno
from django.conf import settings
from django.template.loader import render_to_string
from weasyprint import HTML
from weasyprint.urls import URLFetcher, URLFetchingError

from ..models import CV
from .context import build_context

FONTS_DIR = Path(__file__).resolve().parent.parent / "cv_fonts"
FONTS_URI = FONTS_DIR.as_uri() + "/"
MAX_PREVIEW_PAGES = 6


class _FontsOnlyFetcher(URLFetcher):
    """The CV may load its bundled fonts and data: URIs (QR code, photos), nothing else."""

    def fetch(self, url, headers=None):
        if not (url.startswith("data:") or (url.startswith(FONTS_URI) and ".." not in url)):
            raise URLFetchingError(f"The CV may not load {url}")
        return super().fetch(url, headers)


def portfolio_url(request, username):
    """Public portfolio link: SITE_URL in production, the API's own host otherwise."""
    base = settings.SITE_URL or request.build_absolute_uri("/")
    return f"{base.rstrip('/')}/u/{username}"


def qr_code(url):
    return segno.make(url, error="m")


def qr_bytes(url, kind):
    buffer = BytesIO()
    qr_code(url).save(buffer, kind=kind, scale=10 if kind == "png" else 4, border=2, dark="#111111", light="#ffffff")
    return buffer.getvalue()


def default_cv(portfolio):
    """The owner's default CV, or an unsaved one with every default."""
    return CV.objects.filter(owner=portfolio.owner, is_default=True).first() or CV(
        owner=portfolio.owner, name="CV", design={}, content={}
    )


def cv_context(portfolio, url, cv=None):
    cv = cv or default_cv(portfolio)
    return build_context(portfolio, cv, url, qr_code(url).svg_data_uri(dark="#111111", border=0))


def render_cv_pdf(portfolio, url, cv=None):
    context = cv_context(portfolio, url, cv)
    html = render_to_string(f"cv/templates/{context['template']}.html", context)
    return HTML(string=html, base_url=FONTS_URI, url_fetcher=_FontsOnlyFetcher()).write_pdf()


def preview_pages(pdf, width_px=900):
    """The first pages of a PDF as WebP data: URIs, sharp enough to read on a phone."""
    document = pypdfium2.PdfDocument(pdf)
    try:
        pages = []
        for index in range(min(len(document), MAX_PREVIEW_PAGES)):
            page = document[index]
            image = page.render(scale=width_px / page.get_width()).to_pil()
            buffer = BytesIO()
            image.convert("RGB").save(buffer, "WEBP", quality=82)
            pages.append("data:image/webp;base64," + base64.b64encode(buffer.getvalue()).decode())
        return {"pages": pages, "page_count": len(document)}
    finally:
        document.close()
