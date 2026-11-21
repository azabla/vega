"""Read the text layer of an uploaded PDF in an isolated PDFium process."""

import subprocess
import sys
from contextlib import closing
from pathlib import Path
from tempfile import TemporaryDirectory

MAX_PDF_PAGES = 20


def extract_pdf_text(upload):
    from .word_import import MAX_TEXT, MAX_UPLOAD, WordImportError

    if upload.size > MAX_UPLOAD:
        raise WordImportError("Choose a CV no larger than 5 MB.")
    if upload.read(5) != b"%PDF-":
        raise WordImportError("This file is not a readable PDF.")

    with TemporaryDirectory(prefix="vega-pdf-") as directory:
        path = Path(directory) / "cv.pdf"
        with path.open("wb") as output:
            for chunk in upload.chunks():
                output.write(chunk)
        try:
            # PDFium's native calls cannot run concurrently with CV preview calls in this process.
            result = subprocess.run(
                [sys.executable, __file__, str(path), str(MAX_TEXT)],
                stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=8, check=False,
            )
        except (OSError, subprocess.TimeoutExpired) as error:
            raise WordImportError("This PDF couldn't be read. Try a smaller PDF or a Word copy.") from error

    if result.returncode == 2:
        raise WordImportError(f"Choose a PDF with up to {MAX_PDF_PAGES} pages and less text.")
    if result.returncode != 0:
        raise WordImportError("This PDF couldn't be opened. Try an unlocked PDF or a Word copy.")
    text = result.stdout.decode("utf-8")
    if not text.strip():
        raise WordImportError("This PDF has no selectable text. Upload a text-based PDF or a Word copy.")
    return text


def read_pdf(path, limit):
    import pypdfium2

    try:
        with pypdfium2.PdfDocument(path) as document:
            if len(document) > MAX_PDF_PAGES:
                return 2
            pages = []
            remaining = limit
            for index in range(len(document)):
                with closing(document[index]) as page, closing(page.get_textpage()) as text_page:
                    if text_page.count_chars() > remaining:
                        return 2
                    text = text_page.get_text_bounded()
                    if len(text) > remaining:
                        return 2
                    remaining -= len(text)
                    pages.append(text)
    except (pypdfium2.PdfiumError, OSError):
        return 1
    sys.stdout.buffer.write("\n".join(pages).encode("utf-8"))
    return 0


if __name__ == "__main__":
    sys.exit(read_pdf(sys.argv[1], int(sys.argv[2])))
