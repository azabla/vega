from django.db.models import Prefetch
from django.shortcuts import get_object_or_404

from .models import About, Service


class AboutService:

    @staticmethod
    def get_about():
        return get_object_or_404(
            About.objects.prefetch_related(
                Prefetch(
                    "services",
                    queryset=Service.objects.filter(is_active=True).order_by(
                        "display_order"
                    ),
                )
            ),
            is_active=True,
        )
