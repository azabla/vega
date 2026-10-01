import { useEffect, useState } from "react";
import { usePortfolioUsername } from "@/hooks/usePortfolioUsername";

/**
 * Fetch one public portfolio resource for the current username.
 * `fetcher` must be a stable function, e.g. portfolioAPI.getExperience.
 */
export const usePortfolioData = (fetcher, ...args) => {
    const username = usePortfolioUsername();
    const requestKey = JSON.stringify([username, ...args]);
    // result of the last finished request, tagged with the request it belongs to
    const [result, setResult] = useState({ key: null, data: null, error: null });

    useEffect(() => {
        let cancelled = false;
        const [user, ...rest] = JSON.parse(requestKey);

        fetcher(user, ...rest)
            .then((res) => !cancelled && setResult({ key: requestKey, data: res.data, error: null }))
            .catch((error) => !cancelled && setResult({ key: requestKey, data: null, error }));

        return () => {
            cancelled = true;
        };
    }, [fetcher, requestKey]);

    const current = result.key === requestKey;
    return {
        data: current ? result.data : null,
        error: current ? result.error : null,
        loading: !current,
    };
};
