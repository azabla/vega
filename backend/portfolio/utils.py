from django.utils.deconstruct import deconstructible
from django.utils.text import slugify


def get_owner_id(instance):
    """Owner of a model instance, directly or through its parent project."""
    if hasattr(instance, "owner_id"):
        return instance.owner_id
    return instance.project.owner_id


def generate_unique_slug(instance, value):
    """Slug that is unique among the same owner's objects of this model."""
    base = slugify(value)
    slug = base
    ModelClass = instance.__class__

    def taken(candidate):
        qs = ModelClass.objects.filter(slug=candidate, owner_id=instance.owner_id)
        if instance.pk:
            qs = qs.exclude(pk=instance.pk)
        return qs.exists()

    counter = 1
    while taken(slug):
        slug = f"{base}-{counter}"
        counter += 1
    return slug


@deconstructible
class OwnerUploadTo:
    """Store uploads per user: users/<owner_id>/<subdir>/<filename>."""

    def __init__(self, subdir):
        self.subdir = subdir

    def __call__(self, instance, filename):
        return f"users/{get_owner_id(instance)}/{self.subdir}/{filename}"

    def __eq__(self, other):
        return isinstance(other, OwnerUploadTo) and self.subdir == other.subdir
