from django.conf import settings
from django.db import models

from .utils import OwnerUploadTo, generate_unique_slug


def owner_field(related_name, **kwargs):
    return models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name=related_name,
        **kwargs,
    )


class Portfolio(models.Model):
    owner = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="portfolio",
    )
    name = models.CharField(max_length=220)
    title = models.CharField(max_length=220, blank=True)
    bio = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    location = models.CharField(max_length=100, blank=True)
    github = models.URLField(blank=True)
    linkedin = models.URLField(blank=True)
    telegram = models.URLField(blank=True)
    resume = models.FileField(upload_to=OwnerUploadTo("resume"), blank=True, null=True)
    profile_image = models.ImageField(upload_to=OwnerUploadTo("profile"), blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    update_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class About(models.Model):
    owner = owner_field("abouts")
    heading = models.CharField(max_length=200)
    title = models.CharField(max_length=255)

    experience_years = models.PositiveIntegerField(default=0)

    description = models.TextField()
    description_2 = models.TextField(blank=True)

    cv_file = models.FileField(upload_to=OwnerUploadTo("cv"), blank=True, null=True)

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
    owner = owner_field("categories")
    name = models.CharField(max_length=100)
    slug = models.SlugField(blank=True, null=True)
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
        constraints = [
            models.UniqueConstraint(fields=["owner", "name"], name="unique_category_name_per_owner"),
            models.UniqueConstraint(fields=["owner", "slug"], name="unique_category_slug_per_owner"),
        ]

    def __str__(self):
        return self.name


class Skill(models.Model):
    owner = owner_field("skills")
    name = models.CharField(max_length=100)
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="skills"
    )
    slug = models.SlugField(blank=True, null=True)
    icon = models.CharField(max_length=50, blank=True, null=True)
    years_of_experience = models.PositiveSmallIntegerField(
        null=True, blank=True, help_text="Optional. Shown as evidence next to the skill."
    )
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
        constraints = [
            models.UniqueConstraint(fields=["owner", "slug"], name="unique_skill_slug_per_owner"),
        ]


class Project(models.Model):
    class Status(models.TextChoices):
        COMPLETED = "completed", "Completed"
        IN_PROGRESS = "in_progress", "In progress"
        ARCHIVED = "archived", "Archived"

    owner = owner_field("projects")
    title = models.CharField(max_length=220)
    slug = models.SlugField(
        blank=True, help_text="Used in URLs. Example: ethiopnotify"
    )
    summary = models.CharField(max_length=300, help_text="Shown on project cards.")

    overview = models.TextField(help_text="Complete explanation of the project.")

    thumbnail = models.ImageField(
        upload_to=OwnerUploadTo("projects/thumbnails"), blank=True, null=True
    )

    # Skills used in the project: the evidence shown next to each skill
    skills = models.ManyToManyField(Skill, related_name="projects", blank=True)
    github_url = models.URLField(blank=True)
    live_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.COMPLETED)
    role = models.CharField(max_length=120, blank=True, help_text="e.g. Backend developer, Solo full-stack")
    started_on = models.DateField(null=True, blank=True)
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
        ordering = ["-featured", "order", "-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["owner", "slug"], name="unique_project_slug_per_owner"),
        ]


class ProjectImage(models.Model):

    project = models.ForeignKey(
        "Project", related_name="gallery", on_delete=models.CASCADE
    )
    image = models.ImageField(upload_to=OwnerUploadTo("projects/gallery"))

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
        upload_to=OwnerUploadTo("projects/features"),
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
        upload_to=OwnerUploadTo("projects/architecture"),
        blank=True,
        null=True,
    )

    def __str__(self):
        return f"{self.project.title} Architecture"


class Experience(models.Model):
    class EmploymentType(models.TextChoices):
        FULL_TIME = "full_time", "Full-time"
        PART_TIME = "part_time", "Part-time"
        CONTRACT = "contract", "Contract"
        FREELANCE = "freelance", "Freelance"
        INTERNSHIP = "internship", "Internship"
        VOLUNTEER = "volunteer", "Volunteer"

    owner = owner_field("experiences")
    company = models.CharField(max_length=220)
    position = models.CharField(max_length=220)
    employment_type = models.CharField(
        max_length=20, choices=EmploymentType.choices, default=EmploymentType.FULL_TIME
    )
    location = models.CharField(max_length=120, blank=True)
    description = models.TextField(blank=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    current = models.BooleanField(default=False)
    company_logo = models.ImageField(upload_to=OwnerUploadTo("companies"), blank=True, null=True)
    skills = models.ManyToManyField(Skill, related_name="experiences", blank=True)

    def __str__(self):
        return f"{self.position} at {self.company}"

    class Meta:
        ordering = ["-current", "-start_date"]


class Education(models.Model):
    class Level(models.TextChoices):
        HIGH_SCHOOL = "high_school", "High school"
        TVET = "tvet", "TVET"
        CERTIFICATE = "certificate", "Certificate"
        DIPLOMA = "diploma", "Diploma"
        BACHELOR = "bachelor", "Bachelor's (BSc/BA)"
        MASTER = "master", "Master's (MSc/MA)"
        DOCTORATE = "doctorate", "Doctorate (PhD)"
        OTHER = "other", "Other"

    owner = owner_field("education")
    institution = models.CharField(max_length=220, help_text="e.g. Bahir Dar University")
    level = models.CharField(max_length=20, choices=Level.choices, default=Level.BACHELOR)
    field_of_study = models.CharField(max_length=220, blank=True, help_text="e.g. Computer Engineering")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    current = models.BooleanField(default=False)
    grade = models.CharField(max_length=50, blank=True, help_text="e.g. CGPA 3.8/4.0")
    description = models.TextField(blank=True, help_text="Thesis, final project, activities, honors")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name_plural = "Education"
        ordering = ["order", "-start_date"]

    def __str__(self):
        return f"{self.get_level_display()} — {self.institution}"


class Certificate(models.Model):
    owner = owner_field("certificates")
    name = models.CharField(max_length=220)
    issuer = models.CharField(max_length=220, help_text="e.g. Google, Coursera, ALX")
    issue_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    credential_id = models.CharField(max_length=120, blank=True)
    credential_url = models.URLField(blank=True)
    file = models.FileField(upload_to=OwnerUploadTo("certificates"), blank=True, null=True)
    skills = models.ManyToManyField(Skill, related_name="certificates", blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "-issue_date"]

    def __str__(self):
        return f"{self.name} ({self.issuer})"


class Contact(models.Model):
    # the portfolio owner the message was sent to
    owner = owner_field("messages")
    name = models.CharField(max_length=50)
    email = models.EmailField(max_length=254)
    subject = models.CharField(max_length=30, blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.subject}"

    class Meta:
        ordering = ["-created_at"]
