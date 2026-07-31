from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AboutAPIView,
    CategoryViewSet,
    ProfileViewSet,
    TestView,
    SkillViewSet,
    ProjectViewSet,
    ExperienceViewSet,
    ContactViewSet,
)
from .views import AboutAPIView

# Creating a router and register our viewSets with it(we can acess easily with out adding the url)
router = DefaultRouter()
router.register(r"profile", ProfileViewSet, basename="profile")
router.register(r"categories", CategoryViewSet, basename="categories")
router.register(r"skills", SkillViewSet, basename="skills")
router.register(r"experience", ExperienceViewSet, basename="experience")
router.register(r"contact", ContactViewSet, basename="contact")
router.register("projects", ProjectViewSet, basename="projects")

urlpatterns = [
    path("", include(router.urls)),
    path("testview/", TestView, name="testview"),
    path(
        "about/",
        AboutAPIView.as_view(),
        name="about",
    ),
]
