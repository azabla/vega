from django.contrib import admin
from .models import (
    About,
    Portfolio,
    Service,
    Skill,
    Contact,
    Experience,
    Category,
    Certificate,
    Education,
    Language,
    Project,
    ProjectImage,
    ProjectFeature,
    ProjectChallenge,
    LessonLearned,
    ProjectArchitecture,
)

# Register your models here.

class OwnedAdmin(admin.ModelAdmin):
    """Superusers see every user's content; filter by owner."""

    list_filter = ["owner"]
    list_select_related = ["owner"]


@admin.register(Portfolio)
class PortfolioAdmin(OwnedAdmin):
    list_display = ["name", "owner", "title", "update_at"]
    search_fields = ["name", "owner__username", "owner__email"]


@admin.register(Category)
class CategoryAdmin(OwnedAdmin):
    list_display = ["name", "owner", "display_order", "is_active"]


@admin.register(Skill)
class SkillAdmin(OwnedAdmin):
    list_display = ["name", "owner", "category", "years_of_experience", "is_active"]
    search_fields = ["name"]


@admin.register(Contact)
class ContactAdmin(OwnedAdmin):
    list_display = ["name", "email", "owner", "subject", "created_at"]


@admin.register(Experience)
class ExperienceAdmin(OwnedAdmin):
    list_display = ["position", "company", "employment_type", "owner", "start_date", "current"]
    filter_horizontal = ["skills"]


@admin.register(Education)
class EducationAdmin(OwnedAdmin):
    list_display = ["institution", "level", "field_of_study", "owner", "start_date", "end_date"]


@admin.register(Language)
class LanguageAdmin(OwnedAdmin):
    list_display = ["name", "proficiency", "owner", "order"]


@admin.register(Certificate)
class CertificateAdmin(OwnedAdmin):
    list_display = ["name", "issuer", "owner", "issue_date"]
    filter_horizontal = ["skills"]


@admin.register(About)
class AboutAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "owner",
        "experience_years",
        "is_active",
        "updated_at",
    ]

    list_filter = ["is_active", "owner"]

    search_fields = ["title", "description"]


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "about",
        "display_order",
        "is_active",
    ]

    list_filter = [
        "is_active",
    ]

    search_fields = [
        "title",
        "description",
    ]


class ProjectImageInline(admin.TabularInline):
    model = ProjectImage
    extra = 1


class ProjectFeatureInline(admin.TabularInline):

    model = ProjectFeature

    extra = 1


class ProjectChallengeInline(admin.TabularInline):

    model = ProjectChallenge

    extra = 1


class LessonLearnedInline(admin.TabularInline):
    model = LessonLearned

    extra = 1


class ProjectArchitectureInline(admin.StackedInline):
    model = ProjectArchitecture

    extra = 0

    max_num = 1


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):

    list_display = (
        "title",
        "owner",
        "status",
        "featured",
        "order",
        "created_at",
    )

    search_fields = (
        "title",
        "summary",
    )

    list_filter = ("featured", "owner")

    ordering = (
        "-featured",
        "order",
    )

    filter_horizontal = ("skills",)

    prepopulated_fields = {
        "slug": ("title",),
    }

    inlines = [
        ProjectFeatureInline,
        ProjectChallengeInline,
        LessonLearnedInline,
        ProjectArchitectureInline,
        ProjectImageInline,
    ]
