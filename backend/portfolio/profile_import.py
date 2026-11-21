from pathlib import Path

from django.db import transaction
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .cv.pdf_import import extract_pdf_text
from .cv.profile_import import PROFILE_FIELDS, PortfolioApplyProposal, ai_available, ai_proposal, local_proposal
from .cv.word_import import WordImportError, draft_from_text, extract_text
from .domains import public_url
from .manage_views import get_or_create_portfolio
from .models import Achievement, Category, Certificate, Education, Experience, Language, Portfolio, Project, Skill

PRIVATE = {"Cache-Control": "private, no-store"}
COLLECTIONS = {
    "education": (Education, ("institution", "field_of_study", "level")),
    "experience": (Experience, ("company", "position", "start_date")),
    "certificates": (Certificate, ("name", "issuer")),
    "languages": (Language, ("name",)),
    "achievements": (Achievement, ("kind", "title", "issuer")),
}


def profile_snapshot(portfolio, request):
    return {
        **{field: getattr(portfolio, field) for field in PROFILE_FIELDS},
        "has_photo": bool(portfolio.profile_image),
        "has_links": any((portfolio.website, portfolio.github, portfolio.linkedin)),
        "public_url": public_url(portfolio, request),
    }


def review_context(request):
    models = {key: model for key, (model, _) in COLLECTIONS.items()}
    models.update(projects=Project, skills=Skill)
    return {
        "profile": profile_snapshot(get_or_create_portfolio(request.user), request),
        "existing": {key: model.objects.filter(owner=request.user).count() for key, model in models.items()},
        "ai_available": ai_available(),
    }


class PortfolioImportView(APIView):
    parser_classes = [MultiPartParser]
    permission_classes = [IsAuthenticated]

    def get_throttles(self):
        # Only document extraction and the optional provider call consume the upload budget.
        self.throttle_scope = "website_import" if self.request.method == "POST" else None
        return super().get_throttles()

    def get(self, request):
        return Response(review_context(request), headers=PRIVATE)

    def post(self, request):
        files = request.FILES.getlist("file")
        if len(files) != 1:
            raise ValidationError({"file": "Choose one PDF or Word CV to upload."})
        upload = files[0]
        suffix = Path(upload.name).suffix.lower()
        if suffix not in {".pdf", ".doc", ".docx"}:
            raise ValidationError({"file": "Choose a PDF, .doc, or .docx file."})
        try:
            text = extract_pdf_text(upload) if suffix == ".pdf" else extract_text(upload)
            draft, _ = draft_from_text(text)
        except WordImportError as error:
            raise ValidationError({"file": str(error)}) from error
        use_ai = request.data.get("use_ai") == "true"
        proposal = ai_proposal(draft) if use_ai else None
        return Response({
            **review_context(request),
            "proposal": proposal if proposal is not None else local_proposal(draft),
            "ai_status": "used" if proposal is not None else "unavailable" if use_ai else "off",
        }, headers=PRIVATE)


def require_review_details(proposal):
    for key, fields in (
        ("experience", ("company", "start_date", "employment_type")),
        ("certificates", ("issuer",)),
        ("languages", ("proficiency",)),
    ):
        errors = [
            {field: ["Complete this field before including the entry."] for field in fields if not entry[field]}
            for entry in proposal[key]
        ]
        if any(errors):
            raise ValidationError({key: errors})


def add_records(owner, model, match_fields, entries):
    created = 0
    for item in entries:
        match = {
            name + ("__iexact" if isinstance(item[name], str) else ""): item[name]
            for name in match_fields
        }
        if not model.objects.filter(owner=owner, **match).exists():
            model.objects.create(owner=owner, **item)
            created += 1
    return created


def add_skills(owner, names):
    skills = {}
    for skill in Skill.objects.filter(owner=owner):
        skills.setdefault(skill.name.casefold(), skill)
    category = None
    created = 0
    for name in names:
        key = name.casefold()
        if key in skills:
            continue
        if category is None:
            category, _ = Category.objects.get_or_create(owner=owner, name="Imported skills")
        skills[key] = Skill.objects.create(owner=owner, name=name, category=category)
        created += 1
    return skills, created


def add_projects(owner, entries, skills):
    created = 0
    for item in entries:
        if Project.objects.filter(owner=owner, title__iexact=item["title"]).exists():
            continue
        description = item["description"]
        summary = description if len(description) <= 300 else description[:297].rsplit(" ", 1)[0] + "…"
        project = Project.objects.create(
            owner=owner, title=item["title"], overview=description, summary=summary,
            role=item["role"], live_url=item["live_url"], github_url=item["github_url"], featured=True,
        )
        # A project may refer only to skills the owner already has or selected for this import.
        links = {skills[name.casefold()].pk for name in item["skills"] if name.casefold() in skills}
        if links:
            project.skills.set(links)
        created += 1
    return created


class PortfolioImportApplyView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        serializer = PortfolioApplyProposal(data=request.data)
        serializer.is_valid(raise_exception=True)
        proposal = serializer.validated_data
        require_review_details(proposal)

        owner = request.user
        portfolio = get_or_create_portfolio(owner)
        portfolio = Portfolio.objects.select_for_update().get(pk=portfolio.pk)
        fields = [name for name in PROFILE_FIELDS if proposal[name] and proposal[name] != getattr(portfolio, name)]
        expected = proposal.get("expected_profile", {})
        conflicts = [name for name in fields if name in expected and getattr(portfolio, name) != expected[name]]
        if conflicts:
            return Response({
                "detail": "Your public profile changed while you were reviewing. Check the current values before applying.",
                "conflict_fields": conflicts,
                "profile": profile_snapshot(portfolio, request),
            }, status=status.HTTP_409_CONFLICT, headers=PRIVATE)
        for name in fields:
            setattr(portfolio, name, proposal[name])
        if fields:
            portfolio.save(update_fields=[*fields, "update_at"])

        skills, skill_count = add_skills(owner, proposal["skills"])
        counts = {
            "projects": add_projects(owner, proposal["projects"], skills),
            "skills": skill_count,
            **{
                key: add_records(owner, model, match_fields, proposal[key])
                for key, (model, match_fields) in COLLECTIONS.items()
            },
        }
        return Response({
            "created": counts,
            "kept": {key: len(proposal[key]) - count for key, count in counts.items()},
            "profile_fields": fields,
            "profile": profile_snapshot(portfolio, request),
        }, headers=PRIVATE)
