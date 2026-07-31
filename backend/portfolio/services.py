from turtle import title
from django.db.models import Prefetch
from django.shortcuts import get_object_or_404
from django.db.models import QuerySet
from django.db.models import Q

from .models import About, Service, Project


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


class ProjectService:

    @staticmethod
    def _base_queryset() -> QuerySet[Project]:
        return Project.objects.prefetch_related(
            "technologies",
            "features",
            "gallery",
            "challenges",
        ).select_related(
            "architecture",
        )

    # All
    @staticmethod
    def get_all_projects() -> QuerySet[Project]:

        return ProjectService._base_queryset()

    # Featured
    @staticmethod
    def get_featured_projects(limit=3) -> QuerySet[Project]:

        return (
            ProjectService._base_queryset()
            .filter(featured=True)
            .order_by("order")[:limit]
        )

    # Archive
    @staticmethod
    def get_archive() -> QuerySet[Project]:
        return ProjectService._base_queryset().order_by(
            "-featured",
            "order",
        )

    # Detail
    @staticmethod
    def get_project(slug: str) -> Project:

        return get_object_or_404(
            ProjectService._base_queryset(),
            slug=slug,
        )

    # By Technology
    @staticmethod
    def get_projects_by_technology(
        slug: str,
    ) -> QuerySet[Project]:
        return ProjectService._base_queryset().filter(technologies_slug=slug).distinct()

    # Search using keyword
    @staticmethod
    def search_project(keyword: str) -> QuerySet[Project]:
        return (
            ProjectService._base_queryset()
            .filter(
                Q(title__icontains=keyword)
                | Q(summary__icontains=keyword)
                | Q(overview__icontains=keyword)
            )
            .distinct()
        )
