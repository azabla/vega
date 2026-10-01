"""
Import a `dumpdata portfolio` export into one user's account.

    python manage.py import_portfolio backups/portfolio.json --owner vega

Works with exports from before multi-tenancy (no owner field). Objects get new
primary keys, foreign keys are remapped, and everything is assigned to --owner.
If the user already has a portfolio profile, it is updated instead of duplicated.
"""

import json

from django.apps import apps
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import models, transaction

from portfolio.models import Portfolio

# parents before children
IMPORT_ORDER = [
    "portfolio.portfolio",
    "portfolio.about",
    "portfolio.service",
    "portfolio.category",
    "portfolio.skill",
    "portfolio.technology",
    "portfolio.project",
    "portfolio.projectimage",
    "portfolio.projectfeature",
    "portfolio.projectchallenge",
    "portfolio.lessonlearned",
    "portfolio.projectarchitecture",
    "portfolio.experience",
    "portfolio.contact",
]


class Command(BaseCommand):
    help = "Import a portfolio JSON export into a user's account."

    def add_arguments(self, parser):
        parser.add_argument("fixture", help="Path to a `dumpdata portfolio` JSON file")
        parser.add_argument("--owner", required=True, help="Username (or email) to own the data")

    def handle(self, fixture, owner, **options):
        User = get_user_model()
        user = User.objects.filter(username=owner.lower()).first() or User.objects.filter(
            email=owner.lower()
        ).first()
        if user is None:
            raise CommandError(f"No user '{owner}'. Create the account first.")

        try:
            with open(fixture) as f:
                records = json.load(f)
        except (OSError, json.JSONDecodeError) as e:
            raise CommandError(f"Can't read {fixture}: {e}")

        by_model = {}
        for record in records:
            by_model.setdefault(record["model"], []).append(record)
        for label in sorted(set(by_model) - set(IMPORT_ORDER)):
            self.stderr.write(f"Skipping unknown model {label} ({len(by_model[label])} rows)")

        pk_map = {}  # (model label, old pk) -> new pk
        counts = {}
        with transaction.atomic():
            for label in IMPORT_ORDER:
                model = apps.get_model(label)
                for record in by_model.get(label, []):
                    new_pk = self.import_record(model, label, record, user, pk_map)
                    pk_map[(label, record["pk"])] = new_pk
                    counts[label] = counts.get(label, 0) + 1

        for label, n in counts.items():
            self.stdout.write(f"  {label}: {n}")
        self.stdout.write(self.style.SUCCESS(f"Imported {sum(counts.values())} objects for {user.username}."))

    def import_record(self, model, label, record, user, pk_map):
        fields = dict(record["fields"])
        values, m2m = {}, {}

        for field in model._meta.get_fields():
            if field.name not in fields or field.auto_created and not field.concrete:
                continue
            value = fields[field.name]
            if isinstance(field, models.ManyToManyField):
                target = field.related_model._meta.label_lower
                m2m[field.name] = [pk_map[(target, v)] for v in value if (target, v) in pk_map]
            elif isinstance(field, models.ForeignKey) and field.related_model is not get_user_model():
                target = field.related_model._meta.label_lower
                values[field.attname] = pk_map.get((target, value))
            elif field.concrete and not field.primary_key and field.name != "owner":
                values[field.name] = value

        if any(f.name == "owner" for f in model._meta.get_fields()):
            values["owner"] = user

        if model is Portfolio:
            obj = Portfolio.objects.filter(owner=user).first() or Portfolio(owner=user)
            for key, value in values.items():
                setattr(obj, key, value)
        else:
            obj = model(**values)
        obj.save()

        for name, pks in m2m.items():
            getattr(obj, name).set(pks)
        return obj.pk
