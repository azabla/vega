"""Extract text from Word CVs and present it as editable website sections."""

import re
import shutil
import subprocess
from io import StringIO
from pathlib import Path
from tempfile import TemporaryDirectory
from xml.etree import ElementTree
from zipfile import BadZipFile, ZipFile
from zlib import error as ZipReadError

MAX_UPLOAD = 5 * 1024 * 1024
MAX_XML = 4 * 1024 * 1024
MAX_TEXT = 90_000
MAX_SECTIONS = 20
MAX_BODY = 12_000

ALIASES = {
    "about": "About",
    "about me": "About",
    "profile": "About",
    "professional profile": "About",
    "summary": "About",
    "professional summary": "About",
    "objective": "Objective",
    "career objective": "Objective",
    "education": "Education",
    "educational background": "Education",
    "academic background": "Education",
    "experience": "Experience",
    "work experience": "Experience",
    "professional experience": "Experience",
    "employment history": "Experience",
    "career history": "Experience",
    "relevant experience": "Experience",
    "volunteer experience": "Volunteering",
    "volunteering": "Volunteering",
    "internships": "Internship Experience",
    "internship experience": "Internship Experience",
    "teaching experience": "Teaching Experience",
    "projects": "Projects",
    "selected projects": "Projects",
    "semester and final year project": "Projects",
    "skills": "Skills",
    "technical skills": "Technical Skills",
    "core competencies": "Skills",
    "key skills": "Skills",
    "relevant coursework": "Relevant Coursework",
    "certifications": "Certifications",
    "certificates": "Certifications",
    "licenses and certifications": "Certifications",
    "licences and certifications": "Certifications",
    "professional development": "Certifications",
    "awards": "Awards",
    "awards and honors": "Awards",
    "honors and awards": "Awards",
    "awards and honours": "Awards",
    "achievements": "Achievements",
    "selected publications": "Publications",
    "talks": "Talks",
    "presentations": "Talks",
    "exhibitions": "Exhibitions",
    "scholarships": "Grants",
    "grants": "Grants",
    "publications": "Publications",
    "languages": "Languages",
    "language skills": "Languages",
    "hobbies and interests": "Interests",
    "interests": "Interests",
    "contact": "",
    "my contact": "",
    "contact information": "",
    "personal information": "",
    "personal details": "",
    "references": "",
}
PRIVATE_LINE = re.compile(
    r"^(?:name|phone(?: number)?|mobile|telephone|e-?mail|address|date of birth|birth date|"
    r"dob|age|gender|sex|marital status|national id|passport(?: number)?)\s*:", re.I,
)
EMAIL = re.compile(r"[\w.+-]+@[\w.-]+\.[^\W\d_]{2,}")
PHONE = re.compile(r"(?<!\w)\+\d[\d ().-]{6,}\d")
BULLET = re.compile(r"^\s*[-*•▪●◦·❖✓✔➢]\s+")


class WordImportError(ValueError):
    pass


def docx_text(upload):
    with ZipFile(upload) as archive:
        document = archive.getinfo("word/document.xml")
        if document.file_size > MAX_XML:
            raise WordImportError("The Word document contains too much text to import.")
        with archive.open(document) as stream:
            raw = stream.read(MAX_XML + 1)
    if len(raw) > MAX_XML:
        raise WordImportError("The Word document contains too much text to import.")
    encoding = "utf-16" if raw.startswith((b"\xff\xfe", b"\xfe\xff")) else "utf-8-sig"
    xml = raw.decode(encoding)
    if re.search(r"<!\s*(?:DOCTYPE|ENTITY)\b", xml, re.I):
        raise WordImportError("This Word document contains unsupported XML.")
    paragraphs, active = [], []
    in_body = False
    for event, node in ElementTree.iterparse(StringIO(xml), events=("start", "end")):
        tag = node.tag.rsplit("}", 1)[-1]
        if tag == "body":
            in_body = event == "start"
        elif in_body and event == "start" and tag == "p":
            active.append({"parts": [], "list": False, "heading": False})
        elif in_body and event == "end" and active:
            paragraph = active[-1]
            if tag == "t":
                paragraph["parts"].append(node.text or "")
            elif tag in {"br", "cr", "tab"}:
                paragraph["parts"].append(" " if tag == "tab" else "\n")
            elif tag == "numPr":
                paragraph["list"] = True
            elif tag == "pStyle":
                style = next((value for key, value in node.attrib.items() if key.rsplit("}", 1)[-1] == "val"), "")
                paragraph["heading"] = style.casefold().startswith("heading")
            elif tag == "p":
                active.pop()
                text = "".join(paragraph["parts"]).strip()
                prefix = "## " if paragraph["heading"] else "- " if paragraph["list"] else ""
                paragraphs.append(prefix + text if text else "")
        if event == "end":
            node.clear()
    return "\n".join(paragraphs)


def doc_text(upload):
    if upload.read(8) != bytes.fromhex("D0CF11E0A1B11AE1"):
        raise WordImportError("This file is not a readable Word .doc document.")
    upload.seek(0)
    if not shutil.which("antiword"):
        raise WordImportError("Legacy .doc conversion is unavailable on this server. Save a copy as .docx and try again.")
    with TemporaryDirectory(prefix="vega-word-") as directory:
        source = Path(directory) / "cv.doc"
        with source.open("wb") as target:
            for chunk in upload.chunks():
                target.write(chunk)
        output = Path(directory) / "cv.txt"
        with output.open("wb") as target:
            subprocess.run(
                ["antiword", "-m", "UTF-8.txt", "-w", "0", str(source)],
                stdout=target, stderr=subprocess.DEVNULL, check=True, timeout=8,
            )
        with output.open("rb") as stream:
            return stream.read(MAX_TEXT * 4 + 1).decode("utf-8", errors="replace")


def extract_text(upload):
    suffix = Path(upload.name).suffix.lower()
    if suffix not in {".doc", ".docx"}:
        raise WordImportError("Choose a Word .doc or .docx file.")
    if upload.size > MAX_UPLOAD:
        raise WordImportError("Choose a Word file no larger than 5 MB.")
    try:
        text = docx_text(upload) if suffix == ".docx" else doc_text(upload)
    except (BadZipFile, KeyError, RuntimeError, NotImplementedError, UnicodeError, ElementTree.ParseError,
            OSError, ZipReadError, subprocess.SubprocessError) as error:
        raise WordImportError("This document couldn't be read. Try saving it again as a Word .docx file.") from error
    if len(text) > MAX_TEXT:
        raise WordImportError("This CV has too much text. Upload a shorter version.")
    return text


def draft_from_text(text):
    sections = []
    header = []
    title, lines = None, []
    skipped_details = False

    def flush():
        body = "\n".join(lines).strip()
        if title and body:
            if len(sections) >= MAX_SECTIONS or len(body) > MAX_BODY:
                raise WordImportError("This CV has too many sections or one section is too long. Upload a shorter version.")
            sections.append({"title": title, "body": body, "visible": True})
        lines.clear()

    for raw in text.splitlines():
        line = raw.strip().replace("\x00", "")
        styled_heading = line.startswith("## ")
        unbulleted = line[3:] if styled_heading else BULLET.sub("", line)
        key = unbulleted.rstrip(":").strip().casefold()
        if key in ALIASES:
            flush()
            title = ALIASES[key]
            skipped_details |= not title
            continue
        if (title == "" and not styled_heading) or PRIVATE_LINE.match(unbulleted):
            skipped_details = True
            continue
        filtered = PHONE.sub("", EMAIL.sub("", unbulleted)).strip()
        skipped_details |= filtered != unbulleted
        if styled_heading and (header or title is not None) and filtered:
            flush()
            title = filtered[:100]
            continue
        if filtered and not styled_heading and unbulleted != line:
            filtered = "- " + filtered
        if title is None and filtered:
            header.append(filtered)
        elif title:
            lines.append(filtered)
    flush()

    if not header and not sections:
        raise WordImportError("No usable CV text was found. Try a document with selectable text.")
    name = header[0][:220] if header else ""
    headline = header[1][:220] if len(header) > 1 and len(header[1]) <= 100 else ""
    remaining = header[2 if headline else 1:]
    if remaining:
        title = "Overview"
        lines.extend(remaining)
        flush()
        sections.insert(0, sections.pop())
    return {
        "name": name,
        "headline": headline,
        "sections": sections,
        "options": {"layout": "editorial", "mode": "light", "accent": "#0f766e", "font": "editorial", "spacing": "comfortable", "show_navigation": True},
    }, skipped_details
