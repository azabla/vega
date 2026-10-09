from django.db.models import Prefetch, Q, QuerySet
from django.http import Http404
from django.shortcuts import get_object_or_404

from .models import About, Project, Service


class AboutService:

    @staticmethod
    def get_about(owner) -> About:
        about = (
            About.objects.filter(owner=owner, is_active=True)
            .prefetch_related(
                Prefetch(
                    "services",
                    queryset=Service.objects.filter(is_active=True).order_by(
                        "display_order"
                    ),
                ),
                "principles",
                "photos",
            )
            .order_by("-updated_at")
            .first()
        )
        if about is None:
            raise Http404("No about section found")
        return about


class ProjectService:

    @staticmethod
    def _base_queryset(owner) -> QuerySet[Project]:
        return (
            Project.objects.filter(owner=owner)
            .prefetch_related(
                "skills__category",
                "features",
                "gallery",
                "challenges",
                "lessons",
                "metrics",
            )
            .select_related(
                "architecture",
            )
        )

    # All
    @staticmethod
    def get_all_projects(owner) -> QuerySet[Project]:
        return ProjectService._base_queryset(owner)

    # Featured
    @staticmethod
    def get_featured_projects(owner, limit=3) -> QuerySet[Project]:
        return (
            ProjectService._base_queryset(owner)
            .filter(featured=True)
            .order_by("order")[:limit]
        )

    # Archive
    @staticmethod
    def get_archive(owner) -> QuerySet[Project]:
        return ProjectService._base_queryset(owner).order_by(
            "-featured",
            "order",
        )

    # Detail
    @staticmethod
    def get_project(owner, slug: str) -> Project:
        return get_object_or_404(
            ProjectService._base_queryset(owner),
            slug=slug,
        )

    # By skill
    @staticmethod
    def get_projects_by_skill(owner, slug: str) -> QuerySet[Project]:
        return (
            ProjectService._base_queryset(owner)
            .filter(skills__slug=slug)
            .distinct()
        )

    # Search using keyword
    @staticmethod
    def search_project(owner, keyword: str) -> QuerySet[Project]:
        return (
            ProjectService._base_queryset(owner)
            .filter(
                Q(title__icontains=keyword)
                | Q(summary__icontains=keyword)
                | Q(overview__icontains=keyword)
            )
            .distinct()
        )
