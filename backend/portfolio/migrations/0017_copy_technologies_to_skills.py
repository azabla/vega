from django.db import migrations
from django.utils.text import slugify


def copy_technologies_to_skills(apps, schema_editor):
    """
    Technology and Skill described the same thing. Each technology becomes a
    skill (reusing an existing skill with the same name), and projects link
    to skills instead.
    """
    Technology = apps.get_model("portfolio", "Technology")
    Skill = apps.get_model("portfolio", "Skill")
    Project = apps.get_model("portfolio", "Project")

    skill_for_tech = {}
    for tech in Technology.objects.all():
        skill = Skill.objects.filter(owner_id=tech.owner_id, name__iexact=tech.name).first()
        if skill is None:
            base = tech.slug or slugify(tech.name)
            slug, n = base, 1
            while Skill.objects.filter(owner_id=tech.owner_id, slug=slug).exists():
                slug, n = f"{base}-{n}", n + 1
            skill = Skill.objects.create(
                owner_id=tech.owner_id,
                name=tech.name,
                slug=slug,
                icon=tech.icon,
                category_id=tech.category_id,
            )
        skill_for_tech[tech.pk] = skill.pk

    for project in Project.objects.prefetch_related("technologies"):
        ids = [skill_for_tech[t.pk] for t in project.technologies.all()]
        if ids:
            project.skills.add(*ids)


class Migration(migrations.Migration):
    dependencies = [("portfolio", "0016_master_profile_education_certificates_skill_evidence")]

    operations = [migrations.RunPython(copy_technologies_to_skills, migrations.RunPython.noop)]
