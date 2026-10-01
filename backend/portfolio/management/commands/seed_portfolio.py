"""
Fill a user's portfolio from a seed file (see portfolio/seed/vega.json).

    python manage.py seed_portfolio portfolio/seed/vega.json --owner vega
    python manage.py seed_portfolio portfolio/seed/vega.json --owner vega --reset

Safe to run repeatedly:
- profile and about are updated in place
- categories and skills are matched by name (case-insensitive)
- projects are matched by slug; their features, challenges, lessons and
  architecture are replaced with the file's version
- services, experience, education and certificates are replaced only when
  the file contains that section
--reset first deletes all of the user's portfolio content (not the account).
"""

import json

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from portfolio.models import (
    About,
    Category,
    Certificate,
    Education,
    Experience,
    LessonLearned,
    Portfolio,
    Project,
    ProjectArchitecture,
    ProjectChallenge,
    ProjectFeature,
    Service,
    Skill,
)

PROJECT_FIELDS = [
    "title", "summary", "overview", "status", "role", "started_on",
    "github_url", "live_url", "featured", "order",
]


class Command(BaseCommand):
    help = "Fill a user's portfolio from a JSON seed file."

    def add_arguments(self, parser):
        parser.add_argument("seed_file")
        parser.add_argument("--owner", required=True, help="Username (or email)")
        parser.add_argument("--reset", action="store_true", help="Delete the user's portfolio content first")

    def handle(self, seed_file, owner, reset, **options):
        User = get_user_model()
        user = User.objects.filter(username=owner.lower()).first() or User.objects.filter(
            email=owner.lower()
        ).first()
        if user is None:
            raise CommandError(f"No user '{owner}'. Create the account first.")
        try:
            with open(seed_file) as f:
                data = json.load(f)
        except (OSError, json.JSONDecodeError) as e:
            raise CommandError(f"Can't read {seed_file}: {e}")

        with transaction.atomic():
            if reset:
                self.reset(user)
            self.skills = {}
            self.seed_profile(user, data.get("profile", {}))
            if "about" in data:
                self.seed_about(user, data["about"])
            for i, category in enumerate(data.get("categories", [])):
                self.seed_category(user, category, i)
            for key, model in (("experience", Experience), ("education", Education), ("certificates", Certificate)):
                if key in data:
                    self.seed_list(user, model, data[key])
            for project in data.get("projects", []):
                self.seed_project(user, project)

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {user.username}: {Skill.objects.filter(owner=user).count()} skills, "
            f"{Project.objects.filter(owner=user).count()} projects."
        ))

    def reset(self, user):
        for model in (Project, Skill, Category, Experience, Education, Certificate, About):
            model.objects.filter(owner=user).delete()

    # -- sections ---------------------------------------------------------

    def seed_profile(self, user, fields):
        portfolio, _ = Portfolio.objects.get_or_create(owner=user, defaults={"name": user.username})
        for key, value in fields.items():
            setattr(portfolio, key, value)
        portfolio.save()

    def seed_about(self, user, fields):
        fields = dict(fields)
        services = fields.pop("services", None)
        about = About.objects.filter(owner=user).order_by("-updated_at").first() or About(owner=user)
        for key, value in fields.items():
            setattr(about, key, value)
        about.is_active = True
        about.save()
        if services is not None:
            about.services.all().delete()
            for i, service in enumerate(services):
                Service.objects.create(about=about, display_order=i, **service)

    def seed_category(self, user, data, order):
        category = Category.objects.filter(owner=user, name__iexact=data["name"]).first()
        if category is None:
            category = Category(owner=user, name=data["name"])
        category.display_order = order
        category.is_active = True
        category.save()
        for i, name in enumerate(data.get("skills", [])):
            skill = self.get_skill(user, name, category)
            skill.category = category
            skill.display_order = i
            skill.save()

    def get_skill(self, user, name, category=None):
        key = name.lower()
        if key not in self.skills:
            skill = Skill.objects.filter(owner=user, name__iexact=name).first()
            if skill is None:
                if category is None:
                    category, _ = Category.objects.get_or_create(owner=user, name="Other")
                skill = Skill.objects.create(owner=user, name=name, category=category)
            self.skills[key] = skill
        return self.skills[key]

    def seed_list(self, user, model, items):
        model.objects.filter(owner=user).delete()
        for item in items:
            item = dict(item)
            skill_names = item.pop("skills", [])
            obj = model.objects.create(owner=user, **item)
            if skill_names:
                obj.skills.set([self.get_skill(user, n) for n in skill_names])

    def seed_project(self, user, data):
        project = Project.objects.filter(owner=user, slug=data["slug"]).first() or Project(
            owner=user, slug=data["slug"]
        )
        for field in PROJECT_FIELDS:
            if field in data:
                setattr(project, field, data[field])
        project.save()
        project.skills.set([self.get_skill(user, n) for n in data.get("skills", [])])

        for model, key in ((ProjectFeature, "features"), (ProjectChallenge, "challenges"), (LessonLearned, "lessons")):
            if key in data:
                model.objects.filter(project=project).delete()
                for i, item in enumerate(data[key]):
                    model.objects.create(project=project, order=i, **item)
        if "architecture" in data:
            ProjectArchitecture.objects.update_or_create(project=project, defaults=data["architecture"])
