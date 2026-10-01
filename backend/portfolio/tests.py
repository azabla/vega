import json
import tempfile

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.management import call_command
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Category, Contact, Portfolio, Project, Skill

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

        tech = self.client.post(
            "/api/me/technologies/", {"name": "Django", "category": cat.data["id"]}, format="json"
        )
        project = self.client.post(
            "/api/me/projects/",
            {"title": "Vega", "summary": "Portfolio SaaS", "overview": "...", "technologies": [tech.data["id"]]},
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
        self.assertEqual([t["name"] for t in detail["technologies"]], ["Django"])

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
            {"model": "portfolio.technology", "pk": 9, "fields": {"name": "Django", "slug": "django", "category": 3}},
            {"model": "portfolio.project", "pk": 4, "fields": {"title": "Vega", "slug": "vega", "summary": "s",
                                                                "overview": "o", "technologies": [9]}},
            {"model": "auth.user", "pk": 1, "fields": {}},
        ]
        with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
            json.dump(export, f)
        call_command("import_portfolio", f.name, owner="vega", stdout=open("/dev/null", "w"),
                     stderr=open("/dev/null", "w"))

        self.assertEqual(Portfolio.objects.filter(owner=user).count(), 1)  # updated, not duplicated
        self.assertEqual(Portfolio.objects.get(owner=user).title, "Dev")
        project = Project.objects.get(owner=user, slug="vega")
        self.assertEqual([t.name for t in project.technologies.all()], ["Django"])
        self.assertEqual(project.technologies.get().category.owner, user)
