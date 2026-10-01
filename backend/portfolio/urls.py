from django.urls import include, path
from rest_framework.routers import SimpleRouter

from . import manage_views as me
from .views import (
    AboutAPIView,
    CategoryViewSet,
    ContactViewSet,
    ExperienceViewSet,
    ProfileAPIView,
    ProjectViewSet,
    SkillViewSet,
    TestView,
)

# Public, read-only: /api/u/<username>/...
public_router = SimpleRouter()
public_router.register(r"categories", CategoryViewSet, basename="categories")
public_router.register(r"skills", SkillViewSet, basename="skills")
public_router.register(r"experience", ExperienceViewSet, basename="experience")
public_router.register(r"contact", ContactViewSet, basename="contact")
public_router.register(r"projects", ProjectViewSet, basename="projects")

# Owner, authenticated: /api/me/...
me_router = SimpleRouter()
me_router.register(r"services", me.MyServiceViewSet, basename="my-services")
me_router.register(r"categories", me.MyCategoryViewSet, basename="my-categories")
me_router.register(r"skills", me.MySkillViewSet, basename="my-skills")
me_router.register(r"technologies", me.MyTechnologyViewSet, basename="my-technologies")
me_router.register(r"projects", me.MyProjectViewSet, basename="my-projects")
me_router.register(r"project-images", me.MyProjectImageViewSet, basename="my-project-images")
me_router.register(r"project-features", me.MyProjectFeatureViewSet, basename="my-project-features")
me_router.register(r"project-challenges", me.MyProjectChallengeViewSet, basename="my-project-challenges")
me_router.register(r"project-lessons", me.MyLessonLearnedViewSet, basename="my-project-lessons")
me_router.register(
    r"project-architecture", me.MyProjectArchitectureViewSet, basename="my-project-architecture"
)
me_router.register(r"experience", me.MyExperienceViewSet, basename="my-experience")
me_router.register(r"messages", me.MyMessageViewSet, basename="my-messages")

urlpatterns = [
    path("testview/", TestView, name="testview"),
    path("me/profile/", me.MyProfileView.as_view(), name="my-profile"),
    path("me/about/", me.MyAboutView.as_view(), name="my-about"),
    path("me/", include(me_router.urls)),
    path("u/<str:username>/profile/", ProfileAPIView.as_view(), name="profile"),
    path("u/<str:username>/about/", AboutAPIView.as_view(), name="about"),
    path("u/<str:username>/", include(public_router.urls)),
]
