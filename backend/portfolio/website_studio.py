from django.http import HttpResponse
from django.utils.text import slugify
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .cv.text import rich
from .cv.website import WebsiteOptionsSerializer, render_website
from .cv.word_import import MAX_BODY, MAX_SECTIONS, WordImportError, draft_from_text, extract_text
from .models import WebsiteDraft


class StudioOptionsSerializer(WebsiteOptionsSerializer):
    include_contact = None
    accent = serializers.RegexField(r"\A#[0-9a-fA-F]{6}\Z", default="#0f766e")
    font = serializers.ChoiceField(choices=["editorial", "modern", "mono"], default="editorial")
    spacing = serializers.ChoiceField(choices=["compact", "comfortable", "airy"], default="comfortable")
    show_navigation = serializers.BooleanField(default=True)


class SectionSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=100, allow_blank=True)
    body = serializers.CharField(max_length=MAX_BODY, allow_blank=True)
    visible = serializers.BooleanField()


class DraftSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=220, allow_blank=True)
    headline = serializers.CharField(max_length=220, allow_blank=True)
    sections = SectionSerializer(many=True, max_length=MAX_SECTIONS)
    options = StudioOptionsSerializer()


class WebsiteDraftView(APIView):
    def get(self, request):
        draft = WebsiteDraft.objects.filter(owner=request.user).first()
        return Response(draft.data if draft else None, headers={"Cache-Control": "private, no-store"})

    def put(self, request):
        serializer = DraftSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        draft, _ = WebsiteDraft.objects.update_or_create(
            owner=request.user, defaults={"data": serializer.validated_data},
        )
        return Response(draft.data, headers={"Cache-Control": "private, no-store"})


class WebsiteImportView(APIView):
    parser_classes = [MultiPartParser]
    throttle_scope = "website_import"

    def post(self, request):
        files = request.FILES.getlist("file")
        if len(files) != 1:
            raise ValidationError({"file": "Choose one Word CV to upload."})
        try:
            draft, skipped_details = draft_from_text(extract_text(files[0]))
        except WordImportError as error:
            raise ValidationError({"file": str(error)}) from error
        return Response(
            {"draft": draft, "excluded_contact_details": skipped_details},
            headers={"Cache-Control": "private, no-store"},
        )


class WebsitePreviewView(APIView):
    throttle_scope = "website_preview"

    def post(self, request):
        serializer = DraftSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        draft = serializer.validated_data
        sections = [
            {"title": section["title"] or "More", "kind": "custom", "data": rich(section["body"]),
             "partial": "cv/sections/custom.html"}
            for section in draft["sections"] if section["visible"] and section["body"]
        ]
        html = render_website({
            "name": draft["name"] or "Your name",
            "headline": draft["headline"],
            "sections": sections,
        }, draft["options"])
        filename = (slugify(draft["name"]) or "portfolio") + ".html"
        return HttpResponse(html, content_type="text/html; charset=utf-8", headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        })
