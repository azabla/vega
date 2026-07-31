import typing
from rest_framework import viewsets, status
import rest_framework
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from typing import Type
from rest_framework.serializers import BaseSerializer

from .services import AboutService, ProjectService
from .models import Portfolio, Project, Skill, Contact, Experience, Category
from .serializers import (
    AboutSerializer,
    CategorySerializer,
    SkillSerializer,
    PortfolioSerializer,
    ContactSerializer,
    ExperienceSerializer,
    ProjectCardSerializer,
    ProjectDetailSerializer,
)
from rest_framework.generics import RetrieveAPIView


class ProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Portfolio.objects.all()
    serializer_class = PortfolioSerializer

    @action(detail=False)
    def main(self, request):
        profile = self.queryset.first()
        if profile:
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        return Response(
            {"detail": "No profile found"}, status=status.HTTP_404_NOT_FOUND
        )


class AboutAPIView(RetrieveAPIView):

    serializer_class = AboutSerializer

    def get_object(self):
        return AboutService.get_about()


class SkillViewSet(viewsets.ReadOnlyModelViewSet):

    serializer_class = SkillSerializer

    queryset = (
        Skill.objects.select_related("category")
        .filter(is_active=True)
        .order_by("category__display_order", "display_order")
    )


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CategorySerializer

    queryset = Category.objects.filter(is_active=True).order_by("display_order")


class ProjectViewSet(viewsets.ReadOnlyModelViewSet):

    lookup_field = "slug"

    def get_queryset(self):

        return ProjectService.get_all_projects()

    def get_serializer_class(self):

        if self.action == "retrieve":
            return ProjectDetailSerializer

        return ProjectCardSerializer

    @action(
        detail=False,
        methods=["get"],
    )
    def featured(self, request):

        projects = ProjectService.get_featured_projects()

        serializer = ProjectCardSerializer(projects, many=True)

        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def search(self, request):

        query = request.GET.get("q")

        projects = ProjectService.search_project(query)

        serializer = ProjectCardSerializer(projects, many=True)

        return Response(serializer.data)


class ExperienceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Experience.objects.all()
    serializer_class = ExperienceSerializer


class ContactViewSet(viewsets.ModelViewSet):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer
    http_method_names = ["post"]

    def create(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "You succesfully sent"}, status=status.HTTP_201_CREATED
            )
        return Response(serializer.errrors, status=status.HTTP_404_NOT_FOUND)


@api_view(["GET"])
def TestView(request):
    return Response("test")
