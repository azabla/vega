import { useEffect, useState } from "react";

// id of the section currently in view, for highlighting the navbar link
export const useActiveSection = (ids) => {
    const [active, setActive] = useState(null);
    const key = ids.join(",");

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries.filter((e) => e.isIntersecting);
                if (visible.length) setActive(visible[0].target.id);
            },
            { rootMargin: "-45% 0px -50% 0px" }
        );
        // sections render after their data loads, so look again shortly
        const observe = () =>
            key.split(",").forEach((id) => {
                const el = document.getElementById(id);
                if (el) observer.observe(el);
            });
        observe();
        const timer = setTimeout(observe, 1500);
        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, [key]);

    return active;
};
