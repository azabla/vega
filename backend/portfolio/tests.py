import json
import tempfile

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.management import call_command
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Category, Certificate, Contact, Education, Experience, Portfolio, Project, Skill

User = get_user_model()


def make_user(username):
    return User.objects.create_user(username=username, email=f"{username}@example.com", password="S3cure-pass!x")


class SignupTests(APITestCase):
    def test_new_user_gets_empty_portfolio(self):
        user = make_user("alice")
        self.assertTrue(Portfolio.objects.filter(owner=user, name="alice").exists())
        res = self.client.get("/api/u/alice/profile/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["username"], "alice")
        self.assertNotIn("owner", res.data)


class PublicAPITests(APITestCase):
    def setUp(self):
        cache.clear()
        self.alice, self.bob = make_user("alice"), make_user("bob")
        for user in (self.alice, self.bob):
            cat = Category.objects.create(owner=user, name="Backend")
            Skill.objects.create(owner=user, name=f"{user.username}-python", category=cat)
            Project.objects.create(
                owner=user, title="Todo App", summary="s", overview=f"{user.username} project", featured=True
            )

    def test_content_is_scoped_to_username(self):
        res = self.client.get("/api/u/alice/skills/")
        self.assertEqual([s["name"] for s in res.data], ["alice-python"])
        res = self.client.get("/api/u/bob/projects/todo-app/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["overview"], "bob project")

    def test_same_slug_and_category_name_allowed_for_different_users(self):
        self.assertEqual(Project.objects.filter(slug="todo-app").count(), 2)
        self.assertEqual(Category.objects.filter(name="Backend").count(), 2)

    def test_unknown_username_is_404(self):
        self.assertEqual(self.client.get("/api/u/nobody/profile/").status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.get("/api/u/nobody/skills/").status_code, status.HTTP_404_NOT_FOUND)

    def test_featured_and_search(self):
        res = self.client.get("/api/u/alice/projects/featured/")
        self.assertEqual(len(res.data), 1)
        self.assertEqual(self.client.get("/api/u/alice/projects/search/").data, [])
        res = self.client.get("/api/u/alice/projects/search/?q=alice")
        self.assertEqual(len(res.data), 1)
        res = self.client.get("/api/u/alice/projects/search/?q=bob")
        self.assertEqual(res.data, [])

    def test_contact_message_goes_to_owner(self):
        res = self.client.post("/api/u/alice/contact/", {"name": "x"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        res = self.client.post(
            "/api/u/alice/contact/", {"name": "x", "email": "x@y.com", "message": "hi"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Contact.objects.get().owner, self.alice)


class OwnerAPITests(APITestCase):
    def setUp(self):
        self.alice, self.bob = make_user("alice"), make_user("bob")
        self.bob_category = Category.objects.create(owner=self.bob, name="Bob stuff")
        self.client.force_authenticate(self.alice)

    def test_requires_login(self):
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get("/api/me/projects/").status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_profile_and_about(self):
        res = self.client.patch("/api/me/profile/", {"title": "Backend Developer"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get("/api/u/alice/profile/").data["title"], "Backend Developer")

        res = self.client.patch(
            "/api/me/about/", {"title": "Hi", "description": "I build things"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.client.post("/api/me/services/", {"title": "APIs", "description": "REST"}, format="json")
        about = self.client.get("/api/u/alice/about/").data
        self.assertEqual(about["description"], "I build things")
        self.assertEqual([s["title"] for s in about["services"]], ["APIs"])

    def test_create_category_skill_project(self):
        cat = self.client.post("/api/me/categories/", {"name": "Backend"}, format="json")
        self.assertEqual(cat.status_code, status.HTTP_201_CREATED)
        self.assertEqual(cat.data["slug"], "backend")
        self.assertNotIn("owner", cat.data)

        dup = self.client.post("/api/me/categories/", {"name": "Backend"}, format="json")
        self.assertEqual(dup.status_code, status.HTTP_400_BAD_REQUEST)

        skill = self.client.post(
            "/api/me/skills/", {"name": "Django", "category": cat.data["id"]}, format="json"
        )
        self.assertEqual(skill.status_code, status.HTTP_201_CREATED)

        project = self.client.post(
            "/api/me/projects/",
            {"title": "Vega", "summary": "Portfolio SaaS", "overview": "...", "skills": [skill.data["id"]]},
            format="json",
        )
        self.assertEqual(project.status_code, status.HTTP_201_CREATED, project.data)
        self.assertEqual(project.data["slug"], "vega")

        feature = self.client.post(
            "/api/me/project-features/", {"project": project.data["id"], "title": "Auth"}, format="json"
        )
        self.assertEqual(feature.status_code, status.HTTP_201_CREATED)
        detail = self.client.get("/api/u/alice/projects/vega/").data
        self.assertEqual([f["title"] for f in detail["features"]], ["Auth"])
        self.assertEqual([t["name"] for t in detail["skills"]], ["Django"])

    def test_cannot_see_or_touch_other_users_objects(self):
        self.assertEqual(self.client.get("/api/me/categories/").data, [])
        url = f"/api/me/categories/{self.bob_category.id}/"
        self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.delete(url).status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Category.objects.filter(id=self.bob_category.id).exists())

    def test_cannot_link_other_users_objects(self):
        res = self.client.post(
            "/api/me/skills/", {"name": "Sneaky", "category": self.bob_category.id}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("category", res.data)

        bob_project = Project.objects.create(owner=self.bob, title="Bob app", summary="s", overview="o")
        res = self.client.post(
            "/api/me/project-images/", {"project": bob_project.id, "caption": "x"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_messages_are_private(self):
        Contact.objects.create(owner=self.alice, name="a", email="a@a.com", message="for alice")
        Contact.objects.create(owner=self.bob, name="b", email="b@b.com", message="for bob")
        res = self.client.get("/api/me/messages/")
        self.assertEqual([m["message"] for m in res.data], ["for alice"])


@override_settings(MEDIA_ROOT=tempfile.gettempdir())
class UploadPathTests(APITestCase):
    def test_uploads_are_stored_per_user(self):
        user = make_user("alice")
        project = Project(owner=user, title="x", summary="s", overview="o")
        path = Project._meta.get_field("thumbnail").upload_to(project, "pic.png")
        self.assertEqual(path, f"users/{user.id}/projects/thumbnails/pic.png")


class ImportPortfolioTests(APITestCase):
    def test_import_legacy_export_into_user(self):
        user = make_user("vega")
        export = [
            {"model": "portfolio.portfolio", "pk": 7, "fields": {"name": "Andu", "title": "Dev", "bio": "b",
                                                                  "phone": "1", "email": "a@a.com"}},
            {"model": "portfolio.category", "pk": 3, "fields": {"name": "Backend", "slug": "backend"}},
            {"model": "portfolio.skill", "pk": 5, "fields": {"name": "Python", "slug": "python", "category": 3}},
            # legacy model: imported as a skill; "Python" matches the existing skill
            {"model": "portfolio.technology", "pk": 9, "fields": {"name": "Django", "slug": "django", "category": 3}},
            {"model": "portfolio.technology", "pk": 10, "fields": {"name": "python", "category": 3}},
            {"model": "portfolio.project", "pk": 4, "fields": {"title": "Vega", "slug": "vega", "summary": "s",
                                                                "overview": "o", "technologies": [9, 10]}},
            {"model": "portfolio.experience", "pk": 2, "fields": {"company": "XYZ", "position": "Dev",
                                                                   "description": "d", "start_date": "2024-01-01",
                                                                   "comap_logo": ""}},
            {"model": "auth.user", "pk": 1, "fields": {}},
        ]
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            json.dump(export, f)
        call_command("import_portfolio", f.name, owner="vega", stdout=open("/dev/null", "w"),
                     stderr=open("/dev/null", "w"))

        self.assertEqual(Portfolio.objects.filter(owner=user).count(), 1)  # updated, not duplicated
        self.assertEqual(Portfolio.objects.get(owner=user).title, "Dev")
        project = Project.objects.get(owner=user, slug="vega")
        self.assertEqual(sorted(s.name for s in project.skills.all()), ["Django", "Python"])
        self.assertEqual(Skill.objects.filter(owner=user).count(), 2)  # "python" reused, not duplicated
        self.assertEqual(project.skills.get(name="Django").category.owner, user)
        self.assertTrue(Experience.objects.filter(owner=user, company="XYZ").exists())


class MasterProfileTests(APITestCase):
    """Education, certificates, and skills backed by evidence."""

    def setUp(self):
        self.alice = make_user("alice")
        self.client.force_authenticate(self.alice)
        self.cat = Category.objects.create(owner=self.alice, name="Backend")
        self.django = Skill.objects.create(owner=self.alice, name="Django", category=self.cat, years_of_experience=2)

    def test_skill_shows_evidence(self):
        project = Project.objects.create(owner=self.alice, title="EthioNotify", summary="s", overview="o")
        project.skills.add(self.django)
        job = Experience.objects.create(
            owner=self.alice, company="XYZ", position="Backend Developer", start_date="2024-01-01"
        )
        job.skills.add(self.django)
        cert = Certificate.objects.create(owner=self.alice, name="Django Pro", issuer="ALX")
        cert.skills.add(self.django)

        self.client.force_authenticate(None)
        skill = self.client.get("/api/u/alice/skills/").data[0]
        self.assertEqual(skill["years_of_experience"], 2)
        self.assertEqual(skill["evidence"]["projects"], [{"title": "EthioNotify", "slug": "ethionotify"}])
        self.assertEqual(skill["evidence"]["experience"], [{"position": "Backend Developer", "company": "XYZ"}])
        self.assertEqual(skill["evidence"]["certificates"], [{"name": "Django Pro", "issuer": "ALX"}])

    def test_education_crud_and_public(self):
        res = self.client.post(
            "/api/me/education/",
            {"institution": "Bahir Dar University", "level": "bachelor", "field_of_study": "Computer Engineering",
             "start_date": "2019-10-01", "end_date": "2024-07-01", "grade": "CGPA 3.8"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        res = self.client.post("/api/me/education/", {"institution": "X", "level": "tvet"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        res = self.client.post("/api/me/education/", {"institution": "X", "level": "nope"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        public = self.client.get("/api/u/alice/education/").data
        self.assertEqual(public[0]["level_display"], "Bachelor's (BSc/BA)")
        self.assertNotIn("owner", public[0])

    def test_certificate_with_skills(self):
        res = self.client.post(
            "/api/me/certificates/",
            {"name": "AWS Cloud Practitioner", "issuer": "Amazon", "skills": [self.django.id]},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        public = self.client.get("/api/u/alice/certificates/").data
        self.assertEqual([s["name"] for s in public[0]["skills"]], ["Django"])

    def test_experience_fields(self):
        res = self.client.post(
            "/api/me/experience/",
            {"company": "XYZ", "position": "Intern", "employment_type": "internship", "location": "Addis Ababa",
             "description": "x" * 1000, "start_date": "2024-01-01", "skills": [self.django.id]},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        exp = self.client.get("/api/u/alice/experience/").data[0]
        self.assertEqual(exp["employment_type_display"], "Internship")
        self.assertEqual(len(exp["description"]), 1000)  # no 220-character limit anymore
        self.assertIn("company_logo", exp)


class SeedPortfolioTests(APITestCase):
    def test_seed_file_is_valid_and_idempotent(self):
        user = make_user("vega")
        out = open("/dev/null", "w")
        call_command("seed_portfolio", "portfolio/seed/vega.json", owner="vega", stdout=out)
        counts = (Project.objects.filter(owner=user).count(), Skill.objects.filter(owner=user).count())
        call_command("seed_portfolio", "portfolio/seed/vega.json", owner="vega", stdout=out)
        self.assertEqual(
            counts, (Project.objects.filter(owner=user).count(), Skill.objects.filter(owner=user).count())
        )
        self.assertGreater(counts[0], 0)

        detail = self.client.get("/api/u/vega/projects/vega-grading-system/").data
        self.assertTrue(detail["features"])
        self.assertEqual(detail["status"], "in_progress")
        django = next(s for s in self.client.get("/api/u/vega/skills/").data if s["name"] == "Django")
        self.assertGreaterEqual(len(django["evidence"]["projects"]), 2)

    def test_reset_removes_old_content(self):
        user = make_user("vega")
        Experience.objects.create(owner=user, company="Old", position="Old", start_date="2020-01-01")
        call_command("seed_portfolio", "portfolio/seed/vega.json", owner="vega", reset=True,
                     stdout=open("/dev/null", "w"))
        self.assertFalse(Experience.objects.filter(owner=user, company="Old").exists())
        # resume sections from the seed
        self.assertTrue(Experience.objects.filter(owner=user, current=True).exists())
        langs = self.client.get("/api/u/vega/languages/").data
        self.assertEqual([l["name"] for l in langs], ["Amharic", "English"])
        self.assertEqual(langs[0]["proficiency_display"], "Native")
        self.assertTrue(self.client.get("/api/u/vega/profile/").data["website"])


class DesignSystemContentTests(APITestCase):
    """Testimonials, project metrics, principles and the owner's look settings."""

    def setUp(self):
        self.alice, self.bob = make_user("alice"), make_user("bob")
        self.project = Project.objects.create(owner=self.alice, title="Tena", summary="s", overview="o")
        self.bob_project = Project.objects.create(owner=self.bob, title="Bob app", summary="s", overview="o")
        self.client.force_authenticate(self.alice)

    def test_settings_are_validated(self):
        good = {"theme": "midnight", "accent": "violet", "sections": [{"id": "about", "visible": False}]}
        res = self.client.patch("/api/me/profile/", {"settings": good}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get("/api/u/alice/profile/").data["settings"], good)

        for bad in (
            {"theme": "neon"},
            {"colour": "red"},
            {"sections": [{"id": "about"}, {"id": "about"}]},
            {"pages": {"blog": True}},
        ):
            res = self.client.patch("/api/me/profile/", {"settings": bad}, format="json")
            self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST, bad)

    def test_testimonials(self):
        res = self.client.post(
            "/api/me/testimonials/",
            {"name": "Meron", "quote": "Great work", "project": self.project.id},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        res = self.client.post(
            "/api/me/testimonials/", {"name": "X", "quote": "Q", "project": self.bob_project.id}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.client.post("/api/me/testimonials/", {"name": "Hidden", "quote": "Q", "is_active": False}, format="json")

        data = self.client.get("/api/u/alice/testimonials/").data
        self.assertEqual([t["name"] for t in data], ["Meron"])
        self.assertEqual(data[0]["project"], {"title": "Tena", "slug": "tena"})
        self.assertEqual(self.client.get("/api/u/bob/testimonials/").data, [])

    def test_project_metrics_and_case_study_fields(self):
        res = self.client.post(
            "/api/me/project-metrics/",
            {"project": self.project.id, "value": "+38%", "label": "bookings"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        res = self.client.post(
            "/api/me/project-metrics/", {"project": self.bob_project.id, "value": "1", "label": "x"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.client.patch(
            f"/api/me/projects/{self.project.id}/",
            {"problem": "Queues", "category": "SaaS", "team_size": 3, "ended_on": "2025-01-01"},
            format="json",
        )

        detail = self.client.get("/api/u/alice/projects/tena/").data
        self.assertEqual([m["value"] for m in detail["metrics"]], ["+38%"])
        self.assertEqual((detail["problem"], detail["team_size"]), ("Queues", 3))
        card = self.client.get("/api/u/alice/projects/").data[0]
        self.assertEqual((card["category"], card["ended_on"]), ("SaaS", "2025-01-01"))

    def test_principles_and_interests(self):
        self.client.patch("/api/me/about/", {"description": "Hi", "interests": "Running\nJazz"}, format="json")
        res = self.client.post("/api/me/principles/", {"title": "Ship small"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        about = self.client.get("/api/u/alice/about/").data
        self.assertEqual(about["interests"], "Running\nJazz")
        self.assertEqual([p["title"] for p in about["principles"]], ["Ship small"])
        self.assertEqual(about["photos"], [])

        self.client.force_authenticate(self.bob)
        self.assertEqual(self.client.get("/api/me/principles/").data, [])

    def test_demo_seed_uses_every_feature(self):
        make_user("sample")
        for _ in range(2):  # idempotent
            call_command("seed_portfolio", "portfolio/seed/demo.json", owner="sample", stdout=open("/dev/null", "w"))
        profile = self.client.get("/api/u/sample/profile/").data
        self.assertTrue(profile["availability"] and profile["timezone"] and profile["settings"])
        self.assertTrue(self.client.get("/api/u/sample/about/").data["principles"])
        testimonials = self.client.get("/api/u/sample/testimonials/").data
        self.assertTrue(testimonials)
        self.assertTrue(any(t["project"] for t in testimonials))
        featured = self.client.get("/api/u/sample/projects/featured/").data[0]
        self.assertTrue(self.client.get(f"/api/u/sample/projects/{featured['slug']}/").data["metrics"])
        self.assertTrue(any(s["years_of_experience"] for s in self.client.get("/api/u/sample/skills/").data))
