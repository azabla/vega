from django.contrib import admin
from .models import (
    Portfolio,
    Projects,
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
