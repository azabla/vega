# 04 — Multi-tenancy (one portfolio per user)

Every user owns their own portfolio. Visitors see it at `/u/<username>`, and the owner edits it through the `/api/me/` API (the future dashboard).

## Data model

| Model | Owner |
|-------|-------|
| `Portfolio` | `owner` — one-to-one with the user, created automatically at signup (`portfolio/signals.py`) |
| `About`, `Category`, `Skill`, `Project`, `Experience`, `Education`, `Certificate` | `owner` foreign key |
| `Contact` | `owner` = the user who received the message |
| `Service` | via `about.owner` |
| `ProjectImage`, `ProjectFeature`, `ProjectChallenge`, `LessonLearned`, `ProjectArchitecture` | via `project.owner` |

**Uniqueness is per owner.** Two users can both have a "Backend" category or a project with the slug `todo-app`:

| Constraint | Fields |
|-----------|--------|
| `unique_category_name_per_owner` | `owner, name` |
| `unique_category_slug_per_owner` / `skill` / `project` | `owner, slug` |

`generate_unique_slug` only checks the same owner's rows, so slugs get `-1`, `-2`, … suffixes per user.

**Uploads are stored per user:** `media/users/<user_id>/<kind>/<file>`, using `OwnerUploadTo` in `portfolio/utils.py`. Files uploaded before this change keep their old paths.

### Migrations

| Migration | What it does |
|-----------|--------------|
| `0012_owner_and_per_owner_uniqueness` | Adds nullable `owner` columns, per-owner constraints and upload paths. Makes `Portfolio` title, bio, phone and email optional (an empty portfolio exists at signup). |
| `0013_assign_existing_rows_to_owner` | Assigns existing rows to the **first superuser**. Fails with a clear message if rows exist but there's no superuser yet. |
| `0014_owner_required` | Makes `owner` NOT NULL |

## Public API — `/api/u/<username>/` (no login)

| Method | Path | Notes |
|--------|------|-------|
| GET | `profile/` | Includes `username` |
| GET | `about/` | `404` until the owner writes one |
| GET | `skills/`, `categories/`, `experience/` | |
| GET | `projects/`, `projects/<slug>/` | Card list / full detail |
| GET | `projects/featured/` | Up to 3 |
| GET | `projects/search/?q=` | Empty `q` returns `[]` |
| POST | `contact/` | `name`, `email`, `message`, `subject?`. Sent to that owner. Throttled to 5/min. |

An unknown or inactive username returns `404`.

> The old unscoped endpoints (`/api/profile/main/`, `/api/skills/`, …) have been removed.

## Owner API — `/api/me/` (Bearer token)

| Path | Methods | Notes |
|------|---------|-------|
| `profile/` | GET, PATCH, PUT | Created on first access |
| `about/` | GET, PATCH, PUT | Created on first access. Includes `services`. |
| `services/` | CRUD | Attached to your about section |
| `categories/` | CRUD | `slug` optional (generated from `name`) |
| `skills/` | CRUD | `category` must be one of **your** categories |
| `projects/` | CRUD | `skills`: list of **your** skill IDs. `slug` optional. |
| `project-images/`, `project-features/`, `project-challenges/`, `project-lessons/`, `project-architecture/` | CRUD | `project` must be **yours**. Filter with `?project=<id>`. |
| `experience/`, `education/`, `certificates/` | CRUD | See [05](05-master-profile.md) |
| `messages/` | GET, DELETE | Contact-form messages sent to you |

**Isolation rules**, all covered by tests:
- Querysets are filtered to `request.user`, so another user's object returns `404`, even for `DELETE`.
- Related fields (`category`, `skills`, `project`) only accept your own objects. Anything else returns `400`.
- `owner` is never accepted from or exposed to the client. It's a `HiddenField` set from the logged-in user.

File fields (`thumbnail`, `image`, `cv_file`, `profile_image`, …) accept `multipart/form-data` uploads.

### Example

```bash
API=http://127.0.0.1:8001/api
TOKEN=$(curl -s -X POST $API/auth/login/ -H "Content-Type: application/json" \
  -d '{"email":"vega@gmail.com","password":"vega"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['access'])")
H="Authorization: Bearer $TOKEN"

curl -X PATCH $API/me/profile/ -H "$H" -H "Content-Type: application/json" -d '{"title":"Backend Developer"}'
curl -X POST  $API/me/categories/ -H "$H" -H "Content-Type: application/json" -d '{"name":"Backend"}'
curl -X POST  $API/me/projects/ -H "$H" -F title=Vega -F summary="Portfolio SaaS" -F overview="..." -F thumbnail=@shot.png
curl $API/u/vega/projects/
```

## Frontend

- Routes: `/u/:username` shows that user's portfolio. `/` shows `VITE_PORTFOLIO_USERNAME` (set in `.env.development`, default `vega` in Docker).
- `usePortfolioUsername()` (`src/hooks/`) returns the username, and every `portfolioAPI` call takes it as its first argument.
- The contact form now posts to `/api/u/<username>/contact/` and shows the API's validation errors. Before, it only faked a success toast.

## Importing an existing portfolio

`import_portfolio` loads a `dumpdata portfolio` export into one account. It assigns new IDs, remaps foreign keys and many-to-many links, sets `owner`, and updates the user's existing profile instead of creating a second one. Unknown models (`auth.user`, `sessions`, the legacy `portfolio.projects`) are skipped. The whole import is one transaction.

```bash
python manage.py import_portfolio backups/portfolio.json --owner vega
```

## Admin

Superusers see everyone's content. The main models list `owner` and can be filtered by it.

## Next steps

- ~~React dashboard (login + forms) on top of `/api/me/`~~ Done, see [08](08-dashboard.md)
- SEO for public pages (server-rendered meta tags / Next.js)
- Media on S3/R2 (`django-storages`)
