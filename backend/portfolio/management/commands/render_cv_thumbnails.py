"""
Render page one of every CV template as a small WebP, for the dashboard's template gallery.

    python manage.py render_cv_thumbnails --owner sample --out ../frontend/src/assets/cv-templates

Run it after changing a template. Use the demo persona (portfolio/seed/demo.json),
ideally with a profile photo so the photo slots show.
"""

from pathlib import Path

import pypdfium2
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from portfolio.cv import render_cv_pdf
from portfolio.cv_options import TEMPLATES
from portfolio.models import CV, Portfolio

# Each template shown in a colour that suits it, so the gallery isn't nine navy pages
SHOWCASE = {
    "classic": {"accent": "#1f3a5f"},
    "modern": {"accent": "#0f766e", "skills_style": "tags"},
    "elegant": {"accent": "#7c2d12", "font": "classic"},
    "compact": {"accent": "#1d4ed8", "font": "plain", "size": "small"},
    "creative": {"accent": "#c2410c", "font": "modern", "skills_style": "tags"},
    "timeline": {"accent": "#6d28d9"},
    "academic": {"accent": "#1f2937", "font": "classic", "photo": "none"},
    "minimal": {"accent": "#0f766e", "font": "modern"},
    "executive": {"accent": "#1f3a5f"},
    "cards": {"accent": "#6d28d9", "font": "modern", "skills_style": "tags"},
    "swiss": {"accent": "#c2410c", "font": "modern", "photo": "none"},
}


class Command(BaseCommand):
    help = "Render a thumbnail of each CV template."

    def add_arguments(self, parser):
        parser.add_argument("--owner", default="sample")
        parser.add_argument("--out", required=True)
        parser.add_argument("--width", type=int, default=360)

    def handle(self, owner, out, width, **options):
        user = get_user_model().objects.filter(username=owner).first()
        if user is None:
            raise CommandError(f"No user '{owner}'. Seed portfolio/seed/demo.json first.")
        portfolio = Portfolio.objects.get(owner=user)
        out = Path(out)
        out.mkdir(parents=True, exist_ok=True)
        for template in TEMPLATES:
            cv = CV(owner=user, name=template, template=template, design=SHOWCASE.get(template, {}), content={})
            document = pypdfium2.PdfDocument(render_cv_pdf(portfolio, f"https://example.com/u/{owner}", cv))
            page = document[0]
            image = page.render(scale=width / page.get_width()).to_pil().convert("RGB")
            document.close()
            path = out / f"{template}.webp"
            image.save(path, "WEBP", quality=80)
            self.stdout.write(f"{path} {path.stat().st_size // 1024} KB")
