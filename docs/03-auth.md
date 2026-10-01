# 03 — Custom user & auth API

The first step toward a multi-user SaaS. Every account gets a public **username** (used later in portfolio URLs such as `vega.app/<username>`) and logs in with **email + password**. The API uses JWT access and refresh tokens (`djangorestframework-simplejwt`).

## The `accounts` app

```
backend/accounts/
├── models.py       # User, CustomUserManager, username validator
├── serializers.py  # Register, User (me), ChangePassword, Logout
├── views.py        # RegisterView, MeView, ChangePasswordView, LogoutView
├── urls.py         # mounted at /api/auth/ (LoginView uses LoginSerializer)
├── tests.py        # API tests for every endpoint + throttling
├── admin.py        # User admin (email/username)
└── migrations/0001_initial.py
```

### `User` model

Extends `AbstractUser`, set via `AUTH_USER_MODEL = "accounts.User"`.

| Field | Rules |
|-------|-------|
| `email` | Unique, used to log in (`USERNAME_FIELD`), stored in lowercase |
| `username` | Unique, 3–30 chars, `a-z 0-9 - _`, starts and ends with a letter or number, stored in lowercase. Reserved words (`admin`, `api`, `login`, `dashboard`, …) are rejected because they would clash with app routes. |
| `first_name`, `last_name`, `is_staff`, `date_joined`, … | Inherited from `AbstractUser` |

Input is lowercased **before** validation (`LowercaseCharField` / `LowercaseEmailField` in `serializers.py`). So `Jane` registers as `jane`, and logging in as `JANE@example.com` works (`LoginSerializer`).

> **Why now?** Django only lets you switch `AUTH_USER_MODEL` before the first `migrate`. Doing it later means rebuilding the database. See *Existing databases* below.

## Endpoints

Base URL: `/api/auth/`

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| POST | `register/` | — | `email`, `username`, `password`, `first_name?`, `last_name?` | `201` `{user, access, refresh}` |
| POST | `login/` | — | `email`, `password` | `200` `{access, refresh}` |
| POST | `token/refresh/` | — | `refresh` | `200` `{access, refresh}` (a new refresh token each time) |
| POST | `logout/` | Bearer | `refresh` | `205`. The refresh token is blacklisted. |
| GET | `me/` | Bearer | — | `200` user |
| PATCH | `me/` | Bearer | `username?`, `first_name?`, `last_name?` | `200` user (email is read-only) |
| POST | `password/change/` | Bearer | `old_password`, `new_password` | `200` |

Send the access token as a header: `Authorization: Bearer <access>`.

### Token settings (`SIMPLE_JWT`)

| Setting | Value |
|---------|-------|
| Access token lifetime | 15 minutes |
| Refresh token lifetime | 7 days |
| Rotate refresh tokens | Yes. Each refresh returns a new refresh token and blacklists the old one. |
| Update `last_login` on login | Yes |

### Throttling

`register/` and `login/` are limited to **10 requests per minute per client** (`throttle_scope = "auth"`).

### Permissions

The default is now **`IsAuthenticated`** (secure by default). The public portfolio endpoints under `/api/u/<username>/` explicitly use `AllowAny` (see [04](04-multi-tenancy.md)). New endpoints are private unless marked public.

### Errors

Validation errors return `400`, keyed by field:

```json
{"username": ["This username is reserved."]}
{"password": ["This password is too short. It must contain at least 8 characters."]}
```

Bad credentials, or a missing, expired, or blacklisted token, return `401`. Throttled requests return `429`.

## Tests

`accounts/tests.py` covers registration (lowercasing, duplicates, reserved names, weak passwords), case-insensitive login, `me` GET/PATCH, refresh rotation, logout blacklisting, password change and throttling. Portfolio and isolation tests are in `portfolio/tests.py` (see [04](04-multi-tenancy.md)).

```bash
docker compose exec backend python manage.py test
```

## Examples (curl)

```bash
API=http://localhost:8000/api/auth

# Register
curl -X POST $API/register/ -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","username":"jane","password":"S3cure-pass!"}'

# Login
curl -X POST $API/login/ -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"S3cure-pass!"}'

# Who am I
curl $API/me/ -H "Authorization: Bearer <access>"

# Refresh
curl -X POST $API/token/refresh/ -H "Content-Type: application/json" -d '{"refresh":"<refresh>"}'

# Logout
curl -X POST $API/logout/ -H "Authorization: Bearer <access>" \
  -H "Content-Type: application/json" -d '{"refresh":"<refresh>"}'
```

## Frontend integration (next step)

Not built yet. The plan:
1. Store the `access` token in memory and the `refresh` token in `localStorage` (or move to httpOnly cookies later).
2. Use an axios request interceptor to add `Authorization: Bearer`.
3. Use an axios response interceptor so that on a `401` it calls `token/refresh/` once, retries the request, and logs out if that fails.

## Existing databases

The custom user model needs a **fresh database**. The current production database on Render was migrated with the default `auth.User`, so running `migrate` there fails with `InconsistentMigrationHistory`. To move production:

```bash
# 1. Export from the OLD database using code that matches its schema
#    (commit 610c527 = before owner fields were added)
git worktree add ../vega-export 610c527
cd ../vega-export/backend
DATABASE_URL='<old render url>' ../../vega/backend/env/bin/python manage.py \
  dumpdata portfolio --indent 2 -o ../../vega/backend/backups/portfolio-prod.json
cd ../../vega && git worktree remove ../vega-export

# 2. Create a NEW empty Postgres database on Render, point DATABASE_URL at it
cd backend
python manage.py migrate
python manage.py createsuperuser

# 3. Import the content into your account (see 04-multi-tenancy.md)
python manage.py import_portfolio backups/portfolio-prod.json --owner <your username>
```

`backups/` is in `.gitignore`. Exports contain contact-form messages (visitors' emails).

## Not included yet

- Revoking other sessions on password change. Existing refresh tokens stay valid until they expire (7 days).
- Password reset by email (needs an email provider, e.g. SMTP or Resend)
- Email verification
- Social login (Google/GitHub). Planned with `django-allauth`.
- Linking portfolio models to a user (`owner` foreign key). This is the next task.
