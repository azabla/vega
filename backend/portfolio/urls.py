from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProfileViewSet,
    TestView,
    SkillViewSet,
    ProjectsViewSet,
    ExperienceViewSet,
    ContactViewSet,
)


# Creating a router and register our viewSets with it(we can acess easily with out adding the url)
router = DefaultRouter()
router.register(r"profile", ProfileViewSet, basename="profile")
router.register(r"skills", SkillViewSet, basename="skills")
router.register(r"projects", ProjectsViewSet, basename="projects")
router.register(r"experience", ExperienceViewSet, basename="experience")
router.register(r"contact", ContactViewSet, basename="contact")

urlpatterns = [
    path("", include(router.urls)),
    path("testview/", TestView, name="testview"),
]
