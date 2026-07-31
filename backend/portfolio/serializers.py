from unicodedata import category
from rest_framework import serializers
from .models import (
    About,
    Portfolio,
    Service,
    Skill,
    Contact,
    Experience,
    Category,
    Technology,
    Project,
    ProjectImage,
    ProjectFeature,
    ProjectChallenge,
    LessonLearned,
    ProjectArchitecture,
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class PortfolioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Portfolio
        fields = "__all__"


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            "id",
            "title",
            "description",
            "display_order",
        ]


class AboutSerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)

    class Meta:
        model = About
        fields = [
            "id",
            "heading",
            "title",
            "experience_years",
            "description",
            "description_2",
            "cv_file",
            "services",
        ]


class SkillSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Skill
        fields = [
            "id",
            "name",
            "slug",
            "icon",
            "category",
        ]


class TechnologySerializer(serializers.ModelSerializer):
    # This pulls the category name directly into the tech object
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Technology
        fields = ["id", "name", "slug", "icon", "category_name"]


class ProjectImageSerializer(serializers.ModelSerializer):

    class Meta:

        model = ProjectImage

        fields = (
            "id",
            "image",
            "caption",
        )


class ProjectFeatureSerializer(serializers.ModelSerializer):

    class Meta:

        model = ProjectFeature

        fields = (
            "id",
            "title",
            "description",
            "image",
            "demo_url",
            "documentation_url",
        )


class ProjectChallengeSerializer(serializers.ModelSerializer):

    class Meta:

        model = ProjectChallenge

        fields = (
            "id",
            "problem",
            "solution",
        )


class ProjectLessonSerializer(serializers.ModelSerializer):

    class Meta:

        model = LessonLearned

        fields = (
            "id",
            "title",
            "description",
        )


class ProjectArchitectureSerializer(serializers.ModelSerializer):

    class Meta:

        model = ProjectArchitecture

        fields = (
            "description",
            "diagram",
        )


class ProjectCardSerializer(serializers.ModelSerializer):

    technologies = TechnologySerializer(
        many=True,
        read_only=True,
    )

    class Meta:

        model = Project

        fields = (
            "id",
            "title",
            "slug",
            "summary",
            "thumbnail",
            "technologies",
            "featured",
            "github_url",
            "live_url",
        )


class ProjectListSerializer(ProjectCardSerializer):
    pass


class ProjectDetailSerializer(serializers.ModelSerializer):

    technologies = TechnologySerializer(
        many=True,
        read_only=True,
    )

    gallery = ProjectImageSerializer(
        many=True,
        read_only=True,
    )

    features = ProjectFeatureSerializer(
        many=True,
        read_only=True,
    )

    challenges = ProjectChallengeSerializer(
        many=True,
        read_only=True,
    )

    lessons = ProjectLessonSerializer(
        many=True,
        read_only=True,
    )

    architecture = ProjectArchitectureSerializer(
        read_only=True,
    )

    class Meta:

        model = Project

        fields = (
            "id",
            "title",
            "slug",
            "summary",
            "overview",
            "thumbnail",
            "github_url",
            "live_url",
            "technologies",
            "featured",
            "gallery",
            "features",
            "challenges",
            "created_at",
            "lessons",
            "architecture",
        )


class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = "__all__"


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = "__all__"
        read_only_fields = ["created_at"]
