"""
Owner API: /api/me/...

A logged-in user creates, edits and deletes their own portfolio content.
Every queryset is filtered to request.user, so other users' objects return 404.
"""

from django.conf import settings
from django.db import transaction
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.http import content_disposition_header
from django.utils.text import slugify
from rest_framework import generics, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import domains
from . import manage_serializers as s
from .cv import portfolio_url, preview_pages, regions, render_cv_document, render_cv_pdf
from .models import (
    About,
    AboutPhoto,
    Category,
    Achievement,
    Certificate,
    Contact,
    CV,
    Education,
    Experience,
    Language,
    LessonLearned,
    Portfolio,
    Principle,
    Project,
    ProjectArchitecture,
    ProjectChallenge,
    ProjectFeature,
    ProjectImage,
    ProjectMetric,
    Service,
    Skill,
    Testimonial,
)


def get_or_create_portfolio(user):
    portfolio, _ = Portfolio.objects.get_or_create(
        owner=user,
        defaults={"name": user.get_full_name() or user.username, "email": user.email},
    )
    return portfolio


def get_or_create_about(user):
    about = About.objects.filter(owner=user).order_by("-updated_at").first()
    if about is None:
        about = About.objects.create(owner=user, heading="About me", title="", description="")
    return about


class MyProfileView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/me/profile/ — created on first access."""

    serializer_class = s.MyPortfolioSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return get_or_create_portfolio(self.request.user)


class MyDomainView(APIView):
    """
    GET/PUT/DELETE /api/me/domain/: the portfolio's addresses and the owner's own domain.
    PUT {"domain": "hana.com"} connects one (unverified until its DNS TXT record is found).
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(domains.domain_state(get_or_create_portfolio(request.user), request))

    def put(self, request):
        if not settings.CUSTOM_DOMAINS:
            return Response({"detail": "Custom domains aren't available on this site yet."}, status=status.HTTP_400_BAD_REQUEST)
        portfolio = get_or_create_portfolio(request.user)
        try:
            domain = domains.clean_domain(request.data.get("domain"))
        except ValueError as e:
            return Response({"domain": [str(e)]}, status=status.HTTP_400_BAD_REQUEST)
        if Portfolio.objects.filter(custom_domain=domain).exclude(pk=portfolio.pk).exists():
            return Response({"domain": ["That domain is connected to another portfolio."]}, status=status.HTTP_400_BAD_REQUEST)
        if domain != portfolio.custom_domain:
            domains.forget_domain(portfolio.custom_domain)
            portfolio.custom_domain = domain
            portfolio.domain_token = domains.new_token()
            portfolio.domain_verified_at = None
            portfolio.save(update_fields=["custom_domain", "domain_token", "domain_verified_at"])
        return Response(domains.domain_state(portfolio, request))

    def delete(self, request):
        portfolio = get_or_create_portfolio(request.user)
        domains.forget_domain(portfolio.custom_domain)
        portfolio.custom_domain, portfolio.domain_token, portfolio.domain_verified_at = None, "", None
        portfolio.save(update_fields=["custom_domain", "domain_token", "domain_verified_at"])
        return Response(domains.domain_state(portfolio, request))


class MyDomainVerifyView(APIView):
    """POST /api/me/domain/verify/: look the DNS records up now."""

    permission_classes = [IsAuthenticated]
    throttle_scope = "domain"

    def post(self, request):
        portfolio = get_or_create_portfolio(request.user)
        if not portfolio.custom_domain:
            return Response({"detail": "Connect a domain first."}, status=status.HTTP_400_BAD_REQUEST)
        check = domains.check_domain(portfolio)
        return Response({**domains.domain_state(portfolio, request), "check": check})


class MyAboutView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/me/about/ — created on first access."""

    serializer_class = s.MyAboutSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return get_or_create_about(self.request.user)


class OwnedViewSet(viewsets.ModelViewSet):
    """CRUD limited to objects whose `owner_lookup` resolves to request.user."""

    permission_classes = [IsAuthenticated]
    owner_lookup = "owner"
    model = None

    def get_queryset(self):
        return self.model.objects.filter(**{self.owner_lookup: self.request.user})


class MyServiceViewSet(OwnedViewSet):
    model = Service
    owner_lookup = "about__owner"
    serializer_class = s.MyServiceSerializer

    def perform_create(self, serializer):
        serializer.save(about=get_or_create_about(self.request.user))


class AboutChildViewSet(OwnedViewSet):
    """Principles and photos, attached to the user's about section."""

    owner_lookup = "about__owner"

    def perform_create(self, serializer):
        serializer.save(about=get_or_create_about(self.request.user))


class MyPrincipleViewSet(AboutChildViewSet):
    model = Principle
    serializer_class = s.MyPrincipleSerializer


class MyAboutPhotoViewSet(AboutChildViewSet):
    model = AboutPhoto
    serializer_class = s.MyAboutPhotoSerializer


class MyCategoryViewSet(OwnedViewSet):
    model = Category
    serializer_class = s.MyCategorySerializer


class MySkillViewSet(OwnedViewSet):
    model = Skill
    serializer_class = s.MySkillSerializer


class MyProjectViewSet(OwnedViewSet):
    model = Project
    serializer_class = s.MyProjectSerializer

    def get_queryset(self):
        return super().get_queryset().prefetch_related("skills")


class ProjectChildViewSet(OwnedViewSet):
    """Gallery images, features, ... Filter by project with ?project=<id>."""

    owner_lookup = "project__owner"

    def get_queryset(self):
        qs = super().get_queryset()
        project = self.request.query_params.get("project")
        if project:
            qs = qs.filter(project_id=project)
        return qs


class MyProjectImageViewSet(ProjectChildViewSet):
    model = ProjectImage
    serializer_class = s.MyProjectImageSerializer


class MyProjectFeatureViewSet(ProjectChildViewSet):
    model = ProjectFeature
    serializer_class = s.MyProjectFeatureSerializer


class MyProjectChallengeViewSet(ProjectChildViewSet):
    model = ProjectChallenge
    serializer_class = s.MyProjectChallengeSerializer


class MyProjectMetricViewSet(ProjectChildViewSet):
    model = ProjectMetric
    serializer_class = s.MyProjectMetricSerializer


class MyLessonLearnedViewSet(ProjectChildViewSet):
    model = LessonLearned
    serializer_class = s.MyLessonLearnedSerializer


class MyProjectArchitectureViewSet(ProjectChildViewSet):
    model = ProjectArchitecture
    serializer_class = s.MyProjectArchitectureSerializer


class MyExperienceViewSet(OwnedViewSet):
    model = Experience
    serializer_class = s.MyExperienceSerializer


class MyEducationViewSet(OwnedViewSet):
    model = Education
    serializer_class = s.MyEducationSerializer


class MyLanguageViewSet(OwnedViewSet):
    model = Language
    serializer_class = s.MyLanguageSerializer


class MyCertificateViewSet(OwnedViewSet):
    model = Certificate
    serializer_class = s.MyCertificateSerializer


class MyAchievementViewSet(OwnedViewSet):
    model = Achievement
    serializer_class = s.MyAchievementSerializer


class MyTestimonialViewSet(OwnedViewSet):
    model = Testimonial
    serializer_class = s.MyTestimonialSerializer


class MyMessageViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """Contact-form messages sent to the user: read and delete only."""

    permission_classes = [IsAuthenticated]
    serializer_class = s.MyMessageSerializer

    def get_queryset(self):
        return Contact.objects.filter(owner=self.request.user)


class MyCVViewSet(OwnedViewSet):
    """The owner's CV versions. Each one picks a template, design and content from the profile."""

    model = CV
    serializer_class = s.MyCVSerializer

    def perform_content_negotiation(self, request, force=False):
        # pdf/ answers any Accept header; errors still come back as JSON
        return super().perform_content_negotiation(request, force=True)

    @transaction.atomic
    def perform_destroy(self, instance):
        was_default = instance.is_default
        instance.delete()
        successor = CV.objects.filter(owner=self.request.user).first()
        if was_default and successor:
            successor.is_default = True
            successor.save()

    @action(detail=True, methods=["post"])
    def duplicate(self, request, pk=None):
        original = self.get_object()
        copy = CV.objects.create(
            owner=request.user,
            name=f"{original.name} (copy)"[:120],
            template=original.template,
            design=original.design,
            content=original.content,
            photo=original.photo.name or None,
            is_default=False,
            is_public=original.is_public,
        )
        return Response(self.get_serializer(copy).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"])
    def pdf(self, request, pk=None):
        """Download any of the owner's CVs, public or not."""
        cv = self.get_object()
        portfolio = get_or_create_portfolio(request.user)
        pdf = render_cv_pdf(portfolio, portfolio_url(request, portfolio), cv)
        response = HttpResponse(pdf, content_type="application/pdf")
        name = f"{slugify(portfolio.name) or request.user.username}-{cv.slug}.pdf"
        response["Content-Disposition"] = content_disposition_header(True, name)
        return response


class MyCVPreviewView(APIView):
    """POST a draft (template, design, content) and get its pages back as images."""

    permission_classes = [IsAuthenticated]
    throttle_scope = "cv_preview"

    def post(self, request):
        serializer = s.CVPreviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        draft = serializer.validated_data
        saved = draft.get("id") and get_object_or_404(CV, pk=draft["id"], owner=request.user)
        cv = CV(
            owner=request.user,
            name=saved.name if saved else "Preview",
            template=draft.get("template", CV._meta.get_field("template").default),
            design=draft.get("design", {}),
            content=draft.get("content", {}),
            photo=saved.photo if saved else None,
        )
        portfolio = get_or_create_portfolio(request.user)
        document = render_cv_document(portfolio, portfolio_url(request, portfolio), cv)
        # page images plus where each section sits, so the editor can make them clickable
        return Response({**preview_pages(document.write_pdf()), "regions": regions(document)})
