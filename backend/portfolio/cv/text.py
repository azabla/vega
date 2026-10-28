"""
Plain text from the profile → safe HTML for the CV.

Lines starting with "-", "•", "*" or "1." become a list; blank lines split
paragraphs. Inline: **bold**, *italic* and [label](https://link). Everything is
escaped first, so the only tags in the output are the ones added here.
"""

import re

from django.utils.html import escape
from django.utils.safestring import mark_safe

# Same bullet rule as bulletsOf() in frontend/src/lib/format.js
BULLET = re.compile(r"^\s*(?:[•·▪◦‣*-]|\d+[.)])\s+")
LINK = re.compile(r"\[([^\]\n]+)\]\((https?://[^\s()<>\"']+)\)")
BOLD = re.compile(r"\*\*(?!\s)(.+?)(?<!\s)\*\*")
ITALIC = re.compile(r"(?<![*\w])\*(?![\s*])([^*\n]+?)(?<!\s)\*(?![*\w])")


def inline(text):
    html = escape(text)
    html = LINK.sub(r'<a href="\2">\1</a>', html)
    html = BOLD.sub(r"<strong>\1</strong>", html)
    html = ITALIC.sub(r"<em>\1</em>", html)
    return html


def rich(text):
    """HTML for a block of text, or "" when there is none."""
    blocks, paragraph, bullets = [], [], []

    def flush():
        if paragraph:
            blocks.append("<p>" + "<br>".join(inline(line) for line in paragraph) + "</p>")
            paragraph.clear()
        if bullets:
            blocks.append("<ul>" + "".join(f"<li>{inline(b)}</li>" for b in bullets) + "</ul>")
            bullets.clear()

    for raw in (text or "").splitlines():
        line = raw.strip()
        if not line:
            flush()
        elif BULLET.match(line):
            if paragraph:
                flush()
            bullets.append(BULLET.sub("", line))
        else:
            if bullets:
                flush()
            paragraph.append(line)
    flush()
    return mark_safe("".join(blocks))


def plain_inline(text):
    """One line with inline formatting, for short fields (headline, titles)."""
    return mark_safe(inline(text or ""))
