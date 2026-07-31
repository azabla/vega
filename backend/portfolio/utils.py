from django.utils.text import slugify


def generate_unique_slug(instance, value):
    slug = slugify(value)

    ModelClass = instance.__class__

    queryset = ModelClass.objects.filter(slug=slug)

    counter = 1

    while queryset.exists():
        slug = f"{slugify(value)}--{counter}"
        queryset = ModelClass.objects.filter(slug=slug)
        counter += 1
    return slug
