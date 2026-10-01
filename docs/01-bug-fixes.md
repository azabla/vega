# 01 — Bug fixes

Fixed while reviewing the project before turning it into a SaaS.

## Backend

| File | Problem | Fix |
|------|---------|-----|
| `portfolio/views.py` — `ContactViewSet.create` | `serializer.errrors` typo, so any invalid contact form crashed with a 500. It also returned **404** for validation errors. | `serializer.errors` with **400 Bad Request** |
| `portfolio/views.py` — `ProjectViewSet.search` | `GET /api/projects/search/` with no `?q=` passed `None` into `icontains` and crashed. | Strips `q`; an empty query returns `[]` |
| `portfolio/services.py` — `get_projects_by_technology` | `technologies_slug=slug` (single underscore) is not a valid lookup. | `technologies__slug=slug` |
| `core/settings.py` | `env("DATABASE_URL")` raised `ImproperlyConfigured` when the variable was missing, so the SQLite fallback never ran. | `env("DATABASE_URL", default=None)` |
| `core/settings.py` — `MIDDLEWARE` | `CommonMiddleware` listed twice, and `SecurityMiddleware` was not first. | Removed the duplicate. Order is now Security → WhiteNoise → CORS → Sessions → Common → … |
| `portfolio/models.py` | Upload path typos `porjects/gallery/` and `comapnies/`. | `projects/gallery/` and `companies/` (migration `0011`). Existing files keep their stored paths; only new uploads use the new folders. |
| `portfolio/admin.py` | `ProjectAdmin.ordering` defined twice. | Removed the duplicate |
| Several files | Accidental IDE auto-imports: `from ast import mod`, `from turtle import title`, `from doctest import debug`, `from unicodedata import category`, `from django.forms import ImageField`. `turtle` pulls in Tkinter and can fail on servers. | Removed |

## Frontend

| File | Problem | Fix |
|------|---------|-----|
| `src/services/api.js` | Unused duplicate of `src/api/axios.js`. It was also broken: `import axios from axios` without quotes, and `baseUrl` instead of `baseURL`. | Deleted |
| `src/services/portfolioAPI.js` | `api.post('contact', …)` has no trailing slash, and Django can't redirect a POST to add one, so the contact form failed. `'/projects/featured'` cost an extra 301 redirect. | `'/contact/'` and `'/projects/featured/'` |

## Known issues not yet fixed

- `getSkillsByCategory` calls `/skills/by_category/`, which doesn't exist in the backend.
- `Experience.comap_logo` is a typo in the field name. Renaming it changes the API field, so it should be done together with a frontend update.
- `Experience.description` is a `TextField(max_length=220)`. The limit only applies in forms and the API, not in the database. Use `CharField` if 220 is intended.
- `Project.Meta.ordering = ["-featured", "-created_at", "order"]`: `order` never takes effect because `created_at` is always unique.
