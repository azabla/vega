from django.contrib import admin
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

# Register your models here.

admin.site.register(Category)
admin.site.register(Portfolio)

admin.site.register(Skill)
admin.site.register(Contact)
admin.site.register(Experience)


@admin.register(About)
class AboutAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "experience_years",
        "is_active",
        "updated_at",
    ]

    list_filter = ["is_active"]

    search_fields = ["title", "description"]


@admin.register(Technology)
class TechnologyAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "slug",
    )

    search_fields = ("name",)

    prepopulated_fields = {
        "slug": ("name",),
    }


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
        "featured",
        "order",
        "created_at",
    )

    search_fields = (
        "title",
        "summary",
    )

    list_filter = ("featured",)

    ordering = (
        "-featured",
        "order",
    )

    ordering = (
        "-featured",
        "order",
    )

    filter_horizontal = ("technologies",)

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
