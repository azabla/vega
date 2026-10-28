"""
Public, read-only portfolio API: /api/u/<username>/...

Every view is scoped to the portfolio owner named in the URL.
"""

from django.contrib.auth import get_user_model
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.http import content_disposition_header
from django.utils.text import slugify
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    Achievement,
    Category,
    Certificate,
    Contact,
    CV,
    Education,
    Experience,
    Language,
    Portfolio,
    Skill,
    Testimonial,
)
from .serializers import (
    AboutSerializer,
    AchievementSerializer,
    CategorySerializer,
    CertificateSerializer,
    ContactSerializer,
    CVLinkSerializer,
    EducationSerializer,
    ExperienceSerializer,
    LanguageSerializer,
    PortfolioSerializer,
    ProjectCardSerializer,
    ProjectDetailSerializer,
    SkillSerializer,
    TestimonialSerializer,
)
from .cv import portfolio_url, qr_bytes, render_cv_pdf
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


class LanguageViewSet(PortfolioOwnerMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = LanguageSerializer

    def get_queryset(self):
        return Language.objects.filter(owner=self.get_owner())


class CertificateViewSet(PortfolioOwnerMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = CertificateSerializer

    def get_queryset(self):
        return Certificate.objects.filter(owner=self.get_owner()).prefetch_related("skills__category")


class AchievementViewSet(PortfolioOwnerMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = AchievementSerializer

    def get_queryset(self):
        return Achievement.objects.filter(owner=self.get_owner())


class TestimonialViewSet(PortfolioOwnerMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = TestimonialSerializer

    def get_queryset(self):
        return Testimonial.objects.filter(owner=self.get_owner(), is_active=True).select_related("project")


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


class FileView(PortfolioOwnerMixin, APIView):
    """Serves a generated file. Never 406s on the Accept header: errors fall back to JSON."""

    def perform_content_negotiation(self, request, force=False):
        return super().perform_content_negotiation(request, force=True)

    def get_portfolio(self):
        return get_object_or_404(Portfolio.objects.select_related("owner"), owner=self.get_owner())

    def file_response(self, content, content_type, filename):
        response = HttpResponse(content, content_type=content_type)
        as_attachment = bool(self.request.GET.get("download"))
        response["Content-Disposition"] = content_disposition_header(as_attachment, filename)
        return response


class CVPDFView(FileView):
    """
    A CV as a PDF, built from the profile: the default one at cv.pdf, any public
    version at cv/<slug>.pdf. 404 when the owner turned the résumé page off.
    """

    throttle_scope = "cv"

    def get(self, request, username, slug=None):
        portfolio = self.get_portfolio()
        if portfolio.settings.get("pages", {}).get("resume") is False:
            raise Http404("This portfolio has no résumé.")
        cv = get_object_or_404(CV, owner=portfolio.owner, slug=slug, is_public=True) if slug else None
        pdf = render_cv_pdf(portfolio, portfolio_url(request, portfolio.owner.username), cv)
        name = slugify(portfolio.name) or portfolio.owner.username
        return self.file_response(pdf, "application/pdf", f"{name}-{slug or 'cv'}.pdf")


class CVListView(PortfolioOwnerMixin, ListAPIView):
    """The owner's public CV versions, for "Download PDF" choices on the résumé page."""

    serializer_class = CVLinkSerializer
    pagination_class = None

    def get_queryset(self):
        portfolio = get_object_or_404(Portfolio, owner=self.get_owner())
        if portfolio.settings.get("pages", {}).get("resume") is False:
            return CV.objects.none()
        return CV.objects.filter(owner=self.get_owner(), is_public=True)


class QRCodeView(FileView):
    """QR code that opens the public portfolio, as SVG (print) or PNG (chat apps)."""

    def get(self, request, username, kind):
        username = self.get_owner().username
        content_type = "image/svg+xml" if kind == "svg" else "image/png"
        content = qr_bytes(portfolio_url(request, username), kind)
        return self.file_response(content, content_type, f"{username}-qr.{kind}")


@api_view(["GET"])
@permission_classes([AllowAny])
def TestView(request):
    return Response("test")
