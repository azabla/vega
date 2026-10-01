import { useCallback, useState } from "react";

// index.html applies the saved/system theme before React loads
export const useTheme = () => {
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

    const toggle = useCallback(() => {
        const next = !document.documentElement.classList.contains("dark");
        document.documentElement.classList.toggle("dark", next);
        try {
            localStorage.setItem("theme", next ? "dark" : "light");
        } catch {
            // storage blocked: theme still applies for this visit
        }
        setIsDark(next);
    }, []);

    return { isDark, toggle };
};
