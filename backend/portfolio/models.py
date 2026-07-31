from ast import mod
from django.db import models
from django.forms import ImageField
from .utils import generate_unique_slug

# Create your models here.


class Portfolio(models.Model):
    name = models.CharField(max_length=220)
    title = models.CharField(max_length=220)
    bio = models.TextField()
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    location = models.CharField(max_length=100, blank=True)
    github = models.URLField(blank=True)
    linkedin = models.URLField(blank=True)
    telegram = models.URLField(blank=True)
    resume = models.FileField(upload_to="resume/", blank=True, null=True)
    profile_image = models.ImageField(upload_to="profile/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    update_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class About(models.Model):

    heading = models.CharField(max_length=200)
    title = models.CharField(max_length=255)

    experience_years = models.PositiveIntegerField(default=0)

    description = models.TextField()
    description_2 = models.TextField(blank=True)

    cv_file = models.FileField(upload_to="portfolio/cv/", blank=True, null=True)

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self):
        return self.title


class Service(models.Model):
    about = models.ForeignKey(About, on_delete=models.CASCADE, related_name="services")
    title = models.CharField(max_length=100)
    description = models.TextField()
    display_order = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["display_order", "id"]

    def __str__(self):
        return self.title


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(
        unique=True,
        blank=True,
        null=True,
    )
    display_order = models.PositiveBigIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(self, self.name)
        super().save(*args, **kwargs)

    class Meta:
        # The name for a single item
        verbose_name = "Category"
        # The name used for the plural list (usually in the Admin)
        verbose_name_plural = "Categories"
        ordering = ["display_order", "name"]

    def __str__(self):
        return self.name


class Skill(models.Model):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="skills"
    )
    slug = models.SlugField(
        unique=True,
        blank=True,
        null=True,
    )
    icon = models.CharField(max_length=50, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(self, self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.category})"

    class Meta:
        ordering = ["display_order", "category", "name"]


class Technology(models.Model):
    name = models.CharField(max_length=100)  # e.g., "Django", "React"
    slug = models.SlugField(unique=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="techs"
    )

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(self, self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.category.name})"


class Project(models.Model):
    title = models.CharField(max_length=220)
    slug = models.SlugField(
        unique=True, help_text="Used in URLs. Example: ethiopnotify"
    )
    summary = models.CharField(max_length=300, help_text="Shown on project cards.")

    overview = models.TextField(help_text="Complete explanation of the project.")

    thumbnail = models.ImageField(
        upload_to="projects/thumbnails/", blank=True, null=True
    )

    # Use ManyToManyField so one project can have many technologies
    technologies = models.ManyToManyField(Technology, related_name="projects")
    github_url = models.URLField(blank=True)
    live_url = models.URLField(blank=True)
    order = models.IntegerField(default=0)
    featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    update_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_unique_slug(self, self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ["-featured", "-created_at", "order"]


class ProjectImage(models.Model):

    project = models.ForeignKey(
        "Project", related_name="gallery", on_delete=models.CASCADE
    )
    image = models.ImageField(upload_to="porjects/gallery/")

    caption = models.CharField(max_length=200, blank=True)
    order = models.PositiveBigIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self) -> str:
        return f"{self.project.title} Image"


class ProjectFeature(models.Model):

    project = models.ForeignKey(
        "Project", on_delete=models.CASCADE, related_name="features"
    )

    title = models.CharField(max_length=200)

    description = models.TextField(blank=True, null=True)

    image = models.ImageField(
        upload_to="projects/features/",
        blank=True,
        null=True,
    )

    demo_url = models.URLField(blank=True, null=True)

    documentation_url = models.URLField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.title


class ProjectChallenge(models.Model):

    project = models.ForeignKey(
        "Project", on_delete=models.CASCADE, related_name="challenges"
    )

    problem = models.CharField(max_length=300)

    solution = models.TextField()

    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.problem


class LessonLearned(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="lessons",
    )

    title = models.CharField(max_length=200)

    description = models.TextField(blank=True, null=True)

    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return self.title


class ProjectArchitecture(models.Model):
    project = models.OneToOneField(
        Project,
        on_delete=models.CASCADE,
        related_name="architecture",
    )

    description = models.TextField(blank=True, null=True)

    diagram = models.ImageField(
        upload_to="projects/architecture/",
        blank=True,
        null=True,
    )

    def __str__(self):
        return f"{self.project.title} Architecture"


class Experience(models.Model):
    company = models.CharField(max_length=220)
    position = models.CharField(max_length=220)
    description = models.TextField(max_length=220)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    current = models.BooleanField(default=False)
    comap_logo = models.ImageField(upload_to="comapnies/", blank=True, null=True)

    def __str__(self):
        return f"{self.position} at {self.company}"

    class Meta:
        ordering = ["-start_date"]


class Contact(models.Model):
    name = models.CharField(max_length=50)
    email = models.EmailField(max_length=254)
    subject = models.CharField(max_length=30, blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.subject}"

    class Meta:
        ordering = ["-created_at"]
