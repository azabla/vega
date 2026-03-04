from django.db import models

# Create your models here.


class Portfolio(models.Model):
    name = models.CharField(max_length=220)
    title = models.CharField(max_length=220)
    bio = models.TextField()
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    location = models.CharField(max_length=100, blank=True)
    github = models.URLField(blank=True)
    linkedin = models.Model(blank=True)
    telegram = models.Model(blank=True)
    resume = models.FileField(upload_to="resume/", blank=True, null=True)
    profile_image = models.ImageField(upload_to="profile/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    update_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Skill(models.Model):
    CATEGORY_CHOICES = {
        ("Frontend", "Frontend"),
        ("Backend", "Backend"),
        ("Database", "Database"),
        ("DevOps", "DevOps"),
        ("Tools", "Tools"),
        ("Other", "Other"),
    }

    name = models.CharField(max_length=100)
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES)
    proficiency = models.IntegerField(max_length=50, blank=True)
    icon = models.CharField(max_length=50, blank=True)
    order = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.name} ({self.category})"

    class Meta:
        ordering = ["order", "category", "name"]
