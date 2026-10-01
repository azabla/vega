const monthYear = new Intl.DateTimeFormat("en", { month: "short", year: "numeric" });

export const formatMonthYear = (value) => (value ? monthYear.format(new Date(value)) : "");

// "Jan 2024 – Present", "2019 – 2024" style ranges
export const formatDateRange = (start, end, current) => {
    const from = formatMonthYear(start);
    const to = current ? "Present" : formatMonthYear(end);
    if (from && to) return `${from} – ${to}`;
    return from || to;
};

export const pluralize = (count, word) => `${count} ${word}${count === 1 ? "" : "s"}`;
