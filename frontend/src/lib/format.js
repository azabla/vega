const monthYear = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" });

export const formatMonthYear = (value) => (value ? monthYear.format(new Date(value)) : "");

// "Jan 2024 – Present", "2019 – 2024" style ranges
export const formatDateRange = (start, end, current) => {
    const from = formatMonthYear(start);
    const to = current ? "Present" : formatMonthYear(end);
    if (from && to) return `${from} – ${to}`;
    return from || to;
};

// "2022 – 2024", "2025 – Present" — for resume-style entries recorded by year
export const formatYearRange = (start, end, current) => {
    const from = yearOf(start);
    const to = current ? "Present" : yearOf(end);
    if (from && to && from !== to) return `${from} – ${to}`;
    return String(from || to || "");
};

export const pluralize = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;

export function yearOf(value) {
    return value ? new Date(value).getFullYear() : null;
}

// "AC" from "Andualem Chanie"; letters only, so "— v2" doesn't count
export const initialsOf = (name = "") =>
    String(name)
        .split(/[\s—–-]+/)
        .filter((w) => /^\p{L}/u.test(w))
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("");

// Small stable number from a string (avatar tints, generated covers)
export const hashOf = (text = "") => {
    let hash = 0;
    for (const ch of String(text)) hash = (hash * 31 + ch.codePointAt(0)) >>> 0;
    return hash;
};

// Non-empty trimmed lines
export const linesOf = (text) =>
    (text ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

const BULLET = /^\s*(?:[•·▪◦‣*-]|\d+[.)])\s+/;

/** Bullet lines ("• Did X") as a list, or null when the text is a paragraph. */
export const bulletsOf = (text) => {
    const lines = linesOf(text);
    if (lines.length < 2 || !lines.every((line) => BULLET.test(line))) return null;
    return lines.map((line) => line.replace(BULLET, ""));
};

/**
 * "2 yrs 3 mos", "8 mos", "3 yrs". Résumé dates stored as 1 Jan – 31 Dec
 * count as whole years. No end date means "until today".
 */
export const formatDuration = (start, end) => {
    if (!start) return "";
    const from = new Date(start);
    const to = end ? new Date(end) : new Date();
    let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
    if (end && to.getDate() >= 28) months += 1; // an end date at month's end includes that month
    months = Math.max(1, months);
    const years = Math.floor(months / 12);
    const rest = months % 12;
    const y = years ? `${years} yr${years === 1 ? "" : "s"}` : "";
    const m = rest ? `${rest} mo${rest === 1 ? "" : "s"}` : "";
    return [y, m].filter(Boolean).join(" ");
};
