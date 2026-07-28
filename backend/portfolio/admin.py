from django.contrib import admin
from .models import (
    About,
    Portfolio,
    Projects,
    Service,
    Skill,
    Contact,
    Experience,
    Category,
    Technology,
)

# Register your models here.

admin.site.register(Category)
admin.site.register(Technology)
admin.site.register(Portfolio)
admin.site.register(Projects)
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
