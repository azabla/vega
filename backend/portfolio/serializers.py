from rest_framework import serializers
from .models import (
    Portfolio,
    Projects,
    Skill,
    Contact,
    Experience,
    Category,
    Technology,
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]


class PortfolioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Portfolio
        fields = "__all__"


class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = "__all__"


class TechnologySerializer(serializers.ModelSerializer):
    # This pulls the category name directly into the tech object
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Technology
        fields = ["id", "name", "category_name"]


class ProjectsSerializer(serializers.ModelSerializer):
    # This will list all technologies assigned to the project
    technologies = TechnologySerializer(many=True, read_only=True)

    # This allows you to send a list of IDs when creating/updating
    technology_ids = serializers.PrimaryKeyRelatedField(
        queryset=Technology.objects.all(),
        source="technologies",
        many=True,
        write_only=True,
    )

    class Meta:
        model = Projects
        fields = [
            "id",
            "title",
            "description",
            "image",
            "technologies",
            "technology_ids",
        ]


class ExperienceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Experience
        fields = "__all__"


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = "__all__"
        read_only_fields = ["created_at"]
