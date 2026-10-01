from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

PASSWORD = "S3cure-pass!x"


class AuthAPITests(APITestCase):
    def setUp(self):
        cache.clear()  # reset auth throttling between tests

    def register(self, **overrides):
        data = {"email": "Jane@Example.com", "username": "Jane", "password": PASSWORD, **overrides}
        return self.client.post("/api/auth/register/", data, format="json")

    def login(self, email="jane@example.com", password=PASSWORD):
        return self.client.post("/api/auth/login/", {"email": email, "password": password}, format="json")

    def test_register_lowercases_and_returns_tokens(self):
        res = self.register()
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["user"]["email"], "jane@example.com")
        self.assertEqual(res.data["user"]["username"], "jane")
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)

    def test_register_rejects_duplicates_reserved_and_weak_passwords(self):
        self.register()
        res = self.register()
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", res.data)
        self.assertIn("username", res.data)

        res = self.register(email="a@b.com", username="admin")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", res.data)

        res = self.register(email="c@d.com", username="carl", password="123")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", res.data)

    def test_login_is_case_insensitive(self):
        self.register()
        self.assertEqual(self.login(email="JANE@example.com").status_code, status.HTTP_200_OK)
        self.assertEqual(self.login(password="wrong").status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_requires_auth_and_can_be_updated(self):
        self.register()
        self.assertEqual(self.client.get("/api/auth/me/").status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.login().data['access']}")
        res = self.client.patch("/api/auth/me/", {"username": "Jane-Doe", "email": "x@y.com"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["username"], "jane-doe")
        self.assertEqual(res.data["email"], "jane@example.com")  # read-only

        res = self.client.patch("/api/auth/me/", {"username": "dashboard"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_refresh_rotation_and_logout_blacklist(self):
        self.register()
        tokens = self.login().data
        res = self.client.post("/api/auth/token/refresh/", {"refresh": tokens["refresh"]}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        new = res.data

        # old refresh token is blacklisted after rotation
        res = self.client.post("/api/auth/token/refresh/", {"refresh": tokens["refresh"]}, format="json")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {new['access']}")
        res = self.client.post("/api/auth/logout/", {"refresh": new["refresh"]}, format="json")
        self.assertEqual(res.status_code, status.HTTP_205_RESET_CONTENT)
        res = self.client.post("/api/auth/token/refresh/", {"refresh": new["refresh"]}, format="json")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_change_password(self):
        self.register()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.login().data['access']}")
        res = self.client.post(
            "/api/auth/password/change/", {"old_password": "x", "new_password": "An0ther-pass!"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        res = self.client.post(
            "/api/auth/password/change/", {"old_password": PASSWORD, "new_password": "An0ther-pass!"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(self.login(password="An0ther-pass!").status_code, status.HTTP_200_OK)

    def test_login_is_throttled(self):
        codes = [self.login(email="z@z.com", password="x").status_code for _ in range(11)]
        self.assertEqual(codes[-1], status.HTTP_429_TOO_MANY_REQUESTS)
