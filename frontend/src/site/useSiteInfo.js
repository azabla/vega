import { useEffect, useState } from "react";
import api from "@/api/axios";

let request = null; // fetched once per page load

/** What this site offers ({registration_open, subdomains, custom_domains}); null while loading. */
export const useSiteInfo = () => {
    const [info, setInfo] = useState(null);
    useEffect(() => {
        request ??= api.get("/sites/info/").then(({ data }) => data).catch(() => ({ registration_open: true }));
        let live = true;
        request.then((data) => live && setInfo(data));
        return () => {
            live = false;
        };
    }, []);
    return info;
};
