import json
from io import BytesIO
from pathlib import Path
from unittest.mock import patch

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase
from weasyprint import HTML

from .models import Achievement, Certificate, Language, Portfolio, Project, Skill
from .test_website_studio import make_docx
from .tests import make_user

URL = "/api/me/portfolio-import/"


class PortfolioImportTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = make_user("importowner")
        self.client.force_authenticate(self.user)

    def test_real_cv_review_then_apply_to_public_portfolio(self):
        original = Path(__file__).resolve().parents[1] / "resume" / "Mycv_A.doc"
        response = self.client.post(URL, {"file": SimpleUploadedFile(original.name, original.read_bytes())})
        self.assertEqual(response.status_code, 200, response.data)
        proposal = response.data["proposal"]
        self.assertGreaterEqual(len(proposal["projects"]), 2)
        self.assertGreaterEqual(len(proposal["education"]), 1)
        self.assertGreaterEqual(len(proposal["skills"]), 5)
        self.assertEqual(response.data["ai_status"], "off")
        self.assertFalse(Project.objects.filter(owner=self.user).exists())

        invalid = self.client.post(URL + "apply/", proposal, format="json")
        self.assertEqual(invalid.status_code, 400)
        self.assertEqual(Portfolio.objects.get(owner=self.user).name, "importowner")
        self.assertFalse(Project.objects.filter(owner=self.user).exists())

        proposal["experience"] = []
        self.assertTrue(any(not entry["proficiency"] for entry in proposal["languages"]))
        proposal["languages"] = [entry for entry in proposal["languages"] if entry["proficiency"]]
        applied = self.client.post(URL + "apply/", proposal, format="json")
        self.assertEqual(applied.status_code, 200, applied.data)
        self.assertEqual(applied.data["created"]["projects"], 2)
        again = self.client.post(URL + "apply/", proposal, format="json")
        self.assertEqual(sum(again.data["created"].values()), 0)
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get("/api/u/importowner/profile/").data["title"], proposal["title"])
        self.assertEqual(self.client.get("/api/u/importowner/projects/").status_code, 200)

    @patch("portfolio.profile_import.ai_proposal")
    def test_ai_runs_only_on_opt_in_and_falls_back(self, ai):
        ai.return_value = None
        xml = """<document><body><p><t>Example Candidate</t></p><p><t>Engineer</t></p></body></document>"""
        self.assertEqual(self.client.post(URL, {"file": make_docx(xml)}).data["ai_status"], "off")
        ai.assert_not_called()
        response = self.client.post(URL, {"file": make_docx(xml), "use_ai": "true"})
        ai.assert_called_once()
        self.assertEqual(response.data["ai_status"], "unavailable")
        self.assertEqual(response.data["proposal"]["name"], "Example Candidate")

    @patch.dict("os.environ", {"VEGA_OPENAI_API_KEY": "test-key"})
    @patch("portfolio.cv.profile_import.urlopen")
    def test_ai_response_is_validated_before_returning_a_proposal(self, provider):
        expected = {
            "name": "Example Candidate", "title": "Engineer", "bio": "",
            "projects": [], "education": [], "experience": [], "skills": ["Python"],
        }
        provider.return_value = BytesIO(json.dumps({
            "choices": [{"message": {"content": json.dumps(expected)}}],
        }).encode())
        xml = "<document><body><p><t>Example Candidate</t></p><p><t>Engineer</t></p></body></document>"
        result = self.client.post(URL, {"file": make_docx(xml), "use_ai": "true"})
        self.assertEqual(result.data["ai_status"], "used")
        self.assertEqual({key: result.data["proposal"][key] for key in expected}, expected)
        self.assertEqual(result.data["proposal"]["certificates"], [])
        self.assertEqual(provider.call_args.args[0].full_url, "https://api.openai.com/v1/chat/completions")
        self.assertFalse(Project.objects.filter(owner=self.user).exists())

    def test_pdf_import_creates_credentials_languages_and_evidence(self):
        cv = HTML(string="""
            <h1>Sample Candidate</h1><p>Research engineer</p>
            <h2>Summary</h2><p>I build tools for environmental research.</p>
            <h2>Projects</h2><p>Project: Air quality dashboard</p><p>Shows changes in air quality.</p>
            <p>Role: Research engineer</p><p>Skills used: Python, Unselected skill</p>
            <h2>Skills</h2><p>Python, Linux</p>
            <h2>Certifications</h2><p>Safety Training — Example Institute — 2024-05-13</p>
            <h2>Languages</h2><p>Amharic: Native</p>
            <h2>Publications</h2><p>Air Quality Methods — Example Journal</p>
        """).write_pdf()
        uploaded = self.client.post(URL, {"file": SimpleUploadedFile("CV.pdf", cv)})
        self.assertEqual(uploaded.status_code, 200, uploaded.data)
        self.assertEqual(uploaded["Cache-Control"], "private, no-store")
        proposal = uploaded.data["proposal"]
        self.assertEqual(proposal["name"], "Sample Candidate")
        self.assertEqual(proposal["certificates"][0]["issue_date"], "2024-05-13")
        self.assertEqual(proposal["languages"][0]["name"], "Amharic")
        self.assertEqual(proposal["achievements"][0]["kind"], "publication")
        self.assertEqual(uploaded.data["profile"]["name"], "importowner")

        applied = self.client.post(URL + "apply/", proposal, format="json")
        self.assertEqual(applied.status_code, 200, applied.data)
        project = Project.objects.get(owner=self.user)
        self.assertEqual(project.role, "Research engineer")
        self.assertEqual(list(project.skills.values_list("name", flat=True)), ["Python"])
        self.assertFalse(Skill.objects.filter(name="Unselected skill").exists())
        self.assertEqual(Certificate.objects.get(owner=self.user).issuer, "Example Institute")
        self.assertEqual(Language.objects.get(owner=self.user).proficiency, "native")
        self.assertEqual(Achievement.objects.get(owner=self.user).issuer, "Example Journal")

    def test_pdf_without_text_or_with_invalid_signature_is_explained(self):
        blank = HTML(string='<div style="width:10px;height:10px;background:black"></div>').write_pdf()
        empty = self.client.post(URL, {"file": SimpleUploadedFile("scan.pdf", blank)})
        self.assertEqual(empty.status_code, 400)
        self.assertIn("no selectable text", empty.data["file"])
        invalid = self.client.post(URL, {"file": SimpleUploadedFile("invalid.pdf", b"not a PDF")})
        self.assertEqual(invalid.status_code, 400)
        self.assertIn("not a readable PDF", invalid.data["file"])

    def test_concurrent_profile_update_requires_another_review(self):
        profile = Portfolio.objects.get(owner=self.user)
        profile.title = "Edited in another session"
        profile.save(update_fields=["title"])
        payload = {
            "name": "", "title": "Proposed headline", "bio": "", "projects": [
                {"title": "A project", "description": "Project notes"},
            ],
            "experience": [], "education": [], "skills": [],
            "expected_profile": {"title": "Old headline"},
        }
        response = self.client.post(URL + "apply/", payload, format="json")
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.data["conflict_fields"], ["title"])
        self.assertEqual(response.data["profile"]["title"], profile.title)
        self.assertFalse(Project.objects.filter(owner=self.user).exists())

        payload["expected_profile"]["title"] = profile.title
        result = self.client.post(URL + "apply/", payload, format="json")
        self.assertEqual(result.status_code, 200, result.data)
        self.assertEqual(result.data["profile"]["title"], "Proposed headline")
        self.assertTrue(Project.objects.filter(owner=self.user, title="A project").exists())

    def test_long_or_non_latin_names_get_distinct_usable_slugs(self):
        prefix = "A long shared project title used to exercise URL length and collisions"
        payload = {
            "name": "", "title": "", "bio": "", "experience": [], "education": [],
            "projects": [
                {"title": prefix + " example one", "description": ""},
                {"title": prefix + " example two", "description": ""},
                {"title": "የሶፍትዌር ፕሮጀክት", "description": ""},
            ],
            "skills": ["A detailed skill with a name longer than fifty characters"],
        }
        response = self.client.post(URL + "apply/", payload, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        slugs = list(Project.objects.filter(owner=self.user).values_list("slug", flat=True))
        self.assertEqual(len(set(slugs)), 3)
        self.assertTrue(all(0 < len(slug) <= 50 for slug in slugs))
        self.assertLessEqual(len(Skill.objects.get(owner=self.user).slug), 50)
