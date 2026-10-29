// Which site a hostname serves. Mirrors resolve_host() in backend/portfolio/domains.py.
//   the main site (BASE_DOMAIN, www.BASE_DOMAIN, localhost)  → landing page, /u/<username>, dashboard
//   <username>.<BASE_DOMAIN>                                  → that user's portfolio at /
//   any other domain                                          → maybe an owner's own domain (ask the API)

const normalize = (host) => (host ?? "").trim().toLowerCase().replace(/\.$/, "");

export const BASE_DOMAIN = normalize(import.meta.env.VITE_BASE_DOMAIN);
// Whether <username>.<BASE_DOMAIN> addresses are switched on (PORTFOLIO_SUBDOMAINS on the backend)
export const SUBDOMAINS = import.meta.env.VITE_PORTFOLIO_SUBDOMAINS === "true" && Boolean(BASE_DOMAIN);
// Single-portfolio deployments: the root shows this user's portfolio instead of the landing page
export const ROOT_USERNAME = import.meta.env.VITE_PORTFOLIO_USERNAME || null;

const RESERVED = new Set(["www", "api", "app", "admin", "mail", "static", "media", "dashboard", "domains", "cdn"]);
const LOCAL = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\]|\d+\.\d+\.\d+\.\d+)$/;

/** { kind: "main" } | { kind: "portfolio", username } | { kind: "custom", host } */
export const detectSite = (hostname) => {
    const host = normalize(hostname);
    if (!BASE_DOMAIN || host === BASE_DOMAIN || host === `www.${BASE_DOMAIN}` || LOCAL.test(host)) return { kind: "main" };
    if (host.endsWith(`.${BASE_DOMAIN}`)) {
        const label = host.slice(0, -BASE_DOMAIN.length - 1);
        if (!label.includes(".") && !RESERVED.has(label)) return { kind: "portfolio", username: label };
        return { kind: "main" };
    }
    return { kind: "custom", host };
};

/** How a new user's portfolio address will read, for the signup form. */
export const portfolioAddress = (username) =>
    SUBDOMAINS ? `${username}.${BASE_DOMAIN}` : `${BASE_DOMAIN || window.location.host}/u/${username}`;

/** The main site's address for the current page (login and the dashboard live there). */
export const mainSiteUrl = (path = "/") => {
    if (!BASE_DOMAIN) return path;
    const { protocol, port } = window.location;
    return `${protocol}//${BASE_DOMAIN}${port ? `:${port}` : ""}${path}`;
};
