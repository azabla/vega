from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import username_validator

User = get_user_model()

# Usernames that would clash with app routes like vega.app/<username>
RESERVED_USERNAMES = {
    "admin", "api", "auth", "login", "logout", "register", "signup", "signin",
    "dashboard", "settings", "account", "accounts", "static", "media", "about",
    "help", "support", "pricing", "blog", "docs", "terms", "privacy", "www",
}


def validate_username_available(value):
    value = value.lower()
    if value in RESERVED_USERNAMES:
        raise serializers.ValidationError("This username is reserved.")
    return value


class LowercaseCharField(serializers.CharField):
    """Lowercases input before the field validators run."""

    def to_internal_value(self, data):
        return super().to_internal_value(data).lower()


class LowercaseEmailField(serializers.EmailField):
    def to_internal_value(self, data):
        return super().to_internal_value(data).lower()


def username_field(**kwargs):
    return LowercaseCharField(max_length=30, validators=[username_validator], **kwargs)


class UserSerializer(serializers.ModelSerializer):
    username = username_field(required=False)

    class Meta:
        model = User
        fields = ["id", "email", "username", "first_name", "last_name", "date_joined"]
        read_only_fields = ["id", "email", "date_joined"]

    def validate_username(self, value):
        value = validate_username_available(value)
        qs = User.objects.filter(username=value).exclude(pk=self.instance.pk if self.instance else None)
        if qs.exists():
            raise serializers.ValidationError("This username is already taken.")
        return value


class RegisterSerializer(serializers.ModelSerializer):
    email = LowercaseEmailField()
    username = username_field()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = ["email", "username", "password", "first_name", "last_name"]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate_username(self, value):
        value = validate_username_available(value)
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate(self, attrs):
        try:
            validate_password(attrs["password"], user=User(email=attrs["email"], username=attrs["username"]))
        except DjangoValidationError as e:
            raise serializers.ValidationError({"password": e.messages})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_old_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate_new_password(self, value):
        validate_password(value, user=self.context["request"].user)
        return value


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class LoginSerializer(TokenObtainPairSerializer):
    """Emails are stored lowercase, so match them case-insensitively at login."""

    def validate(self, attrs):
        attrs[self.username_field] = attrs[self.username_field].lower()
        return super().validate(attrs)
