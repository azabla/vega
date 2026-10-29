import json
import tempfile

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.management import call_command
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

from .models import (
    CV, Achievement, Category, Certificate, Contact, Education, Experience, Portfolio, Project, Skill,
)

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


class CVTests(APITestCase):
    def setUp(self):
        cache.clear()  # the cv throttle counts across tests
        self.alice = make_user("alice")
        self.portfolio = Portfolio.objects.get(owner=self.alice)
        self.portfolio.name, self.portfolio.title = "Alice Abebe", "Backend developer"
        self.portfolio.save()
        cat = Category.objects.create(owner=self.alice, name="Backend")
        python = Skill.objects.create(owner=self.alice, name="Python", category=cat)
        Skill.objects.create(owner=self.alice, name="Hidden", category=cat, is_active=False)
        project = Project.objects.create(owner=self.alice, title="Todo", summary="s", overview="o", featured=True)
        project.skills.add(python)
        Project.objects.create(owner=self.alice, title="Side thing", summary="s", overview="o")
        Experience.objects.create(
            owner=self.alice, company="Acme", position="Engineer", start_date="2022-01-01", current=True,
            description="- Built the API\n- Ran the team",
        )
        Experience.objects.create(
            owner=self.alice, company="Club", position="Mentor", start_date="2021-01-01",
            employment_type=Experience.EmploymentType.VOLUNTEER,
        )

    def test_pdf_download(self):
        res = self.client.get("/api/u/alice/cv.pdf")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res["Content-Type"], "application/pdf")
        self.assertTrue(res.content.startswith(b"%PDF"))
        self.assertTrue(res["Content-Disposition"].startswith("inline"))
        res = self.client.get("/api/u/alice/cv.pdf?download=1", HTTP_ACCEPT="application/pdf")
        self.assertEqual(res["Content-Disposition"], 'attachment; filename="alice-abebe-cv.pdf"')

    def test_empty_profile_still_renders(self):
        make_user("bob")
        res = self.client.get("/api/u/bob/cv.pdf")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.content.startswith(b"%PDF"))

    def test_hidden_resume_page_and_unknown_user_are_404(self):
        self.assertEqual(self.client.get("/api/u/nobody/cv.pdf").status_code, status.HTTP_404_NOT_FOUND)
        self.portfolio.settings = {"pages": {"resume": False}}
        self.portfolio.save()
        self.assertEqual(self.client.get("/api/u/alice/cv.pdf").status_code, status.HTTP_404_NOT_FOUND)

    def test_content_matches_resume_page(self):
        from .cv import cv_context

        ctx = cv_context(self.portfolio, "https://example.com/u/alice")
        data = {s["id"]: s["data"] for s in ctx["sections"]}
        self.assertEqual([j["title"] for j in data["experience"]], ["Engineer"])
        self.assertEqual(data["experience"][0]["body"], "<ul><li>Built the API</li><li>Ran the team</li></ul>")
        self.assertEqual(data["experience"][0]["when"], "2022 – Present")
        self.assertEqual([j["title"] for j in data["volunteering"]], ["Mentor"])
        self.assertEqual([p["title"] for p in data["projects"]], ["Todo"])  # featured only
        self.assertEqual(data["projects"][0]["skills"], ["Python"])
        self.assertEqual(data["skills"]["groups"], {"Backend": ["Python"]})
        self.assertNotIn("summary", data)  # nothing to say: the section is dropped
        self.assertEqual(ctx["url_label"], "example.com/u/alice")

    @override_settings(SITE_URL="https://cv.example.com/")
    def test_qr_code_links_to_portfolio(self):
        from .cv import portfolio_url

        alice = Portfolio.objects.get(owner__username="alice")
        self.assertEqual(portfolio_url(None, alice), "https://cv.example.com/u/alice")
        res = self.client.get("/api/u/alice/qr.svg")
        self.assertEqual(res["Content-Type"], "image/svg+xml")
        self.assertIn(b"<svg", res.content)
        res = self.client.get("/api/u/alice/qr.png?download=1")
        self.assertEqual(res["Content-Type"], "image/png")
        self.assertEqual(res["Content-Disposition"], 'attachment; filename="alice-qr.png"')
        self.assertEqual(self.client.get("/api/u/nobody/qr.svg").status_code, status.HTTP_404_NOT_FOUND)

    def test_renderer_only_loads_bundled_fonts(self):
        from weasyprint.urls import URLFetchingError

        from .cv import FONTS_URI, _FontsOnlyFetcher

        fetcher = _FontsOnlyFetcher()
        for url in ("file:///etc/passwd", "https://example.com/x.png", FONTS_URI + "../models.py"):
            with self.assertRaises(URLFetchingError):
                fetcher.fetch(url)
        fetcher.fetch(FONTS_URI + "geist-latin-wght-normal.woff2").close()


class CVVersionTests(APITestCase):
    """CV versions: templates, design and content choices, the owner API and public links."""

    def setUp(self):
        cache.clear()
        self.alice, self.bob = make_user("alice"), make_user("bob")
        cat = Category.objects.create(owner=self.alice, name="Backend")
        Skill.objects.create(owner=self.alice, name="Python", category=cat)
        self.p1 = Project.objects.create(owner=self.alice, title="One", summary="s", overview="o", featured=True)
        self.p2 = Project.objects.create(owner=self.alice, title="Two", summary="s", overview="o")
        self.client.force_authenticate(self.alice)

    def test_every_template_renders_for_an_empty_profile(self):
        from .cv import render_cv_pdf
        from .cv_options import TEMPLATES

        portfolio = Portfolio.objects.get(owner=self.bob)
        design = {"photo": "upload", "logos": True, "skills_style": "tags", "dates": "month", "paper": "letter"}
        for template in TEMPLATES:
            with self.subTest(template=template):
                cv = CV(owner=self.bob, name="x", template=template, design=design)
                self.assertTrue(render_cv_pdf(portfolio, "https://x/u/bob", cv).startswith(b"%PDF"))

    def test_options_are_validated(self):
        for bad in (
            {"design": {"accent": "red"}},
            {"design": {"font": "comic"}},
            {"design": {"qr": "yes"}},
            {"template": "nope"},
            {"content": {"sections": [{"id": "hobbies"}]}},
            {"content": {"sections": [{"id": "skills"}, {"id": "skills"}]}},
            {"content": {"items": {"projects": ["1"]}}},
            {"content": {"hide_contact": ["address"]}},
            {"content": {"summary": "x" * 5000}},
        ):
            with self.subTest(bad=bad):
                res = self.client.post("/api/me/cvs/", {"name": "CV", **bad}, format="json")
                self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST, res.data)

    def test_first_cv_is_default_and_only_one_default(self):
        first = self.client.post("/api/me/cvs/", {"name": "General"}, format="json").data
        self.assertTrue(first["is_default"])
        self.assertEqual(first["slug"], "general")
        second = self.client.post("/api/me/cvs/", {"name": "Backend", "is_default": True}, format="json").data
        self.assertFalse(CV.objects.get(pk=first["id"]).is_default)
        # deleting the default promotes another
        self.client.delete(f"/api/me/cvs/{second['id']}/")
        self.assertTrue(CV.objects.get(pk=first["id"]).is_default)

    def test_default_cv_backs_the_public_pdf_and_is_always_public(self):
        cv = CV.objects.create(owner=self.alice, name="Main", template="executive", is_public=False)
        self.assertTrue(cv.is_default and cv.is_public)
        from .cv import cv_context

        ctx = cv_context(Portfolio.objects.get(owner=self.alice), "https://x/u/alice")
        self.assertEqual(ctx["template"], "executive")

    def test_public_and_private_versions(self):
        CV.objects.create(owner=self.alice, name="Main")
        CV.objects.create(owner=self.alice, name="Secret", is_public=False)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get("/api/u/alice/cv/main.pdf").status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get("/api/u/alice/cv/secret.pdf").status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual([c["slug"] for c in self.client.get("/api/u/alice/cvs/").data], ["main"])
        self.assertEqual(self.client.get("/api/u/bob/cv/main.pdf").status_code, status.HTTP_404_NOT_FOUND)

    def test_owner_downloads_private_versions_and_cannot_touch_others(self):
        secret = CV.objects.create(owner=self.alice, name="Secret", is_public=False)
        res = self.client.get(f"/api/me/cvs/{secret.pk}/pdf/")
        self.assertEqual(res["Content-Type"], "application/pdf")
        self.assertIn("attachment", res["Content-Disposition"])
        self.client.force_authenticate(self.bob)
        self.assertEqual(self.client.get(f"/api/me/cvs/{secret.pk}/pdf/").status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client.get("/api/me/cvs/").data, [])

    def test_duplicate(self):
        cv = CV.objects.create(owner=self.alice, name="Main", template="timeline", design={"accent": "#123456"})
        res = self.client.post(f"/api/me/cvs/{cv.pk}/duplicate/")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual((res.data["name"], res.data["template"], res.data["is_default"]), ("Main (copy)", "timeline", False))
        self.assertEqual(res.data["design"], {"accent": "#123456"})

    def test_preview_returns_page_images(self):
        res = self.client.post("/api/me/cvs/preview/", {"template": "creative", "design": {"accent": "#c2410c"}}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["page_count"], len(res.data["pages"]))
        self.assertTrue(res.data["pages"][0].startswith("data:image/webp;base64,"))
        bad = self.client.post("/api/me/cvs/preview/", {"template": "creative", "design": {"accent": "x"}}, format="json")
        self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.post("/api/me/cvs/preview/", {}, format="json").status_code, status.HTTP_401_UNAUTHORIZED)

    def test_content_choices(self):
        from .cv import cv_context

        cv = CV(
            owner=self.alice,
            name="x",
            content={
                "headline": "Backend *engineer*",
                "summary": "Hi **there** <script>",
                "items": {"projects": [self.p2.pk]},
                "sections": [
                    {"id": "custom-pubs", "title": "Publications", "body": "- [Paper](https://example.com/p)"},
                    {"id": "projects", "title": "Work"},
                    {"id": "summary"},
                    {"id": "skills", "visible": False},
                ],
                "hide_contact": ["email"],
            },
        )
        ctx = cv_context(Portfolio.objects.get(owner=self.alice), "https://x/u/alice", cv)
        sections = {s["id"]: s for s in ctx["sections"]}
        self.assertEqual([s["id"] for s in ctx["sections"]][:3], ["custom-pubs", "projects", "summary"])
        self.assertNotIn("skills", sections)
        self.assertEqual(sections["projects"]["title"], "Work")
        self.assertEqual([p["title"] for p in sections["projects"]["data"]], ["Two"])
        self.assertEqual(sections["summary"]["data"], "<p>Hi <strong>there</strong> &lt;script&gt;</p>")
        self.assertEqual(sections["custom-pubs"]["data"], '<ul><li><a href="https://example.com/p">Paper</a></li></ul>')
        self.assertEqual(ctx["headline"], "Backend <em>engineer</em>")
        self.assertNotIn("email", [c["kind"] for c in ctx["contact"]])

    def test_rich_text_never_passes_html_through(self):
        from .cv import rich

        self.assertEqual(rich('[x](javascript:alert(1)) <img src=x onerror="y">'),
                         "<p>[x](javascript:alert(1)) &lt;img src=x onerror=&quot;y&quot;&gt;</p>")
        self.assertEqual(rich("Intro\n- a\n- b\n\nOutro"), "<p>Intro</p><ul><li>a</li><li>b</li></ul><p>Outro</p>")

    @override_settings(MEDIA_ROOT=tempfile.mkdtemp())
    def test_uploaded_photo_and_logo_are_embedded(self):
        from io import BytesIO

        from django.core.files.uploadedfile import SimpleUploadedFile
        from PIL import Image

        from .cv import cv_context

        buffer = BytesIO()
        Image.new("RGB", (800, 600), "#336699").save(buffer, "JPEG")
        upload = SimpleUploadedFile("me.jpg", buffer.getvalue(), content_type="image/jpeg")
        cv = CV.objects.create(owner=self.alice, name="Main", design={"photo": "upload"})
        res = self.client.patch(f"/api/me/cvs/{cv.pk}/", {"photo": upload}, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        cv.refresh_from_db()
        ctx = cv_context(Portfolio.objects.get(owner=self.alice), "https://x/u/alice", cv)
        self.assertTrue(ctx["photo"].startswith("data:image/jpeg;base64,"))
        cv.design = {"photo": "none"}
        self.assertIsNone(cv_context(Portfolio.objects.get(owner=self.alice), "https://x", cv)["photo"])

    def test_seed_cvs(self):
        make_user("sample")
        call_command("seed_portfolio", "portfolio/seed/demo.json", owner="sample", stdout=open("/dev/null", "w"))
        cvs = CV.objects.filter(owner__username="sample")
        self.assertEqual(cvs.filter(is_default=True).count(), 1)
        self.assertTrue(cvs.filter(is_public=False).exists())
        self.assertGreaterEqual(cvs.values("template").distinct().count(), 3)


class ProfessionTests(APITestCase):
    """Profession presets (settings.profession) and achievements: awards, publications, exhibitions."""

    def setUp(self):
        cache.clear()
        self.alice, self.bob = make_user("alice"), make_user("bob")
        self.client.force_authenticate(self.alice)

    def test_owner_manages_achievements_and_public_sees_only_theirs(self):
        res = self.client.post(
            "/api/me/achievements/",
            {"kind": "publication", "title": "Offline-first sync", "issuer": "IEEE Access", "authors": "A. Tesfaye, B. Alemu",
             "date": "2024-03-01", "url": "https://doi.org/10.1/x"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertNotIn("owner", res.data)
        Achievement.objects.create(owner=self.bob, title="Bob's prize")
        bad = self.client.post("/api/me/achievements/", {"kind": "medal", "title": "x"}, format="json")
        self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST)

        public = self.client.get("/api/u/alice/achievements/").data
        self.assertEqual([a["title"] for a in public], ["Offline-first sync"])
        self.assertEqual(public[0]["kind_display"], "Publication")
        self.assertEqual(len(self.client.get("/api/me/achievements/").data), 1)
        bob_id = Achievement.objects.get(owner=self.bob).pk
        self.assertEqual(self.client.delete(f"/api/me/achievements/{bob_id}/").status_code, status.HTTP_404_NOT_FOUND)

    def test_profession_setting_is_validated(self):
        ok = self.client.patch(
            "/api/me/profile/",
            {"settings": {"profession": "researcher", "sections": [{"id": "achievements"}, {"id": "education", "visible": True}],
                          "pages": {"achievements": False}}},
            format="json",
        )
        self.assertEqual(ok.status_code, status.HTTP_200_OK, ok.data)
        bad = self.client.patch("/api/me/profile/", {"settings": {"profession": "astronaut"}}, format="json")
        self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cv_lists_achievements_under_the_profession_title(self):
        from .cv import cv_context, render_cv_pdf

        Achievement.objects.create(owner=self.alice, kind="publication", title="Paper", issuer="Journal", authors="A. T.")
        portfolio = Portfolio.objects.get(owner=self.alice)
        cv = CV(owner=self.alice, name="x", template="academic")

        ctx = cv_context(portfolio, "https://x/u/alice", cv)
        section = next(s for s in ctx["sections"] if s["id"] == "achievements")
        self.assertEqual(section["title"], "Awards & publications")
        self.assertEqual(section["data"][0]["authors"], "A. T.")

        portfolio.settings = {"profession": "researcher"}
        portfolio.save()
        ctx = cv_context(portfolio, "https://x/u/alice", cv)
        self.assertEqual([s["title"] for s in ctx["sections"] if s["id"] == "achievements"], ["Publications & awards"])
        self.assertTrue(render_cv_pdf(portfolio, "https://x/u/alice", cv).startswith(b"%PDF"))

        # picked one by one like other entries; an owner's rename still wins
        cv.content = {"items": {"achievements": []}, "sections": [{"id": "achievements", "title": "Papers"}]}
        self.assertNotIn("achievements", [s["id"] for s in cv_context(portfolio, "https://x/u/alice", cv)["sections"]])

    def test_seed_loads_achievements(self):
        call_command("seed_portfolio", "portfolio/seed/demo.json", owner="alice", stdout=open("/dev/null", "w"))
        kinds = set(Achievement.objects.filter(owner=self.alice).values_list("kind", flat=True))
        self.assertTrue({"award", "publication", "talk"} <= kinds)


class CVLayoutTests(APITestCase):
    """Layout options on top of any template, per-section options, entry rewrites and preview regions."""

    def setUp(self):
        cache.clear()
        self.alice = make_user("alice")
        cat = Category.objects.create(owner=self.alice, name="Backend")
        Skill.objects.create(owner=self.alice, name="Python", category=cat)
        self.job = Experience.objects.create(
            owner=self.alice, company="Acme", position="Engineer", start_date="2020-01-01", description="- Long bullet"
        )
        self.portfolio = Portfolio.objects.get(owner=self.alice)
        self.client.force_authenticate(self.alice)

    def test_every_template_renders_with_every_layout(self):
        from .cv import render_cv_pdf
        from .cv_options import TEMPLATES

        designs = [
            {"layout": "left", "sidebar_style": "dark", "heading_style": "bar", "header_align": "center"},
            {"layout": "right", "sidebar_style": "plain", "sidebar_width": "wide", "heading_style": "serif"},
            {"layout": "one", "header_align": "left", "heading_style": "block", "margins": "narrow"},
        ]
        content = {"sections": [{"id": "experience", "columns": 2, "column": "side"}, {"id": "skills", "break": True}]}
        for template in TEMPLATES:
            for design in designs:
                with self.subTest(template=template, design=design):
                    cv = CV(owner=self.alice, name="x", template=template, design=design, content=content)
                    self.assertTrue(render_cv_pdf(self.portfolio, "https://x/u/alice", cv).startswith(b"%PDF"))

    def test_layout_and_section_options_are_validated(self):
        for bad in (
            {"design": {"layout": "top"}},
            {"design": {"heading_style": "comic"}},
            {"content": {"sections": [{"id": "skills", "column": "left"}]}},
            {"content": {"sections": [{"id": "skills", "columns": 3}]}},
            {"content": {"sections": [{"id": "skills", "break": "yes"}]}},
            {"content": {"overrides": {"skills": {}}}},
            {"content": {"overrides": {"experience": {"abc": {"body": "x"}}}}},
            {"content": {"overrides": {"experience": {"1": {"colour": "red"}}}}},
            {"content": {"overrides": {"experience": {"1": {"body": "x" * 7000}}}}},
        ):
            with self.subTest(bad=bad):
                res = self.client.post("/api/me/cvs/", {"name": "CV", **bad}, format="json")
                self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST, res.data)

    def test_sidebar_placement_and_entry_rewrites(self):
        from .cv import cv_context

        cv = CV(
            owner=self.alice,
            name="x",
            template="classic",
            design={"layout": "right"},
            content={
                "sections": [{"id": "experience", "column": "side"}, {"id": "skills", "column": "main", "columns": 2}],
                "overrides": {"experience": {str(self.job.pk): {"title": "Backend engineer", "body": "**Short**"}}},
            },
        )
        ctx = cv_context(self.portfolio, "https://x/u/alice", cv)
        self.assertEqual(ctx["side"]["position"], "right")
        self.assertEqual([s["id"] for s in ctx["side_sections"]], ["experience"])
        self.assertIn("skills", [s["id"] for s in ctx["main_sections"]])
        job = ctx["side_sections"][0]["data"][0]
        self.assertEqual((job["title"], job["body"]), ("Backend engineer", "<p><strong>Short</strong></p>"))
        # Modern has a sidebar unless the owner asks for one column
        self.assertIsNotNone(cv_context(self.portfolio, "x", CV(owner=self.alice, template="modern"))["side"])
        self.assertIsNone(cv_context(self.portfolio, "x", CV(owner=self.alice, template="modern", design={"layout": "one"}))["side"])

    def test_preview_marks_where_each_section_is(self):
        res = self.client.post(
            "/api/me/cvs/preview/", {"template": "modern", "content": {"summary": "Hello"}}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        ids = {r["id"] for r in res.data["regions"]}
        self.assertTrue({"header", "summary", "experience", "skills"} <= ids, ids)
        for r in res.data["regions"]:
            self.assertTrue(0 <= r["x"] <= 1 and 0 <= r["y"] <= 1 and 0 < r["w"] <= 1 and 0 < r["h"] <= 1, r)


DOMAINS = {
    "BASE_DOMAIN": "vega.example",
    "PORTFOLIO_SUBDOMAINS": True,
    "CUSTOM_DOMAINS": True,
    "CUSTOM_DOMAIN_TARGET": "domains.vega.example",
    "CUSTOM_DOMAIN_IP": "203.0.113.7",
    "SITE_URL": "https://vega.example",
}


@override_settings(**DOMAINS)
class DomainTests(APITestCase):
    """Portfolio addresses: subdomains, owners' own domains (DNS-verified), host routing."""

    def setUp(self):
        cache.clear()
        self.hana, self.bob = make_user("hana"), make_user("bob")
        self.client.force_authenticate(self.hana)

    def connect(self, domain="hana.com"):
        return self.client.put("/api/me/domain/", {"domain": domain}, format="json")

    def verify(self, txt=None, a=()):
        from unittest import mock

        portfolio = Portfolio.objects.get(owner=self.hana)
        answers = {
            (f"_vega.{portfolio.custom_domain}", "TXT"): [txt if txt is not None else portfolio.domain_token],
            (portfolio.custom_domain, "A"): list(a),
            ("domains.vega.example", "A"): ["203.0.113.7"],
        }
        with mock.patch("portfolio.domains._lookup", side_effect=lambda name, kind: answers.get((name, kind), [])):
            return self.client.post("/api/me/domain/verify/")

    def test_hosts_resolve_to_the_right_portfolio(self):
        from .domains import resolve_host

        self.assertEqual(resolve_host("vega.example"), ("root", None))
        self.assertEqual(resolve_host("WWW.vega.example:443"), ("root", None))
        self.assertEqual(resolve_host("hana.vega.example"), ("portfolio", "hana"))
        for host in ("nobody.vega.example", "www.hana.vega.example", "api.vega.example", "hana.com", "evil.example"):
            with self.subTest(host=host):
                self.assertEqual(resolve_host(host), (None, None))
        with override_settings(PORTFOLIO_SUBDOMAINS=False):
            self.assertEqual(resolve_host("hana.vega.example"), (None, None))

    def test_connect_and_verify_a_domain(self):
        res = self.connect("https://Hana.com/")
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.assertEqual(res.data["domain"], "hana.com")
        self.assertFalse(res.data["verified"])
        kinds = {r["type"]: r for r in res.data["records"]}
        self.assertEqual(kinds["TXT"]["name"], "_vega.hana.com")
        self.assertTrue(kinds["TXT"]["value"].startswith("vega-verify="))
        self.assertEqual(kinds["CNAME"]["value"], "domains.vega.example")
        self.assertEqual(kinds["A"]["value"], "203.0.113.7")

        # not served until verified
        from .domains import resolve_host

        self.assertEqual(resolve_host("hana.com"), (None, None))
        wrong = self.verify(txt="vega-verify=someone-else")
        self.assertFalse(wrong.data["verified"])
        self.assertEqual(wrong.data["check"], {"owned": False, "points_here": False})

        ok = self.verify(a=["203.0.113.7"])
        self.assertTrue(ok.data["verified"])
        self.assertEqual(ok.data["check"], {"owned": True, "points_here": True})
        self.assertEqual(ok.data["public_url"], "https://hana.com")
        self.assertEqual(resolve_host("hana.com"), ("portfolio", "hana"))
        self.assertEqual(self.client.get("/api/sites/resolve/", {"host": "hana.com"}).data, {"kind": "portfolio", "username": "hana"})
        self.assertEqual(self.client.get("/api/sites/tls-allowed/", {"domain": "hana.com"}).status_code, 200)
        # the public profile links there, and never shows the verification token
        profile = self.client.get("/api/u/hana/profile/").data
        self.assertEqual(profile["public_url"], "https://hana.com")
        self.assertNotIn("domain_token", profile)

        # changing the domain starts over; removing it falls back to the subdomain
        self.connect("cv.hana.com")
        self.assertEqual(resolve_host("hana.com"), (None, None))
        res = self.client.delete("/api/me/domain/")
        self.assertIsNone(res.data["domain"])
        self.assertEqual(res.data["public_url"], "https://hana.vega.example")

    def test_domains_are_checked(self):
        for bad in ("hana", "not a domain", "bob.vega.example", "vega.example", "-x-.com"):
            with self.subTest(bad=bad):
                self.assertEqual(self.connect(bad).status_code, status.HTTP_400_BAD_REQUEST)
        self.connect("hana.com")
        self.client.force_authenticate(self.bob)
        taken = self.connect("hana.com")
        self.assertEqual(taken.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("another portfolio", taken.data["domain"][0])
        with override_settings(CUSTOM_DOMAINS=False):
            self.assertEqual(self.connect("bob.com").status_code, status.HTTP_400_BAD_REQUEST)

    def test_tls_is_only_for_our_hosts(self):
        for domain, code in (
            ("vega.example", 200),
            ("hana.vega.example", 200),
            ("ghost.vega.example", 404),
            ("random.com", 404),
            ("", 404),
        ):
            with self.subTest(domain=domain):
                self.assertEqual(self.client.get("/api/sites/tls-allowed/", {"domain": domain}).status_code, code)

    @override_settings(ALLOWED_HOSTS=["*"], CONFIGURED_HOSTS=["vega.example", "testserver"])
    def test_unknown_hosts_are_refused(self):
        self.connect("hana.com")
        self.assertEqual(self.client.get("/api/u/hana/profile/", HTTP_HOST="evil.example").status_code, 400)
        self.assertEqual(self.client.get("/api/u/hana/profile/", HTTP_HOST="hana.com").status_code, 400)  # unverified
        self.assertEqual(self.client.get("/api/u/hana/profile/", HTTP_HOST="hana.vega.example").status_code, 200)
        self.verify()
        self.assertEqual(self.client.get("/api/u/hana/profile/", HTTP_HOST="hana.com").status_code, 200)
        self.assertEqual(self.client.get("/api/u/hana/profile/", HTTP_HOST="vega.example").status_code, 200)

    @override_settings(ALLOWED_HOSTS=["*"], CONFIGURED_HOSTS=["vega.example"])
    def test_caddy_can_ask_from_inside_the_network(self):
        res = self.client.get("/api/sites/tls-allowed/", {"domain": "hana.vega.example"}, HTTP_HOST="web")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(self.client.get("/api/u/hana/profile/", HTTP_HOST="web").status_code, 400)

    def test_site_info(self):
        with override_settings(REGISTRATION_OPEN=False):
            data = self.client.get("/api/sites/info/").data
        self.assertEqual(data, {"registration_open": False, "subdomains": True, "custom_domains": True})

    def test_qr_code_points_at_the_best_address(self):
        from .domains import public_url

        portfolio = Portfolio.objects.get(owner=self.hana)
        self.assertEqual(public_url(portfolio), "https://hana.vega.example")
        with override_settings(PORTFOLIO_SUBDOMAINS=False):
            self.assertEqual(public_url(portfolio), "https://vega.example/u/hana")
        res = self.client.get("/api/u/hana/qr.svg")
        self.assertEqual(res.status_code, 200)
