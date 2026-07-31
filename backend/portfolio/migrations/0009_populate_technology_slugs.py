from django.db import migrations
from django.utils.text import slugify


def populate_slugs(apps, schema_editor):
    Technology = apps.get_model("portfolio", "Technology")

    for technology in Technology.objects.all():
        base_slug = slugify(technology.name)
        slug = base_slug
        counter = 1

        while Technology.objects.filter(slug=slug).exclude(pk=technology.pk).exists():
            slug = f"{base_slug}-{counter}"
            counter += 1

        technology.slug = slug
        technology.save(update_fields=["slug"])


class Migration(migrations.Migration):

    dependencies = [
        ("portfolio", "0008_alter_technology_slug"),  # <-- we'll verify this
    ]

    operations = [
        migrations.RunPython(populate_slugs),
    ]
