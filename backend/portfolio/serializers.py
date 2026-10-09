from rest_framework import serializers
from .models import (
    About,
    AboutPhoto,
    Certificate,
    Education,
    Language,
    Portfolio,
    Principle,
    ProjectMetric,
    Service,
    Skill,
    Contact,
    Experience,
    Category,
    Project,
    ProjectImage,
    ProjectFeature,
    ProjectChallenge,
    LessonLearned,
    ProjectArchitecture,
    Testimonial,
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug"]


class PortfolioSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="owner.username", read_only=True)

    class Meta:
        model = Portfolio
        exclude = ["owner"]
        read_only_fields = ["created_at", "update_at"]


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            "id",
            "title",
            "description",
            "display_order",
        ]


class PrincipleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Principle
        fields = ["id", "title", "description"]


class AboutPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = AboutPhoto
        fields = ["id", "image", "caption"]


class AboutSerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)
    principles = PrincipleSerializer(many=True, read_only=True)
    photos = AboutPhotoSerializer(many=True, read_only=True)

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
            "interests",
            "services",
            "principles",
            "photos",
        ]


class SkillTagSerializer(serializers.ModelSerializer):
    """Compact skill, used inside projects, experience and certificates."""

    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = Skill
        fields = ["id", "name", "slug", "icon", "category_name"]


class SkillSerializer(serializers.ModelSerializer):
    """A skill with the evidence behind it: projects, jobs and certificates."""

    category = CategorySerializer(read_only=True)
    evidence = serializers.SerializerMethodField()

    class Meta:
        model = Skill
        fields = [
            "id",
            "name",
            "slug",
            "icon",
            "category",
            "years_of_experience",
            "evidence",
        ]

    def get_evidence(self, skill):
        return {
            "projects": [{"title": p.title, "slug": p.slug} for p in skill.projects.all()],
            "experience": [{"position": e.position, "company": e.company} for e in skill.experiences.all()],
            "certificates": [{"name": c.name, "issuer": c.issuer} for c in skill.certificates.all()],
        }


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


class ProjectMetricSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectMetric
        fields = ("id", "value", "label", "description")


class ProjectArchitectureSerializer(serializers.ModelSerializer):

    class Meta:

        model = ProjectArchitecture

        fields = (
            "description",
            "diagram",
        )


class ProjectCardSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    skills = SkillTagSerializer(
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
            "skills",
            "featured",
            "category",
            "status",
            "status_display",
            "role",
            "started_on",
            "ended_on",
            "github_url",
            "live_url",
        )


class ProjectListSerializer(ProjectCardSerializer):
    pass


class ProjectDetailSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    skills = SkillTagSerializer(
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

    metrics = ProjectMetricSerializer(many=True, read_only=True)

    class Meta:

        model = Project

        fields = (
            "id",
            "title",
            "slug",
            "summary",
            "overview",
            "problem",
            "results",
            "metrics",
            "thumbnail",
            "github_url",
            "live_url",
            "skills",
            "featured",
            "status",
            "status_display",
            "category",
            "role",
            "team_size",
            "started_on",
            "ended_on",
            "gallery",
            "features",
            "challenges",
            "created_at",
            "lessons",
            "architecture",
        )


class ExperienceSerializer(serializers.ModelSerializer):
    employment_type_display = serializers.CharField(source="get_employment_type_display", read_only=True)
    skills = SkillTagSerializer(many=True, read_only=True)

    class Meta:
        model = Experience
        exclude = ["owner"]


class EducationSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source="get_level_display", read_only=True)

    class Meta:
        model = Education
        exclude = ["owner"]


class LanguageSerializer(serializers.ModelSerializer):
    proficiency_display = serializers.CharField(source="get_proficiency_display", read_only=True)

    class Meta:
        model = Language
        fields = ["id", "name", "proficiency", "proficiency_display"]


class CertificateSerializer(serializers.ModelSerializer):
    skills = SkillTagSerializer(many=True, read_only=True)

    class Meta:
        model = Certificate
        exclude = ["owner"]


class TestimonialSerializer(serializers.ModelSerializer):
    project = serializers.SerializerMethodField()

    class Meta:
        model = Testimonial
        fields = ["id", "name", "role", "company", "quote", "photo", "url", "project"]

    def get_project(self, testimonial):
        p = testimonial.project
        return {"title": p.title, "slug": p.slug} if p else None


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        exclude = ["owner"]
        read_only_fields = ["created_at"]
