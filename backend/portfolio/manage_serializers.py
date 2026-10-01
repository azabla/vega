"""
Write serializers for the owner API (/api/me/...).

`owner` is a hidden field filled from the logged-in user, which also lets DRF
enforce the per-owner unique constraints with proper 400 errors. Related
fields only accept objects that belong to the same user.
"""

from rest_framework import serializers

from .models import (
    About,
    Category,
    Certificate,
    Education,
    Contact,
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


class OwnedPrimaryKeyRelatedField(serializers.PrimaryKeyRelatedField):
    """PK field limited to objects owned by the requesting user."""

    def __init__(self, owner_path="owner", **kwargs):
        self.owner_path = owner_path
        super().__init__(**kwargs)

    def get_queryset(self):
        user = self.context["request"].user
        return super().get_queryset().filter(**{self.owner_path: user})


class OwnedModelSerializer(serializers.ModelSerializer):
    owner = serializers.HiddenField(default=serializers.CurrentUserDefault())


class SluggedModelSerializer(OwnedModelSerializer):
    # Optional: the model generates a slug from the name/title when blank.
    # The default keeps DRF's (owner, slug) uniqueness check from requiring it.
    slug = serializers.SlugField(required=False, allow_blank=True, default="")


class MyPortfolioSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="owner.username", read_only=True)

    class Meta:
        model = Portfolio
        exclude = ["owner"]
        read_only_fields = ["created_at", "update_at"]


class MyServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ["id", "title", "description", "display_order", "is_active"]


class MyAboutSerializer(serializers.ModelSerializer):
    services = MyServiceSerializer(many=True, read_only=True)

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
            "is_active",
            "services",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]


class MyCategorySerializer(SluggedModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "owner", "name", "slug", "display_order", "is_active"]


class MySkillSerializer(SluggedModelSerializer):
    category = OwnedPrimaryKeyRelatedField(queryset=Category.objects.all())

    class Meta:
        model = Skill
        fields = [
            "id",
            "owner",
            "name",
            "slug",
            "icon",
            "category",
            "years_of_experience",
            "display_order",
            "is_active",
        ]


class MyProjectSerializer(SluggedModelSerializer):
    skills = OwnedPrimaryKeyRelatedField(queryset=Skill.objects.all(), many=True, required=False)

    class Meta:
        model = Project
        fields = [
            "id",
            "owner",
            "title",
            "slug",
            "summary",
            "overview",
            "thumbnail",
            "skills",
            "github_url",
            "live_url",
            "order",
            "featured",
            "created_at",
        ]
        read_only_fields = ["created_at"]


def project_child_serializer(model_class, child_fields):
    """Serializer for a model hanging off a project (gallery, features, ...)."""

    class Meta:
        model = model_class
        fields = ["id", "project", *child_fields]

    return type(
        f"My{model_class.__name__}Serializer",
        (serializers.ModelSerializer,),
        {
            "project": OwnedPrimaryKeyRelatedField(queryset=Project.objects.all()),
            "Meta": Meta,
        },
    )


MyProjectImageSerializer = project_child_serializer(ProjectImage, ["image", "caption", "order"])
MyProjectFeatureSerializer = project_child_serializer(
    ProjectFeature, ["title", "description", "image", "demo_url", "documentation_url", "order"]
)
MyProjectChallengeSerializer = project_child_serializer(ProjectChallenge, ["problem", "solution", "order"])
MyLessonLearnedSerializer = project_child_serializer(LessonLearned, ["title", "description", "order"])
MyProjectArchitectureSerializer = project_child_serializer(ProjectArchitecture, ["description", "diagram"])


class MyExperienceSerializer(OwnedModelSerializer):
    skills = OwnedPrimaryKeyRelatedField(queryset=Skill.objects.all(), many=True, required=False)

    class Meta:
        model = Experience
        fields = [
            "id",
            "owner",
            "company",
            "position",
            "employment_type",
            "location",
            "description",
            "start_date",
            "end_date",
            "current",
            "company_logo",
            "skills",
        ]


class MyEducationSerializer(OwnedModelSerializer):
    class Meta:
        model = Education
        fields = [
            "id",
            "owner",
            "institution",
            "level",
            "field_of_study",
            "start_date",
            "end_date",
            "current",
            "grade",
            "description",
            "order",
        ]


class MyCertificateSerializer(OwnedModelSerializer):
    skills = OwnedPrimaryKeyRelatedField(queryset=Skill.objects.all(), many=True, required=False)

    class Meta:
        model = Certificate
        fields = [
            "id",
            "owner",
            "name",
            "issuer",
            "issue_date",
            "expiry_date",
            "credential_id",
            "credential_url",
            "file",
            "skills",
            "order",
        ]


class MyMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ["id", "name", "email", "subject", "message", "created_at"]
        read_only_fields = fields
