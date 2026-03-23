from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from .models import Portfolio, Projects, Skill, Contact, Experience
from .serializers import (
    ProjectsSerializer,
    SkillSerializer,
    PortfolioSerializer,
    ContactSerializer,
    ExperienceSerializer,
)


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


class SkillViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer

    @action(detail=False, methods=["get"])  # Explicitly set GET
    def by_category(self, request):
        skills = self.get_queryset()  # Better practice than self.queryset.all()
        categories = {}
        for skill in skills:  # type: ignore
            # Use the name of the category as the key, not the object itself
            cat_name = skill.category.name if skill.category else "Uncategorized"

            if cat_name not in categories:
                categories[cat_name] = []

            categories[cat_name].append(self.get_serializer(skill).data)

        return Response(categories)


class ProjectsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Projects.objects.all()
    serializer_class = ProjectsSerializer

    @action(detail=False, methods=["get"])  # Explicitly set GET
    def featured(self, request):
        featured_project = self.queryset.filter(
            featured=True
        )  # Better practice than self.queryset.all()
        serializer = self.get_serializer(featured_project, many=True).data

        return Response(serializer)


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
