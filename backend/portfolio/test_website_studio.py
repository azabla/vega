from io import BytesIO
from pathlib import Path
from zipfile import ZipFile

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase

from .tests import make_user

DRAFT = "/api/me/website-draft/"


def make_docx(xml):
    package = BytesIO()
    with ZipFile(package, "w") as archive:
        archive.writestr("word/document.xml", xml)
    return SimpleUploadedFile("cv.docx", package.getvalue())


class WebsiteStudioTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.owner = make_user("siteowner")
        self.client.force_authenticate(self.owner)

    def test_docx_import_edit_preview_and_save_privately(self):
        word = make_docx("""<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>
            <w:p><w:r><w:t>Example Person</w:t></w:r></w:p>
            <w:p><w:r><w:t>Systems Engineer</w:t></w:r></w:p>
            <w:p><w:r><w:t>Email: info@example.invalid</w:t></w:r></w:p>
            <w:p><w:r><w:t>Projects</w:t></w:r></w:p>
            <w:p><w:r><w:t>A help desk system.</w:t></w:r></w:p>
            <w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>Open Source</w:t></w:r></w:p>
            <w:p><w:pPr><w:numPr/></w:pPr><w:r><w:t>Library contribution.</w:t></w:r></w:p>
          </w:body>
        </w:document>""")
        imported = self.client.post(DRAFT + "import/", {"file": word}, format="multipart")
        self.assertEqual(imported.status_code, 200, imported.data)
        self.assertTrue(imported.data["excluded_contact_details"])
        draft = imported.data["draft"]
        self.assertEqual(draft["name"], "Example Person")
        self.assertEqual(draft["headline"], "Systems Engineer")
        self.assertEqual([section["title"] for section in draft["sections"]], ["Projects", "Open Source"])
        self.assertEqual(draft["sections"][1]["body"], "- Library contribution.")
        self.assertIsNone(self.client.get(DRAFT).data)

        draft["sections"][0]["visible"] = False
        draft["sections"][1]["body"] = "- **Edited** <script>alert(1)</script>"
        draft["options"].update(layout="cards", font="modern", show_navigation=False)
        rendered = self.client.post(DRAFT + "preview/", draft, format="json")
        self.assertContains(rendered, 'data-layout="cards"')
        self.assertContains(rendered, 'data-font="modern"')
        self.assertContains(rendered, "<strong>Edited</strong> &lt;script&gt;")
        self.assertNotContains(rendered, "help desk")
        self.assertNotContains(rendered, "info@example.invalid")
        self.assertNotContains(rendered, "<nav ")
        self.assertEqual(rendered["Cache-Control"], "private, no-store")

        self.assertEqual(self.client.put(DRAFT, draft, format="json").status_code, 200)
        self.assertEqual(self.client.get(DRAFT).data, draft)
        self.client.force_authenticate(make_user("siteother"))
        self.assertIsNone(self.client.get(DRAFT).data)

    def test_legacy_doc_upload_extracts_sections_from_original(self):
        source = Path(__file__).resolve().parents[1] / "resume" / "Mycv_A.doc"
        response = self.client.post(DRAFT + "import/", {
            "file": SimpleUploadedFile(source.name, source.read_bytes()),
        }, format="multipart")
        self.assertEqual(response.status_code, 200, response.data)
        draft = response.data["draft"]
        self.assertIn("Computer Engineering", draft["headline"])
        projects = next(section for section in draft["sections"] if section["title"] == "Projects")
        self.assertIn("AQI Forecasting Model", projects["body"])
        self.assertNotIn("Date of birth", str(draft))
        self.assertNotIn("Email :", str(draft))

    def test_bad_documents_and_unsafe_xml_are_rejected(self):
        for file in [
            SimpleUploadedFile("fake.doc", b"not a Word document"),
            SimpleUploadedFile("fake.docx", b"not a zip"),
            make_docx('<!DOCTYPE x [<!ENTITY e "payload">]><document><body>&e;</body></document>'),
        ]:
            with self.subTest(filename=file.name):
                self.assertEqual(self.client.post(DRAFT + "import/", {"file": file}, format="multipart").status_code, 400)
