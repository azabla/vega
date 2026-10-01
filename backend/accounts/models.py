from django.contrib.auth.models import AbstractUser, UserManager
from django.core.validators import RegexValidator
from django.db import models


username_validator = RegexValidator(
    regex=r"^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])?$",
    message=(
        "Username must be 3-30 characters: lowercase letters, numbers, "
        "hyphens or underscores, and must start and end with a letter or number."
    ),
)


class CustomUserManager(UserManager):
    def _create_user(self, username, email, password, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        return super()._create_user(
            username.lower(), self.normalize_email(email).lower(), password, **extra_fields
        )


class User(AbstractUser):
    """
    Login is by email. The username is public: it is used in the
    portfolio URL (e.g. vega.app/<username>).
    """

    username = models.CharField(
        max_length=30,
        unique=True,
        validators=[username_validator],
        error_messages={"unique": "This username is already taken."},
    )
    email = models.EmailField(
        unique=True,
        error_messages={"unique": "An account with this email already exists."},
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    objects = CustomUserManager()

    def __str__(self):
        return self.email
