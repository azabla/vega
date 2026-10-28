"""
Design options → concrete values for the CV stylesheet.

WeasyPrint has no color-mix() and limited calc(), so tints, readable accent
shades and spacing are computed here and written into the CSS as numbers.
"""

# Heading face, its weight and tracking, body face per design["font"].
# Mirrors [data-font] in frontend/src/index.css; "plain" is Inter throughout (ATS-safe).
FONT_PAIRINGS = {
    "editorial": ("instrument-serif-latin-400-normal.woff2", 400, "-0.01em", "geist-latin-wght-normal.woff2"),
    "modern": ("space-grotesk-latin-wght-normal.woff2", 600, "-0.03em", "inter-latin-wght-normal.woff2"),
    "classic": ("fraunces-latin-wght-normal.woff2", 500, "-0.02em", "dm-sans-latin-wght-normal.woff2"),
    "plain": ("inter-latin-wght-normal.woff2", 700, "-0.02em", "inter-latin-wght-normal.woff2"),
}
BASE_SIZE = {"small": 8.75, "medium": 9.5, "large": 10.5}  # pt
SPACING = {"compact": 0.7, "normal": 1.0, "relaxed": 1.35}
PAPER = {"a4": "A4", "letter": "letter"}

WHITE = (255, 255, 255)
INK = (22, 22, 22)


def _rgb(hex_color):
    return tuple(int(hex_color[i : i + 2], 16) for i in (1, 3, 5))


def _hex(rgb):
    return "#" + "".join(f"{round(c):02x}" for c in rgb)


def _mix(a, b, amount):
    """amount of a, the rest b."""
    return tuple(x * amount + y * (1 - amount) for x, y in zip(a, b))


def _luminance(rgb):
    def channel(c):
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = (channel(c) for c in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a, b):
    la, lb = sorted((_luminance(a), _luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def _darken_until(rgb, ratio, against=WHITE):
    while contrast(rgb, against) < ratio:
        rgb = _mix(rgb, (0, 0, 0), 0.92)
    return rgb


def palette(accent):
    """The accent and the shades templates need, all readable where they are used."""
    base = _rgb(accent)
    deep = _darken_until(base, 7)  # sidebar/band fill with white text on it
    return {
        "accent": accent,
        "ink": _hex(_darken_until(base, 4.5)),  # accent as text on white
        "soft": _hex(_mix(base, WHITE, 0.11)),  # page tints
        "tint": _hex(_mix(base, WHITE, 0.16)),  # chips, rules on tinted areas
        "line": _hex(_mix(base, WHITE, 0.4)),  # decorative rules
        "deep": _hex(deep),
        "on_deep_muted": _hex(_mix(WHITE, deep, 0.78)),
        # text on the raw accent (creative header band)
        "on_accent": "#ffffff" if contrast(base, WHITE) >= contrast(base, INK) else _hex(INK),
    }


def metrics(design):
    base = BASE_SIZE[design["size"]]
    gap = SPACING[design["spacing"]]
    return {
        "base": base,
        "small": round(base * 0.88, 2),
        "tiny": round(base * 0.78, 2),
        "h3": round(base * 1.06, 2),
        "h1": round(base * 2.55, 2),
        "headline": round(base * 1.2, 2),
        "line": 1.45 if design["spacing"] != "compact" else 1.35,
        "section_gap": round(5 * gap, 2),  # mm
        "entry_gap": round(3 * gap, 2),
        "item_gap": round(0.7 * gap, 2),
        "margin": round(16 * (0.85 if design["spacing"] == "compact" else 1), 1),
    }


def fonts(design):
    heading, weight, tracking, body = FONT_PAIRINGS[design["font"]]
    return {
        "heading": heading,
        "heading_weight": weight,
        "heading_tracking": tracking,
        "body": body,
        "body_italic": body.replace("-normal", "-italic"),
    }
