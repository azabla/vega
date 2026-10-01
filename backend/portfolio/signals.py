from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Portfolio


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_portfolio_for_new_user(sender, instance, created, raw=False, **kwargs):
    """Every new account gets an empty portfolio, so /u/<username>/ works right away."""
    if created and not raw:
        Portfolio.objects.get_or_create(
            owner=instance,
            defaults={"name": instance.get_full_name() or instance.username, "email": instance.email},
        )
