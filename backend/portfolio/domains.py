"""
Where a portfolio lives on the web (see docs/15):

    https://<SITE>/u/<username>           always
    https://<username>.<BASE_DOMAIN>      when PORTFOLIO_SUBDOMAINS is on
    https://<custom domain>               when CUSTOM_DOMAINS is on and the owner proved, with a
                                          DNS TXT record, that the domain is theirs

resolve_host() maps a request's Host to one of these; public_url() picks the best address for
QR codes, CV PDFs and the dashboard.
"""

import re
import secrets

import dns.exception
import dns.resolver
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.utils import timezone

from .models import Portfolio

# Never usernames on a subdomain: the site itself and the hosts around it
RESERVED_SUBDOMAINS = {"www", "api", "app", "admin", "mail", "static", "media", "dashboard", "domains", "cdn"}
HOSTNAME = re.compile(r"^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$")
TXT_PREFIX = "_vega"
CACHE_SECONDS = 60


def normalize_host(host):
    """ "Hana.COM:443." → "hana.com" """
    host = (host or "").strip().lower().rstrip(".")
    if host.startswith("["):  # IPv6 literal
        return host
    return host.rsplit(":", 1)[0] if ":" in host else host


def base_domain():
    return normalize_host(getattr(settings, "BASE_DOMAIN", ""))


def subdomain_of(host):
    """The username in <username>.<BASE_DOMAIN>, or None."""
    base = base_domain()
    if not base or not host.endswith("." + base):
        return None
    label = host[: -len(base) - 1]
    if "." in label or label in RESERVED_SUBDOMAINS:
        return None
    return label


def verified_owner_of(domain):
    """Username serving `domain`, cached briefly (the host check runs on every request)."""
    key = f"custom-domain:{domain}"
    username = cache.get(key)
    if username is None:
        portfolio = (
            Portfolio.objects.filter(custom_domain=domain, domain_verified_at__isnull=False, owner__is_active=True)
            .select_related("owner")
            .first()
        )
        username = portfolio.owner.username if portfolio else ""
        cache.set(key, username, CACHE_SECONDS)
    return username or None


def forget_domain(domain):
    if domain:
        cache.delete(f"custom-domain:{domain}")


def resolve_host(host):
    """
    ("root", None) for the main site, ("portfolio", username) for a portfolio's own address,
    (None, None) for anything else.
    """
    host = normalize_host(host)
    base = base_domain()
    if base and host in (base, "www." + base):
        return "root", None
    if settings.PORTFOLIO_SUBDOMAINS:
        username = subdomain_of(host)
        if username and get_user_model().objects.filter(username=username, is_active=True).exists():
            return "portfolio", username
    if settings.CUSTOM_DOMAINS and HOSTNAME.match(host):
        username = verified_owner_of(host)
        if username:
            return "portfolio", username
    return None, None


def public_url(portfolio, request=None):
    """The best public address of a portfolio."""
    username = portfolio.owner.username
    if settings.CUSTOM_DOMAINS and portfolio.custom_domain and portfolio.domain_verified_at:
        return f"https://{portfolio.custom_domain}"
    if settings.PORTFOLIO_SUBDOMAINS and base_domain():
        return f"https://{username}.{base_domain()}"
    return path_url(username, request)


def path_url(username, request=None):
    """https://<site>/u/<username>: SITE_URL in production, the request's own host otherwise."""
    base = settings.SITE_URL or (request.build_absolute_uri("/") if request else "")
    return f"{base.rstrip('/')}/u/{username}"


# -- the owner's own domain ------------------------------------------------------

def clean_domain(value):
    """A bare hostname from what an owner typed ("https://Hana.com/" → "hana.com"), or ValueError."""
    domain = re.sub(r"^[a-z]+://", "", (value or "").strip().lower()).split("/")[0]
    domain = normalize_host(domain)
    if not HOSTNAME.match(domain):
        raise ValueError("Enter a domain like hana.com or cv.hana.com.")
    base = base_domain()
    if base and (domain == base or domain.endswith("." + base)):
        raise ValueError(f"That's an address on {base}; your portfolio already has one there.")
    return domain


def new_token():
    return "vega-verify=" + secrets.token_urlsafe(18)


def dns_records(portfolio):
    """What the owner adds at their DNS provider."""
    domain = portfolio.custom_domain
    if not domain:
        return []
    records = [{"type": "TXT", "name": f"{TXT_PREFIX}.{domain}", "value": portfolio.domain_token, "purpose": "verify"}]
    if settings.CUSTOM_DOMAIN_TARGET:
        records.append({"type": "CNAME", "name": domain, "value": settings.CUSTOM_DOMAIN_TARGET, "purpose": "route"})
    if settings.CUSTOM_DOMAIN_IP:
        records.append({"type": "A", "name": domain, "value": settings.CUSTOM_DOMAIN_IP, "purpose": "route"})
    return records


def _lookup(name, kind):
    """DNS answers as strings; [] when there are none. Split out so tests can replace it."""
    try:
        answers = dns.resolver.resolve(name, kind, lifetime=4)
    except (dns.exception.DNSException, OSError):
        return []
    if kind == "TXT":
        return [b"".join(r.strings).decode(errors="replace") for r in answers]
    return [r.to_text().rstrip(".").lower() for r in answers]


def check_domain(portfolio):
    """
    Look the records up. Proof of ownership is the TXT record; whether traffic reaches us is
    reported separately ("points_here"), because DNS changes can take a while to show.
    """
    domain = portfolio.custom_domain
    owned = portfolio.domain_token in _lookup(f"{TXT_PREFIX}.{domain}", "TXT")
    ours = set()
    if settings.CUSTOM_DOMAIN_IP:
        ours.add(settings.CUSTOM_DOMAIN_IP)
    if settings.CUSTOM_DOMAIN_TARGET:
        ours.update(_lookup(settings.CUSTOM_DOMAIN_TARGET, "A"))
    points_here = bool(ours & set(_lookup(domain, "A")))
    if owned and not portfolio.domain_verified_at:
        portfolio.domain_verified_at = timezone.now()
        portfolio.save(update_fields=["domain_verified_at"])
        forget_domain(domain)
    return {"owned": owned, "points_here": points_here}


def domain_state(portfolio, request=None):
    """Everything the dashboard's Domain page shows."""
    username = portfolio.owner.username
    return {
        "public_url": public_url(portfolio, request),
        "addresses": {
            "path": path_url(username, request),
            "subdomain": f"https://{username}.{base_domain()}" if settings.PORTFOLIO_SUBDOMAINS and base_domain() else None,
            "custom": f"https://{portfolio.custom_domain}" if portfolio.custom_domain and portfolio.domain_verified_at else None,
        },
        "custom_domains_enabled": settings.CUSTOM_DOMAINS,
        "domain": portfolio.custom_domain,
        "verified": bool(portfolio.domain_verified_at),
        "verified_at": portfolio.domain_verified_at,
        "records": dns_records(portfolio),
    }
