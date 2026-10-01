"""
Public, read-only portfolio API: /api/u/<username>/...

Every view is scoped to the portfolio owner named in the URL.
"""

from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import Category, Certificate, Contact, Education, Experience, Portfolio, Skill
from .serializers import (
    AboutSerializer,
    CategorySerializer,
    CertificateSerializer,
    ContactSerializer,
    EducationSerializer,
    ExperienceSerializer,
    PortfolioSerializer,
    ProjectCardSerializer,
    ProjectDetailSerializer,
    SkillSerializer,
)
from .services import AboutService, ProjectService

User = get_user_model()


class PortfolioOwnerMixin:
    """Resolves the portfolio owner from the <username> URL segment."""

    permission_classes = [AllowAny]

    def get_owner(self):
        if not hasattr(self, "_owner"):
            self._owner = get_object_or_404(
                User, username=self.kwargs["username"].lower(), is_active=True
            )
        return self._owner


class ProfileAPIView(PortfolioOwnerMixin, RetrieveAPIView):
    serializer_class = PortfolioSerializer

    def get_object(self):
        return get_object_or_404(
            Portfolio.objects.select_related("owner"), owner=self.get_owner()
        )


class AboutAPIView(PortfolioOwnerMixin, RetrieveAPIView):
    serializer_class = AboutSerializer

    def get_object(self):
        return AboutService.get_about(self.get_owner())


class SkillViewSet(PortfolioOwnerMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = SkillSerializer

    def get_queryset(self):
        return (
            Skill.objects.select_related("category")
            .prefetch_related("projects", "experiences", "certificates")
            .filter(owner=self.get_owner(), is_active=True)
            .order_by("category__display_order", "display_order")
        )


class CategoryViewSet(PortfolioOwnerMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = CategorySerializer

    def get_queryset(self):
        return Category.objects.filter(
            owner=self.get_owner(), is_active=True
        ).order_by("display_order")


class ProjectViewSet(PortfolioOwnerMixin, viewsets.ReadOnlyModelViewSet):
    lookup_field = "slug"

    def get_queryset(self):
        return ProjectService.get_all_projects(self.get_owner())

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProjectDetailSerializer
        return ProjectCardSerializer

    @action(detail=False, methods=["get"])
    def featured(self, request, username=None):
        projects = ProjectService.get_featured_projects(self.get_owner())
        serializer = self.get_serializer(projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def search(self, request, username=None):
        query = request.GET.get("q", "").strip()
        if not query:
            return Response([])
        projects = ProjectService.search_project(self.get_owner(), query)
        serializer = ProjectCardSerializer(projects, many=True, context=self.get_serializer_context())
        return Response(serializer.data)


class ExperienceViewSet(PortfolioOwnerMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = ExperienceSerializer

    def get_queryset(self):
        return Experience.objects.filter(owner=self.get_owner()).prefetch_related("skills__category")


class EducationViewSet(PortfolioOwnerMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = EducationSerializer

    def get_queryset(self):
        return Education.objects.filter(owner=self.get_owner())


class CertificateViewSet(PortfolioOwnerMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = CertificateSerializer

    def get_queryset(self):
        return Certificate.objects.filter(owner=self.get_owner()).prefetch_related("skills__category")


class ContactViewSet(PortfolioOwnerMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    """Visitors send a message to the portfolio owner."""

    queryset = Contact.objects.none()
    serializer_class = ContactSerializer
    throttle_scope = "contact"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(owner=self.get_owner())
        return Response(
            {"message": "You succesfully sent"}, status=status.HTTP_201_CREATED
        )


@api_view(["GET"])
@permission_classes([AllowAny])
def TestView(request):
    return Response("test")
