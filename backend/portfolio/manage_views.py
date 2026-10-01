"""
Owner API: /api/me/...

A logged-in user creates, edits and deletes their own portfolio content.
Every queryset is filtered to request.user, so other users' objects return 404.
"""

from rest_framework import generics, mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from . import manage_serializers as s
from .models import (
    About,
    Category,
    Certificate,
    Contact,
    Education,
    Experience,
    LessonLearned,
    Portfolio,
    Project,
    ProjectArchitecture,
    ProjectChallenge,
    ProjectFeature,
    ProjectImage,
    Service,
    Skill,
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


class MyCertificateViewSet(OwnedViewSet):
    model = Certificate
    serializer_class = s.MyCertificateSerializer


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
