from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [("portfolio", "0014_owner_required")]

    operations = [
        migrations.RenameField("experience", "comap_logo", "company_logo"),
    ]
