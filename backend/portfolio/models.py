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
    linkedin = models.URLField(blank=True)
    telegram = models.URLField(blank=True)
    resume = models.FileField(upload_to="resume/", blank=True, null=True)
    profile_image = models.ImageField(upload_to="profile/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    update_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        # The name for a single item
        verbose_name = "Category"
        # The name used for the plural list (usually in the Admin)
        verbose_name_plural = "Categories"

    def __str__(self):
        return self.name


class Skill(models.Model):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="skills"
    )
    proficiency = models.IntegerField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    order = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.name} ({self.category})"

    class Meta:
        ordering = ["order", "category", "name"]


class Technology(models.Model):
    name = models.CharField(max_length=100)  # e.g., "Django", "React"
    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="techs"
    )

    def __str__(self):
        return f"{self.name} ({self.category.name})"


class Projects(models.Model):
    title = models.CharField(max_length=220)
    description = models.TextField(max_length=220)
    image = models.ImageField(upload_to="projects/", blank=True, null=True)
    # Use ManyToManyField so one project can have many technologies
    technologies = models.ManyToManyField(Technology, related_name="projects")
    github_url = models.URLField(blank=True)
    live_url = models.URLField(blank=True)
    order = models.IntegerField(default=0)
    featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    update_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ["-featured", "-created_at", "order"]


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
