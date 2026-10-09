import { useEffect, useState } from "react";

const offsetMinutes = (timeZone, date) => {
    // e.g. "GMT+03:00" → 180
    const name = new Intl.DateTimeFormat("en", { timeZone, timeZoneName: "longOffset" })
        .formatToParts(date)
        .find((p) => p.type === "timeZoneName")?.value;
    const m = name?.match(/GMT([+-])(\d{2}):?(\d{2})?/);
    return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : 0;
};

/**
 * Live clock for an IANA time zone, refreshed every 30s.
 * null when the zone is missing or invalid.
 */
export const useLocalTime = (timeZone) => {
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        if (!timeZone) return;
        const timer = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(timer);
    }, [timeZone]);

    if (!timeZone) return null;
    try {
        const time = new Intl.DateTimeFormat("en", { timeZone, hour: "numeric", minute: "2-digit" }).format(now);
        const hour = Number(new Intl.DateTimeFormat("en", { timeZone, hour: "numeric", hourCycle: "h23" }).format(now));
        const diff = (offsetMinutes(timeZone, now) + now.getTimezoneOffset()) / 60;
        const relative =
            diff === 0 ? "Same time as you" : `${Math.abs(diff)}h ${diff > 0 ? "ahead of" : "behind"} you`;
        const offset = offsetMinutes(timeZone, now) / 60;
        return {
            time,
            isDay: hour >= 6 && hour < 18,
            relative,
            offset: `UTC${offset >= 0 ? "+" : "−"}${Math.abs(offset)}`,
        };
    } catch {
        return null; // unknown time zone name
    }
};
