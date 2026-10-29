// A custom accent colour (settings.accent_color) → the three accent tokens of index.css, for
// light or dark mode. Like the presets: --primary is the fill, --primary-foreground the text on
// it, --primary-ink the accent as text (≥ 4.5:1 on the theme's background and cards).

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (c) => `#${c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
const mix = (a, b, amount) => a.map((v, i) => v * amount + b[i] * (1 - amount));

const luminance = (c) => {
    const [r, g, b] = c.map((v) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
export const contrast = (a, b) => {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
};

const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

// Step towards black (light mode) or white (dark mode) until every backdrop reaches the ratio
const adjust = (color, backdrops, ratio, toward) => {
    let c = color;
    for (let i = 0; i < 40 && backdrops.some((b) => contrast(c, b) < ratio); i++) c = mix(c, toward, 0.9);
    return c;
};

/** { "--primary", "--primary-foreground", "--primary-ink" } for this accent on [background, card]. */
export const accentTokens = (accent, paper, dark) => {
    const backdrops = paper.map(rgb);
    const toward = dark ? WHITE : BLACK;
    // a fill must stand out from the page (3:1, like any UI part)
    const fill = adjust(rgb(accent), backdrops, dark ? 3 : 1.4, toward);
    const ink = adjust(rgb(accent), backdrops, 4.5, toward);
    const onFill = contrast(fill, WHITE) >= contrast(fill, BLACK) ? WHITE : BLACK;
    return {
        "--primary": toHex(fill),
        "--primary-foreground": toHex(onFill),
        "--primary-ink": toHex(ink),
    };
};

/** Near-black or near-white, whichever reads better on this background. */
export const readableOn = (hex) => (contrast(rgb(hex), WHITE) >= contrast(rgb(hex), BLACK) ? "#f5f5f5" : "#151515");
