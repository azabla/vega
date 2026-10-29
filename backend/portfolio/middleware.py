from django.conf import settings
from django.http import HttpResponseBadRequest
from django.http.request import validate_host

from .domains import normalize_host, resolve_host


class PortfolioHostsMiddleware:
    """
    With portfolio subdomains or custom domains on, ALLOWED_HOSTS is "*" and this decides
    instead: the hosts configured in ALLOWED_HOSTS, <username>.<BASE_DOMAIN> for real users,
    and verified custom domains. Anything else gets a 400, like Django's own check.
    Caddy's certificate check (/api/sites/tls-allowed/) arrives with the internal host name,
    so it is let through: it only answers yes or no about a domain.
    """

    EXEMPT = ("/api/sites/tls-allowed/",)

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        configured = getattr(settings, "CONFIGURED_HOSTS", None)
        if configured is not None and request.path not in self.EXEMPT:
            host = normalize_host(request.META.get("HTTP_HOST") or request.META.get("SERVER_NAME", ""))
            if not (validate_host(host, configured) or resolve_host(host)[0]):
                return HttpResponseBadRequest("Unknown host")
        return self.get_response(request)
