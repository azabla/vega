"""Render a portable website from the same selected content as a saved CV."""

from urllib.parse import urlsplit

from django.template.loader import render_to_string
from rest_framework import serializers

from .context import build_context
from .style import palette


class WebsiteOptionsSerializer(serializers.Serializer):
    layout = serializers.ChoiceField(choices=["editorial", "cards", "compact"], default="editorial")
    mode = serializers.ChoiceField(choices=["light", "dark"], default="light")
    accent = serializers.RegexField(r"\A#[0-9a-fA-F]{6}\Z", required=False)
    include_contact = serializers.BooleanField(default=False)


def web_url(value):
    try:
        url = urlsplit(value)
        return value if url.scheme in {"http", "https"} and url.hostname else ""
    except ValueError:
        return ""


def render_cv_website(portfolio, cv, options):
    site = build_context(portfolio, cv, url="", qr_uri=None)
    contact = []
    if options.get("include_contact"):
        for item in site["contact"]:
            if item["kind"] not in {"email", "phone", "location"}:
                item["href"] = web_url(item["href"])
            contact.append(item)

    # These links come from profile fields. Restrict them to web URLs even for
    # records created before the current API validators were in place.
    for section in site["sections"]:
        if section["kind"] in {"projects", "achievements", "certificates"}:
            for entry in section["data"]:
                entry["link"] = web_url(entry["link"])

    return render_website({**site, "contact": contact}, options, accent=site["design"]["accent"])


def render_website(site, options, accent="#0f766e"):
    return render_to_string("portfolio/cv_website.html", {
        **site,
        "colors": palette(options.get("accent", accent)),
        "font": options.get("font", "default"),
        "spacing": options.get("spacing", "comfortable"),
        "show_navigation": options.get("show_navigation", True),
        "layout": options["layout"],
        "mode": options["mode"],
    })
