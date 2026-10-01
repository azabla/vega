import { useEffect, useState } from "react";
import { usePortfolioUsername } from "@/hooks/usePortfolioUsername";

// Shared across components: each resource is fetched once per page load,
// so the navbar, hero, contact and footer don't each re-request the profile.
const pending = new Map(); // fetcher -> Map(requestKey -> Promise)
const settled = new Map(); // fetcher -> Map(requestKey -> {data, error})

const bucket = (store, fetcher) => {
    if (!store.has(fetcher)) store.set(fetcher, new Map());
    return store.get(fetcher);
};

const load = (fetcher, requestKey) => {
    const requests = bucket(pending, fetcher);
    if (!requests.has(requestKey)) {
        const results = bucket(settled, fetcher);
        const promise = fetcher(...JSON.parse(requestKey))
            .then((res) => {
                results.set(requestKey, { data: res.data, error: null });
                return res.data;
            })
            .catch((error) => {
                requests.delete(requestKey); // allow a retry later
                results.set(requestKey, { data: null, error });
                throw error;
            });
        requests.set(requestKey, promise);
    }
    return requests.get(requestKey);
};

/**
 * Fetch one public portfolio resource for the current username.
 * `fetcher` must be a stable function, e.g. portfolioAPI.getExperience.
 */
export const usePortfolioData = (fetcher, ...args) => {
    const username = usePortfolioUsername();
    const requestKey = JSON.stringify([username, ...args]);
    const [result, setResult] = useState(null);

    useEffect(() => {
        let cancelled = false;
        load(fetcher, requestKey)
            .then((data) => !cancelled && setResult({ key: requestKey, data, error: null }))
            .catch((error) => !cancelled && setResult({ key: requestKey, data: null, error }));
        return () => {
            cancelled = true;
        };
    }, [fetcher, requestKey]);

    const current = result?.key === requestKey ? result : settled.get(fetcher)?.get(requestKey);
    return {
        data: current?.data ?? null,
        error: current?.error ?? null,
        loading: !current,
    };
};
