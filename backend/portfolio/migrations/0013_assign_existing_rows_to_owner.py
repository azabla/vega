from django.conf import settings
from django.db import migrations

OWNED_MODELS = ["Portfolio", "About", "Category", "Skill", "Technology", "Project", "Experience", "Contact"]


def assign_owner(apps, schema_editor):
    """
    Rows created before multi-tenancy have no owner. Give them to the first
    superuser (the original single-portfolio owner).
    """
    models = [apps.get_model("portfolio", name) for name in OWNED_MODELS]
    if not any(m.objects.filter(owner__isnull=True).exists() for m in models):
        return

    User = apps.get_model(*settings.AUTH_USER_MODEL.split("."))
    owner = User.objects.filter(is_superuser=True).order_by("id").first()
    if owner is None:
        raise RuntimeError(
            "Existing portfolio rows need an owner. Create a superuser first "
            "(python manage.py createsuperuser), then run migrate again."
        )

    Portfolio = apps.get_model("portfolio", "Portfolio")
    first = Portfolio.objects.filter(owner__isnull=True).order_by("id").first()
    if first and not Portfolio.objects.filter(owner=owner).exists():
        first.owner = owner
        first.save(update_fields=["owner"])
    # extra ownerless portfolios can't share a one-to-one owner
    Portfolio.objects.filter(owner__isnull=True).delete()

    for model in models:
        if model is not Portfolio:
            model.objects.filter(owner__isnull=True).update(owner=owner)


class Migration(migrations.Migration):
    dependencies = [
        ("portfolio", "0012_owner_and_per_owner_uniqueness"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [migrations.RunPython(assign_owner, migrations.RunPython.noop)]
